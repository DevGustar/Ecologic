// src/cockpit/pages/RiverExplorerPage.jsx (LAYOUT TELA DIVIDIDA)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RiverExplorerTable from '../components/RiverExplorer/RiverExplorerTable';
import RiverExplorerFilters from '../components/RiverExplorer/RiverExplorerFilters';
import RiverExplorerMap from '../components/RiverExplorer/RiverExplorerMap'; 
import './RiverExplorerPage.css'; 

function RiverExplorerPage() {
  const [filters, setFilters] = useState({
    estado: '',
    municipio: '',
    classificacao: ''
  });
  const [rivers, setRivers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const RISK_LEVELS = ['CRÍTICO', 'ALTO', 'MODERADO', 'BAIXO', 'MÍNIMO'];

  const fetchRivers = async (currentFilters) => {
    setIsLoading(true);
    setError(null);
    const queryParams = new URLSearchParams();
    if (currentFilters.estado) queryParams.append('estado', currentFilters.estado);
    if (currentFilters.municipio) queryParams.append('municipio', currentFilters.municipio);
    if (currentFilters.classificacao) queryParams.append('classificacao', currentFilters.classificacao);

    try {
      const response = await fetch(`http://127.0.0.1:8000/macro/rivers/search?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Falha na busca exploratória.');
      const data = await response.json();
      setRivers(data);
    } catch (err) {
      setError(err.message);
      setRivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRivers(filters); }, [filters]);

  return (
    <div className="explorer-page-container">
      
      {/* --- COLUNA DA ESQUERDA (SIDEBAR FIXA) --- */}
      <aside className="explorer-sidebar">
        <div className="explorer-header">
          <Link to="/" className="back-link">&larr; Voltar ao Cockpit</Link>
          <h1>Explorador GRC</h1>
          <p className="subtitle">Auditoria de Risco Estrutural</p>
        </div>

        {/* Os filtros ficam aqui na esquerda */}
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
        {/* O Mapa vem primeiro */}
        <RiverExplorerMap 
            rivers={rivers} 
            isLoading={isLoading} 
        />
        
        {/* A Tabela vem depois */}
        <RiverExplorerTable 
          rivers={rivers} 
          isLoading={isLoading}
          error={error}
          totalResults={rivers.length}
        />
      </main>

    </div>
  );
}

export default RiverExplorerPage;