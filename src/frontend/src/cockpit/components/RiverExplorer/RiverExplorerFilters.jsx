// src/frontend/cockpit/components/RiverExplorer/RiverExplorerFilters.jsx

import React from 'react';
import './RiverExplorer.css';

const RiverExplorerFilters = ({ filters, setFilters, riskLevels, onSearch, isLoading }) => {
  
  // Lista de estados para o dropdown (Simplificado)
  const STATES = ['MG', 'RS', 'SP', 'AC', 'BA', 'RJ', 'PR']; 

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Garante que o valor é MAIÚSCULO para bater com o backend
    setFilters(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleClear = () => {
    const emptyFilters = { estado: '', municipio: '', classificacao: '' };
    setFilters(emptyFilters);
    onSearch(emptyFilters); // Chama a busca com filtros vazios para limpar a tabela
  };
  
  return (
    <div className="filters-panel">
      <h3 className="filter-title">Filtros de Auditoria</h3>
      
      <div className="filters-grid">
        {/* Filtro 1: ESTADO */}
        <select name="estado" value={filters.estado} onChange={handleChange} disabled={isLoading}>
          <option value="">Filtrar por Estado</option>
          {STATES.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        {/* Filtro 2: MUNICÍPIO (Input de texto simples por enquanto) */}
        <input 
          type="text" 
          name="municipio" 
          placeholder="Nome do Município" 
          value={filters.municipio} 
          onChange={handleChange}
          disabled={isLoading}
        />

        {/* Filtro 3: CLASSIFICAÇÃO */}
        <select name="classificacao" value={filters.classificacao} onChange={handleChange} disabled={isLoading}>
          <option value="">Filtrar por Risco</option>
          {riskLevels.map(level => <option key={level} value={level}>{level}</option>)}
        </select>
      </div>

      <div className="filter-actions">
        <button onClick={() => onSearch(filters)} disabled={isLoading} className="button-primary">
          {isLoading ? 'Buscando...' : 'Buscar Rios'}
        </button>
        <button onClick={handleClear} disabled={isLoading} className="button-secondary">
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default RiverExplorerFilters;