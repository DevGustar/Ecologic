// src/App.jsx (VERSÃO OTIMIZADA COM LAZY LOADING)

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// MUDANÇA CRÍTICA: Definimos as páginas como lazy-loaded para code splitting
// A performance inicial da aplicação será muito melhor!
const CockpitPage = lazy(() => import('./cockpit/pages/CockpitPage'));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
const RiverExplorerPage = lazy(() => import('./cockpit/pages/RiverExplorerPage')); // Nova localização

// Importa o seu CSS global
import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      {/* O Suspense mostra um fallback (ex: loading...) enquanto o código da página é carregado */}
      <Suspense fallback={<div className="loading-screen">Carregando Ecologic 2.0...</div>}>
        <Routes>
          {/* Rota principal "/" agora carrega o CockpitPage */}
          <Route path="/" element={<CockpitPage />} /> 
          
          {/* MUDANÇA: Rota do Explorador GRC na nova localização */}
          <Route path="/grc-explorer" element={<RiverExplorerPage />} />
          
          {/* Rota da sua página de ativo (AssetDetailPage) */}
          <Route path="/asset/:assetId" element={<AssetDetailPage />} />
          
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;