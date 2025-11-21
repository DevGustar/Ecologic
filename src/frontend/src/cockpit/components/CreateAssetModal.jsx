// src/cockpit/components/CreateAssetModal.jsx

import React, { useState } from 'react';
import './CreateAssetModal.css';

const CreateAssetModal = ({ isOpen, onClose, onAssetCreated }) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Chama a API do Backend
      const response = await fetch('http://127.0.0.1:8000/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: formData.name,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude)
        })
      });

      if (!response.ok) throw new Error('Erro ao criar ativo.');

      // Sucesso!
      alert(`Ativo "${formData.name}" criado com sucesso! O risco foi calculado.`);
      
      // Limpa o form
      setFormData({ name: '', latitude: '', longitude: '' });
      
      // Notifica o pai (opcional, para recarregar lista) e fecha
      if (onAssetCreated) onAssetCreated();
      onClose();

    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>Criar Novo Ativo</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Ativo</label>
            <input 
              type="text" 
              name="name" 
              placeholder="Ex: Fazenda Santa Maria" 
              value={formData.name}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="coords-row">
            <div className="form-group">
              <label>Latitude</label>
              <input 
                type="number" 
                step="any" 
                name="latitude" 
                placeholder="Ex: -15.7801" 
                value={formData.latitude}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input 
                type="number" 
                step="any" 
                name="longitude" 
                placeholder="Ex: -47.9292" 
                value={formData.longitude}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Ativo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateAssetModal;