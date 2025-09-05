// src/frontend/src/App.jsx

import './App.css'; // Importa os estilos específicos deste componente

function App() {
  return (
    <div className="dashboard-container">
      {/* Sidebar - O painel lateral esquerdo */}
      <div className="sidebar">
        <h1 className="sidebar-title">EcoLogic 2.0</h1>
        
        {/* Espaço para os KPIs principais */}
        <div className="kpi-card">
          <p className="kpi-label">Ativos em Risco Alto (Hoje)</p>
          <p className="kpi-number kpi-high">3</p> {/* Cor de risco alto */}
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Risco Médio da Rede (Hoje)</p>
          <p className="kpi-number kpi-medium">5.8</p> {/* Cor de risco médio */}
        </div>
        
        <div className="kpi-card">
          <p className="kpi-label">Próximo Evento Crítico</p>
          <p className="kpi-text">Chuva Forte Prevista: Sex, 15:00</p>
        </div>

        {/* Exemplo de Título de Painel */}
        <h3 className="panel-subtitle">Hotspots de Risco</h3>
        <ul className="risk-list">
          <li className="risk-item">
            <span className="risk-status risk-high"></span> Ativo A - SP (8.9)
          </li>
          <li className="risk-item">
            <span className="risk-status risk-medium"></span> Ativo B - RJ (6.2)
          </li>
          <li className="risk-item">
            <span className="risk-status risk-low"></span> Ativo C - MG (3.1)
          </li>
        </ul>

        {/* Botão de exemplo */}
        <button className="accent-button">Ver Detalhes do Ativo</button>

        {/* Texto secundário de exemplo */}
        <p className="secondary-text">Última atualização: 10/05/2024 - 14:00</p>

      </div>

      {/* Main Content - A área principal do mapa */}
      <div className="main-content">
        <h2 className="main-content-title">Mapa de Risco Climático do Brasil</h2>
        <div className="map-placeholder">
          {/* Aqui é onde o mapa real do Plotly/Mapbox vai entrar */}
          <p className="secondary-text">O mapa interativo será carregado aqui.</p>
          <p className="secondary-text">Com mesorregiões coloridas e pins de ativos.</p>
        </div>
        <div className="legend">
          <span className="risk-status risk-low"></span> Baixo
          <span className="risk-status risk-medium"></span> Médio
          <span className="risk-status risk-high"></span> Alto
        </div>
      </div>
    </div>
  );
}

export default App;