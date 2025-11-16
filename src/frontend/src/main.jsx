// src/main.jsx (VERSÃO CORRIGIDA SEM ROUTER DUPLICADO)

import React from 'react';
import ReactDOM from 'react-dom/client';
// MUDANÇA: Não precisamos mais importar o BrowserRouter aqui
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);