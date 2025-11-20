// src/cockpit/pages/RiverExplorerPage.jsx (VERSÃO FINAL - IMPORTS E CLIQUES CORRIGIDOS)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Imports corretos da pasta 'components'
import RiverExplorerTable from '../components/RiverExplorer/RiverExplorerTable';
import RiverExplorerFilters from '../components/RiverExplorer/RiverExplorerFilters';
import RiverExplorerMap from '../components/RiverExplorer/RiverExplorerMap';

import './RiverExplorerPage.css'; 

function RiverExplorerPage() {
  // Estado dos filtros
  const [filters, setFilters] = useState({
    estado: '',
    municipio: '',
    classificacao: ''
  });

  // Estado dos dados
  const [rivers, setRivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // NOVO: Estado para saber qual município foi clicado (CORREÇÃO DO ERRO)
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);

  const RISK_LEVELS = ['CRÍTICO', 'ALTO', 'MODERADO', 'BAIXO', 'MÍNIMO'];

  const fetchRivers = async (currentFilters) => {
    setIsLoading(true);
    setError(null);
    // Limpa a seleção ao fazer uma nova busca
    setSelectedMunicipality(null);
    
    const queryParams = new URLSearchParams();
    if (currentFilters.estado) queryParams.append('estado', currentFilters.estado);
    if (currentFilters.municipio) queryParams.append('municipio', currentFilters.municipio);
    if (currentFilters.classificacao) queryParams.append('classificacao', currentFilters.classificacao);

    try {
      const response = await fetch(`http://127.0.0.1:8000/macro/rivers/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Falha na busca exploratória de rios.');
      
      const data = await response.json();
      setRivers(data);
    } catch (err) {
      console.error("Erro na busca:", err);
      setError(err.message);
      setRivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRivers(filters); 
  }, [filters]);

  return (
    <div className="explorer-page-container">
      
      {/* --- COLUNA DA ESQUERDA (SIDEBAR FIXA) --- */}
      <aside className="explorer-sidebar">
        <div className="explorer-header">
          <Link to="/" className="back-link">&larr; Voltar ao Cockpit</Link>
          <h1 className="explorer-title">Explorador GRC</h1>
          <p className="explorer-subtitle">Auditoria de Risco Estrutural</p>
        </div>

        <RiverExplorerFilters 
          filters={filters} 
          setFilters={setFilters} 
          riskLevels={RISK_LEVELS}
          onSearch={fetchRivers}
          isLoading={isLoading}
        />
      </aside>

      {/* --- COLUNA DA DIREITA (CONTEÚDO ROLÁVEL) --- */}
      <main className="explorer-content">
        {/* 1. Mapa (Recebe o selecionado para destacar) */}
        <RiverExplorerMap 
            rivers={rivers} 
            isLoading={isLoading} 
            selectedMunicipality={selectedMunicipality} // Passa a seleção para o mapa
        />
        
        {/* 2. Tabela (Recebe a função para selecionar) */}
        <RiverExplorerTable 
          rivers={rivers} 
          isLoading={isLoading}
          error={error}
          totalResults={rivers.length}
          onSelectRiver={(mun) => setSelectedMunicipality(mun)} // CORREÇÃO: Passa a função!
          selectedMunicipality={selectedMunicipality} // Passa o estado para destacar a linha
        />
      </main>

    </div>
  );
}

export default RiverExplorerPage;