// src/components/layout/ToggleSwitch.jsx

import React from 'react';

// Recebe 'checked' (se está ligado) e 'onChange' (a função para mudar o estado)
function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
      />
      <span className="slider"></span>
    </label>
  );
}

export default ToggleSwitch;