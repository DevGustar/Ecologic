// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
import CreateAssetModal from '../components/modals/CreateAssetModal';

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);

  // 1. A lógica de buscar os ativos agora está numa função reutilizável
  const fetchAssets = async () => {
    try {
      const apiUrl = 'http://127.0.0.1:8000/assets';
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Falha ao buscar os ativos');
      }
      const data = await response.json();
      console.log("Ativos atualizados e recebidos do backend:", data);
      setAssets(data); // Atualiza o estado com a nova lista de ativos
    } catch (error) {
      console.error("Erro ao buscar ativos:", error);
    }
  };

  // 2. O useEffect agora simplesmente chama a nossa nova função quando a página carrega
  useEffect(() => {
    fetchAssets();
  }, []); // O array vazio [] garante que isto execute apenas uma vez ao montar

  // 3. Esta função será chamada pelo modal após um ativo ser criado com sucesso
  const handleAssetCreated = () => {
    setIsModalOpen(false); // Primeiro, fecha o modal
    fetchAssets();         // Depois, re-busca a lista de ativos para atualizar o mapa
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onOpenCreateAssetModal={() => setIsModalOpen(true)} />
      
      <main className="main-content">
        <InteractiveMap assets={assets} />
      </main>

      <CreateAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} // O botão 'Cancelar' ou 'X' apenas fecha o modal
        onSuccess={handleAssetCreated}       // A prop 'onSuccess' é chamada após o sucesso
      />
    </div>
  );
}

export default DashboardPage;