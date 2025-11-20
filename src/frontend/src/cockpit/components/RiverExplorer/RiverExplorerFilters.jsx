// src/cockpit/components/RiverExplorerFilters.jsx

import React, { useState, useEffect } from 'react';
import './RiverExplorer.css';

// Recebe 'filters' da página mãe. Se não receber, usa {} para não quebrar.
const RiverExplorerFilters = ({ filters = {}, setFilters, riskLevels, onSearch, isLoading }) => {
  
  const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [isLoadingMun, setIsLoadingMun] = useState(false);

  useEffect(() => {
    const fetchMunicipalities = async () => {
      setIsLoadingMun(true);
      try {
        let url = 'http://127.0.0.1:8000/macro/options/municipalities';
        // Verifica se filters.estado existe antes de usar
        if (filters && filters.estado) {
            url += `?estado=${filters.estado}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setMunicipalitiesList(data.municipalities);
        }
      } catch (error) {
        console.error("Erro ao carregar lista de municípios:", error);
      } finally {
        setIsLoadingMun(false);
      }
    };

    fetchMunicipalities();
  }, [filters?.estado]); // Só roda se o estado mudar

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFilters(prev => {
        const newFilters = { ...prev, [name]: value };
        if (name === 'estado') {
            newFilters.municipio = '';
        }
        return newFilters;
    });
  };

  const handleClear = () => {
    const emptyFilters = { estado: '', municipio: '', classificacao: '' };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };
  
  return (
    <div className="filters-panel">
      <h3 className="filter-title">Filtros de Auditoria</h3>
      
      <div className="filters-grid">
        <select name="estado" value={filters.estado || ''} onChange={handleChange} disabled={isLoading}>
          <option value="">Todos os Estados</option>
          {STATES.map(state => <option key={state} value={state}>{state}</option>)}
        </select>

        <select 
          name="municipio" 
          value={filters.municipio || ''} 
          onChange={handleChange} 
          disabled={isLoading || isLoadingMun} 
        >
          <option value="">
             {isLoadingMun ? 'Carregando...' : 'Todos os Municípios'}
          </option>
          {municipalitiesList.map((mun, index) => (
            <option key={index} value={mun}>
              {mun}
            </option>
          ))}
        </select>

        <select name="classificacao" value={filters.classificacao || ''} onChange={handleChange} disabled={isLoading}>
          <option value="">Todas as Classificações</option>
          {riskLevels && riskLevels.map(level => <option key={level} value={level}>{level}</option>)}
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