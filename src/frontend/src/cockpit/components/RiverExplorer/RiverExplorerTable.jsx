// src/frontend/cockpit/components/RiverExplorer/RiverExplorerTable.jsx (O CORAÇÃO DA AUDITORIA)

import React from 'react';
import './RiverExplorer.css';

const RiverExplorerTable = ({ rivers, isLoading, error, totalResults }) => {

  const getRiskColorClass = (riskNote) => {
    if (riskNote >= 8) return 'risk-critico';
    if (riskNote >= 6) return 'risk-alto';
    if (riskNote >= 4) return 'risk-medio';
    if (riskNote >= 2) return 'risk-baixo';
    return 'risk-minimo'; // Para a nota 0 ou 1
  };
  
  if (isLoading) {
    return <div className="table-loading">Carregando {totalResults} resultados...</div>;
  }

  if (error) {
    return <div className="table-error">Erro ao carregar dados: {error}</div>;
  }
  
  return (
    <div className="explorer-table-container">
      <h3 className="results-count">Total de Rios Encontrados: <strong>{totalResults}</strong></h3>
      
      <table className="rivers-table">
        <thead>
          <tr>
            <th>UF</th>
            <th>Nome do Rio</th>
            <th>Município</th>
            <th className="th-center">Nota Risco</th>
            <th className="th-center">Frequência</th>
            <th className="th-center">Vulnerabilidade</th>
            <th className="th-center">Impacto</th>
          </tr>
        </thead>
        <tbody>
          {rivers.map((river, index) => (
            <tr key={index}>
              <td>{river['Sigla do Estado']}</td>
              <td>{river['Nome do Rio']}</td>
              <td>{river.NM_MUN_PADRONIZADO}</td>
              <td className={`td-score ${getRiskColorClass(river['Nota_de_Risco'])}`}>
                {river['Nota_de_Risco'].toFixed(2)}
              </td>
              <td className="td-center">{river.Frequencia}</td>
              <td className="td-center">{river.Vulnerabilidade}</td>
              <td className="td-center">{river.Impacto}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {totalResults === 0 && <div className="no-results">Nenhum rio encontrado com os filtros aplicados.</div>}
    </div>
  );
};

export default RiverExplorerTable;