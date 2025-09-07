// src/components/modals/AssetListModal.jsx

import React from 'react';

// Recebe a lista de ativos, o ID do ativo atual, uma função para fechar e uma para selecionar
function AssetListModal({ isOpen, onClose, assets, currentAssetId, onSelect }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content asset-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Selecionar Ativo</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <ul className="asset-list">
            {assets.map(asset => (
              <li 
                key={asset.asset_uuid} 
                className={asset.asset_uuid === currentAssetId ? 'asset-list-item active' : 'asset-list-item'}
                // Ao clicar, chama a função 'onSelect' que vai mudar a URL e fechar o modal
                onClick={() => onSelect(asset.asset_uuid)}
              >
                {asset.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AssetListModal;