// src/pages/DashboardPage.jsx

import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';
// Tente este caminho. Adicione o .jsx explicitamente para testar.
import CreateAssetModal from '../components/modals/CreateAssetModal';

function DashboardPage() {
  // 3. Crie o estado para controlar a visibilidade do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* 4. Passe a função para abrir o modal para a Sidebar */}
      <Sidebar onOpenCreateAssetModal={() => setIsModalOpen(true)} />
      
      <main className="main-content">
        <InteractiveMap />
      </main>

      {/* 5. Renderize o modal aqui */}
      <CreateAssetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

export default DashboardPage;