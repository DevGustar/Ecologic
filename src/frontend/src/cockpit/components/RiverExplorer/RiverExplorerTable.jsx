// src/cockpit/components/RiverExplorerTable.jsx (COM CLIQUE NA LINHA)

import React from 'react';
import './RiverExplorer.css';

const getStatusColorClass = (level) => {
    if (!level) return '';
    const text = String(level).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    if (text.includes('CRIT')) return 'status-critico';
    if (text.includes('ALT')) return 'status-alto';
    if (text.includes('MED')) return 'status-medio';
    if (text.includes('BAIX')) return 'status-baixo';
    if (text.includes('MIN')) return 'status-minimo';
    if (text.startsWith('M')) return 'status-medio'; 
    return ''; 
};

const getRiskScoreColorClass = (riskNote) => {
    const note = parseFloat(riskNote);
    if (note >= 8) return 'score-critico';
    if (note >= 6) return 'score-alto';
    if (note >= 4) return 'score-medio';
    if (note >= 2) return 'score-baixo';
    return 'score-minimo';
};

// Recebe onSelectRiver e selectedMunicipality
const RiverExplorerTable = ({ rivers, isLoading, error, totalResults, onSelectRiver, selectedMunicipality }) => {
  
  if (isLoading) return <div className="table-loading">Carregando dados da auditoria...</div>;
  if (error) return <div className="table-error">Erro: {error}</div>;

  return (
    <div className="explorer-table-container">
      <div className="table-header-row">
        <h3 className="results-count">Resultados da Auditoria: <strong>{totalResults} rios</strong> listados</h3>
      </div>
      
      <div className="table-scroll">
        <table className="rivers-table">
            <thead>
            <tr>
                <th>UF</th>
                <th>Município</th>
                <th>Rio / Corpo Hídrico</th>
                <th className="th-center">Nota Calculada</th>
                <th className="th-center">Classificação</th>
                <th className="th-center">Frequência</th>
                <th className="th-center">Vulnerabilidade</th>
                <th className="th-center">Impacto</th>
            </tr>
            </thead>
            <tbody>
            {rivers.map((river, index) => {
                // Verifica se esta linha é a selecionada
                const isSelected = selectedMunicipality === river.NM_MUN_PADRONIZADO;
                
                return (
                    <tr 
                        key={index} 
                        // Ao clicar, avisa a página mãe
                        onClick={() => onSelectRiver(river.NM_MUN_PADRONIZADO)}
                        // Adiciona classe 'selected' se for o escolhido
                        className={isSelected ? 'selected-row' : ''}
                        style={{ cursor: 'pointer' }} // Mostra a mãozinha
                    >
                        <td>{river['Sigla do Estado']}</td>
                        <td>{river.NM_MUN_PADRONIZADO}</td>
                        <td className="rio-name">{river['Nome do Rio']}</td>
                        
                        <td className={`td-center font-bold ${getRiskScoreColorClass(river['Nota_de_Risco'])}`}>
                            {river['Nota_de_Risco'].toFixed(2)}
                        </td>

                        <td className={`td-center font-bold ${getStatusColorClass(river.Classificacao_Risco)}`}>
                            {river.Classificacao_Risco}
                        </td>

                        <td className={`td-center ${getStatusColorClass(river.Frequencia)}`}>
                            {river.Frequencia}
                        </td>
                        <td className={`td-center ${getStatusColorClass(river.Vulnerabilidade)}`}>
                            {river.Vulnerabilidade}
                        </td>
                        <td className={`td-center ${getStatusColorClass(river.Impacto)}`}>
                            {river.Impacto}
                        </td>
                    </tr>
                );
            })}
            </tbody>
        </table>
        {totalResults === 0 && <div className="no-results">Nenhum registro encontrado. Tente mudar os filtros.</div>}
      </div>
    </div>
  );
};

export default RiverExplorerTable;