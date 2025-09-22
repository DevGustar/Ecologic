// src/App.jsx (VERSÃO CORRIGIDA E SIMPLIFICADA)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AssetDetailPage from './pages/AssetDetailPage';
import NationalRiskPage from './pages/NationalRiskPage'; // Importa a página de risco nacional
import './App.css'; // O CSS principal continua aqui

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/asset/:assetId" element={<AssetDetailPage />} />
      {/* Rota para a Visão Nacional de Risco */}
      <Route path="/national-risk" element={<NationalRiskPage />} />
    </Routes>
  );
}

export default App;