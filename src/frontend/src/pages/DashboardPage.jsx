// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from 'react'; // 1. Importe useEffect
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
import CreateAssetModal from '../components/modals/CreateAssetModal';

function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 2. Novo estado para guardar a lista de ativos
  const [assets, setAssets] = useState([]);

  // 3. useEffect para buscar os dados dos ativos quando a página carrega
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const apiUrl = 'http://127.0.0.1:8000/assets';
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Falha ao buscar os ativos');
        }
        const data = await response.json();
        console.log("Ativos recebidos do backend:", data);
        setAssets(data); // Guarda os ativos no nosso estado
      } catch (error) {
        console.error("Erro ao buscar ativos:", error);
      }
    };

    fetchAssets();
  }, []); // O array vazio [] faz com que isto execute apenas uma vez

  // Função para recarregar os ativos (ex: depois de criar um novo)
  const handleAssetCreated = async () => {
    // Simplesmente fechamos o modal, mas no futuro podemos recarregar a lista de ativos aqui
    setIsModalOpen(false);
    // Para recarregar a lista:
    // const response = await fetch('http://127.0.0.1:8000/assets');
    // const data = await response.json();
    // setAssets(data);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar onOpenCreateAssetModal={() => setIsModalOpen(true)} />
      
      <main className="main-content">
        {/* 4. Passamos a lista de ativos para o mapa como uma prop */}
        <InteractiveMap assets={assets} />
      </main>

      <CreateAssetModal 
        isOpen={isModalOpen} 
        onClose={handleAssetCreated} // Usamos a nova função para fechar o modal
      />
    </div>
  );
}

export default DashboardPage;