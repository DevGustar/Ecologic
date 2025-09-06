// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AssetDetailPage from './pages/AssetDetailPage';
import './App.css'; // O CSS principal continua aqui

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/asset/:assetId" element={<AssetDetailPage />} />
    </Routes>
  );
}

export default App;