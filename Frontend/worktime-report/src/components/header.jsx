import React, {useEffect, useState} from 'react';
import logo from '../assets/imgs/logotype.png';
import { useNavigate } from 'react-router-dom';
import findMoreIcon from '../assets/imgs/findmore.png';

function Header() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (user && user.name) {
      setUserName(user.name);
    }
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="header">
      <img src={findMoreIcon} alt="Findmore Logo" className="findmore_logo" />
      <img src={logo} alt="WorkTime Report Icon" className="app_icon" />
      <div className="user_name">Welcome to the WorkTime Report, {userName}!</div>
      <button onClick={handleLogout} className="logout_button">Logout</button>
    </div>
  );
}

export default Header;