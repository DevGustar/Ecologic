// src/pages/DashboardPage.jsx

import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import InteractiveMap from '../components/dashboard/InteractiveMap';

function DashboardPage() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <InteractiveMap />
      </main>
    </div>
  );
}

export default DashboardPage;