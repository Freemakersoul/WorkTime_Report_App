import BannerAndFooter from '../components/BannerAndFooter';
import Header from '../components/Header';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import findMoreIcon from '../assets/imgs/findmore.png';
import {handleLogout} from '../services/Logout';
import { Outlet } from 'react-router-dom'; 

/* FUNCTIONAL COMPONENT THAT CONTAINS ALL CONTENT AN FEATURES 
FROM MAIN DASHBOARD (MAIN APP PAGE)*/
const MainDashboard = () => {

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [selectedPage, setSelectedPage] = useState("Dashboard");

  // ARROW FUNCTION TO NAVIGATE BETWEEN PAGES
  const handlePageClick = (page) => {
    setSelectedPage(page);
    setCurrentPage(page);

    switch (page) {
      case "Dashboard":
        navigate("/dashboard");
        break;
      case "Reports":
        navigate("/dashboard/reports");
        break;
      case "Vacations":
        navigate("/dashboard/vacations");
        break;
      case "Settings":
        navigate("/dashboard/settings");
        break;
      case "Profile":
        navigate("/dashboard/profile");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <BannerAndFooter />
      <div className="app_content">
        <Header currentPage={currentPage} onNavigate={handlePageClick}/>
        <div className="dashboard_container"> 
          <div className="main_layout">
            {/* Botão para abrir/fechar */}
            <button className="toggle_btn" onClick={toggleSidebar}>
              {sidebarOpen ? '←' : '→'}
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <ul className="options">
              <li onClick={() => handlePageClick("Dashboard")} className={selectedPage === "Dashboard" ? "selected" : ""}><span className="option_icon">🏠</span><span className="label">Dashboard</span></li>
              <li onClick={() => handlePageClick("Reports")} className={selectedPage === "Reports" ? "selected" : ""}><span className="option_icon">📊</span><span className="label">Reports</span></li>
              <li onClick={() => handlePageClick("Vacations")} className={selectedPage === "Vacations" ? "selected" : ""}><span className="option_icon">📆</span><span className="label">Vacations</span></li>
              <li onClick={() => handlePageClick("Settings")} className={selectedPage === "Settings" ? "selected" : ""}><span className="option_icon">⚙️</span><span className="label">Settings</span></li>
              <li onClick={() => handleLogout(navigate)}><span className="option_icon">🔒</span><span className="label_special_hover">Exit</span></li>
            </ul>
            <img src={findMoreIcon} alt="Findmore Logo" className="findmore_logo" />
            </aside>

            {/* Conteúdo principal */}
            <div className={`content ${sidebarOpen ? 'content_default' : 'content_expanded'}`}>
              <Outlet />  
            </div>
          </div>
          </div>
        <div/>
      </div>
    </>
  );
}

export default MainDashboard;