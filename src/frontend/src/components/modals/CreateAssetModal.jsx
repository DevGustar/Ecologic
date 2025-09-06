// src/components/modals/CreateAssetModal.jsx

import React, { useState } from 'react';

function CreateAssetModal({ isOpen, onClose }) {
  // Se o modal não estiver aberto, não renderiza nada.
  if (!isOpen) {
    return null;
  }

  // Estados para controlar os inputs do formulário
  const [assetName, setAssetName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Estados para dar feedback ao usuário (carregando, erro)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Função que lida com o envio do formulário para o backend
  const handleSubmit = async (event) => {
    event.preventDefault(); // Previne o recarregamento da página
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Cria o objeto de dados com os nomes corretos ('latitude', 'longitude')
      const newAsset = {
        name: assetName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };

      // A URL correta do seu backend FastAPI
      const apiUrl = 'http://127.0.0.1:8000/assets';

      // 2. Faz a requisição POST, enviando os dados como JSON
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAsset),
      });

      // 3. Verifica se a resposta da API indica um erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // O erro do FastAPI com Pydantic geralmente vem no campo 'detail'
        throw new Error(errorData.detail || `Erro ${response.status}: Falha ao criar o ativo.`);
      }

      // 4. Se tudo deu certo
      const createdAsset = await response.json();
      console.log('Ativo criado com sucesso:', createdAsset);
      alert(`Ativo "${createdAsset.name}" foi criado com sucesso!`);
      
      onClose(); // Fecha o modal

    } catch (err) {
      // 5. Se deu algum erro, guarda a mensagem para exibir na tela
      console.error("Erro ao enviar o ativo:", err);
      setError(err.message);
    } finally {
      // 6. Independentemente do resultado, para o estado de "carregando"
      setIsSubmitting(false);
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
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (ex: -15.7801)"
                  required
                />
                <input
                  type="number"
                  step="any"
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