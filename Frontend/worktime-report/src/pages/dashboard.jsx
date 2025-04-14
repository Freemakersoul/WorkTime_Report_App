import BannerAndFooter from '../components/banner_and_footer';
import Header from '../components/header';
import React, { useState } from 'react';


const DashBoard = () => {

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <BannerAndFooter />
      <div className="app_content">
        <Header />
        <div className="main-layout">
          {/* Botão para abrir/fechar */}
          <button className="toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? '←' : '→'}
          </button>

          {/* Sidebar */}
          <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <ul>
              <li>🏠 Dashboard</li>
              <li>📊 Relatórios</li>
              <li>⚙️ Configurações</li>
              <li>🔒 Sair</li>
            </ul>
          </aside>

          {/* Conteúdo principal */}
          <div className="content">
            <h2>Conteúdo do Dashboard</h2>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashBoard;