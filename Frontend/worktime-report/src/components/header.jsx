import React, {useEffect, useState} from 'react';
import logo from '../assets/imgs/logotype.png';
import { useNavigate } from 'react-router-dom';
import {handleLogout} from '../services/Logout';

// FUNCTION THET CONTAINS ALL HEADER INFO AND FEATURES 
function Header({ currentPage,  onNavigate  }) {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  
  // NAVIGATE TO PROFILE PAGE
  const goToProfile = () => {
    if (onNavigate) {
      onNavigate("Profile"); 
    } else {
      navigate('/dashboard/profile'); 
    }
  };

  // GET USER NAME FROM LOCALSTORAGE
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (user && user.name) {
      setUserName(user.name);
    }
  }, []);

  return (
    <div className="header">
      <img src={logo} alt="WorkTime Report Icon" className="app_icon_header" />
      <div className="greetings">
        Welcome to WorkTime Report,<span style={{color:'aqua'}}> {userName}</span>!
      </div>
      <h2 className="current_page">{currentPage}</h2>
      <div className="header_icons">
      <span onClick={goToProfile} className="icon" title={userName}>🧑‍💻</span>
        <span className="icon">🔔</span>
        <span className="icon">⚙️</span>
      </div>
      <button onClick={() => handleLogout(navigate)} className="logout_button">Logout</button>
    </div>
  );
}

export default Header;