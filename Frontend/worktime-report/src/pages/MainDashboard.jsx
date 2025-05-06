import { useEffect } from 'react';
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

  const [userType, setUserType] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [selectedPage, setSelectedPage] = useState("Dashboard");
  const [notifications, setNotifications] = useState([]);

  const addNotification = (msg) => {
    setNotifications(prev => [...prev, msg]);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.usertype) {
      setUserType(user.usertype);
    }
  }, []);

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
      case "Management":
        navigate("/dashboard/management");
        break;
      case "Profile":
        navigate("/dashboard/profile");
        break;
      case "Invoice":
        navigate("/dashboard/invoice");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <BannerAndFooter />
      <div className="app_content">
        <Header currentPage={currentPage} onNavigate={handlePageClick} notifications={notifications}/>
        <div className="dashboard_container"> 
          <div className="main_layout">
            {/* Open/Close Button*/}
            <button className="toggle_btn" onClick={toggleSidebar}>
              {sidebarOpen ? '←' : '→'}
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <ul className="options">
              <li onClick={() => handlePageClick("Dashboard")} className={selectedPage === "Dashboard" ? "selected" : ""}><span className="option_icon" title="Dashboard">🏠</span><span className="label">Dashboard</span></li>

              <li onClick={() => handlePageClick("Reports")} className={selectedPage === "Reports" ? "selected" : ""}><span className="option_icon" title="Reports">📊</span><span className="label">Reports</span></li>

              <li onClick={() => handlePageClick("Vacations")} className={selectedPage === "Vacations" ? "selected" : ""}><span className="option_icon" title="Vacations">📆</span><span className="label">Annual leave</span></li>

              <li onClick={() => handlePageClick("Profile")} className={selectedPage === "Profile" ? "selected" : ""}><span className="option_icon" title="Profile">🧑‍💼</span><span className="label">Profile</span></li>

              <li onClick={() => handlePageClick("Invoice")} className={selectedPage === "Invoice" ? "selected" : ""}><span className="option_icon" title="Invoice">🧾</span><span className="label">Invoice</span></li>

              {userType === 313330001 && (
                <li
                  onClick={() => handlePageClick("Management")}
                  className={selectedPage === "Management" ? "selected" : ""}
                  title="Management"
                >
                  <span className="option_icon">⚙️</span>
                  <span className="label">Management</span>
                </li>
              )}

              <li onClick={() => handleLogout(navigate)}><span className="option_icon" title="Logout">🔒</span><span className="label_special_hover">Exit</span></li>
            </ul>
            <img src={findMoreIcon} alt="Findmore Logo" className="findmore_logo" />
            </aside>

            {/* Main content */}
            <div className={`content ${sidebarOpen ? 'content_default' : 'content_expanded'}`}>
              <Outlet context={{ handlePageClick, addNotification  }}/>  
            </div>
          </div>
          </div>
        <div/>
      </div>
    </>
  );
}

export default MainDashboard;