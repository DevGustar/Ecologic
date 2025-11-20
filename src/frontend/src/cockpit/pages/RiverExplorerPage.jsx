// src/frontend/cockpit/pages/RiverExplorerPage.jsx (A NOVA PÁGINA DE AUDITORIA)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RiverExplorerTable from '../components/RiverExplorer/RiverExplorerTable';
import RiverExplorerFilters from '../components/RiverExplorer/RiverExplorerFilters';
import './RiverExplorerPage.css'; // O CSS da página

function RiverExplorerPage() {
  const [filters, setFilters] = useState({
    estado: '',
    municipio: '',
    classificacao: ''
  });
  const [rivers, setRivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lista de classificações
  const RISK_LEVELS = ['CRÍTICO', 'ALTO', 'MODERADO', 'BAIXO', 'MÍNIMO'];

  // Função para buscar os dados (ela será re-executada sempre que o filtro for aplicado)
  const fetchRivers = async (currentFilters) => {
    setIsLoading(true);
    setError(null);
    
    // Converte os filtros para query params
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
      setError(err.message);
      setRivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Busca os rios na inicialização (sem filtros)
    fetchRivers(filters); 
  }, [filters]); // NOVO: Refetch sempre que 'filters' for atualizado

  return (
    <div className="explorer-page-container">
      <header className="explorer-header">
        <Link to="/" className="back-link">&larr; Voltar ao Cockpit Mestre</Link>
        <h1>Análise Exploratória GRC (Rios)</h1>
        <p className="subtitle">Ferramenta de Auditoria do Risco Estrutural (Base ANA)</p>
      </header>

      <div className="explorer-content">
        <RiverExplorerFilters 
          filters={filters} 
          setFilters={setFilters} 
          riskLevels={RISK_LEVELS}
          onSearch={fetchRivers} // Passa a função de busca
          isLoading={isLoading}
        />
        
        <RiverExplorerTable 
          rivers={rivers} 
          isLoading={isLoading}
          error={error}
          totalResults={rivers.length}
        />
      </div>
    </div>
  );
}

export default RiverExplorerPage;  