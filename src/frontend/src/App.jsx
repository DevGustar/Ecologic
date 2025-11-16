// src/App.jsx (VERSÃO FINAL CORRIGIDA E LIMPA)

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. Importa a sua página de análise de ativo (que já existe)
import AssetDetailPage from './pages/AssetDetailPage';

// 2. IMPORTA A NOSSA NOVA PÁGINA MESTRA ("O COCKPIT")
import CockpitPage from './cockpit/pages/CockpitPage'; 

// 3. (NÃO importamos mais 'NationalRiskPage', pois ela vai ser substituída)

// Importa o seu CSS global
import './App.css'; 

function App() {
  return (
    // O BrowserRouter PAI, que comanda tudo
    <BrowserRouter>
      <Routes>
        {/* Rota principal "/" agora carrega o novo CockpitPage */}
        <Route path="/" element={<CockpitPage />} /> 
        
        {/* A rota da sua página de ativo continua a mesma */}
        <Route path="/asset/:assetId" element={<AssetDetailPage />} />
        
        {/* A rota que estava a dar erro (para NationalRiskPage) foi removida */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;