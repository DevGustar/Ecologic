// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
import CreateAssetModal from '../components/modals/CreateAssetModal';

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  // Novo estado para o modo de visualização, começa em 'national' (Visão Nacional)
  const [viewMode, setViewMode] = useState('national'); 

  // Função para buscar os ativos do backend
  const fetchAssets = async () => {
    try {
      const apiUrl = 'http://127.0.0.1:8000/assets';
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Falha ao buscar os ativos');
      }
      const data = await response.json();
      console.log("Ativos recebidos do backend:", data);
      setAssets(data);
    } catch (error) {
      console.error("Erro ao buscar ativos:", error);
    }
  };

  // useEffect para buscar os dados dos ativos quando a página carrega
  useEffect(() => {
    fetchAssets();
  }, []); // O array vazio [] faz com que isto execute apenas uma vez

  // Função chamada pelo modal após um ativo ser criado com sucesso
  const handleAssetCreated = () => {
    setIsModalOpen(false); // Fecha o modal
    fetchAssets();         // Re-busca a lista de ativos para atualizar o mapa
  };

  return (
    <div className="dashboard-layout">
      {/* Passa o estado e a função de mudança para a Sidebar */}
      <Sidebar 
        onOpenCreateAssetModal={() => setIsModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <main className="main-content">
        {/* Passa o modo de visualização também para o Mapa */}
        <InteractiveMap assets={assets} viewMode={viewMode} />
      </main>

      <CreateAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} // 'Cancelar' apenas fecha
        onSuccess={handleAssetCreated}       // 'Salvar' fecha e atualiza
      />
    </div>
  );
}

export default DashboardPage;