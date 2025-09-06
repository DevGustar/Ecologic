// src/components/modals/CreateAssetModal.jsx

import React, { useState } from 'react';

// O componente agora recebe 'onSuccess' para notificar a criação bem-sucedida
function CreateAssetModal({ isOpen, onClose, onSuccess }) {
  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Estados para controlar os inputs do formulário
  const [assetName, setAssetName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Estados para feedback ao usuário
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newAsset = {
      name: assetName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };

    try {
      const apiUrl = 'http://127.0.0.1:8000/assets';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAsset),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ${response.status}: Falha ao criar o ativo.`);
      }

      const createdAsset = await response.json();
      console.log('Ativo criado com sucesso:', createdAsset);
      alert(`Ativo "${createdAsset.name}" foi criado com sucesso!`);
      
      // Chama a função onSuccess que recebemos da DashboardPage.
      // Ela vai tratar de fechar o modal E de recarregar os dados.
      onSuccess();

    } catch (err) {
      console.error("Erro ao enviar o ativo:", err);
      setError(err.message);
      setIsSubmitting(false); // Para o loading apenas se der erro
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Novo Ativo</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Exibe uma mensagem de erro no topo do formulário, se houver */}
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="assetName">Nome do Ativo</label>
              <input
                type="text"
                id="assetName"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Ex: Fazenda Santa Maria"
                required
              />
            </div>

            <div className="form-group">
              <label>Coordenadas</label>
              <div className="coordinates-group">
                <input
                  type="number"
                  step="any" // Permite casas decimais
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (ex: -15.7801)"
                  required
                />
                <input
                  type="number"
                  step="any" // Permite casas decimais
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (ex: -47.9292)"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="button-secondary" disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Ativo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateAssetModal;