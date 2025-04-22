import React, {useEffect,useRef, useState} from 'react';
import logo from '../assets/imgs/logotype.png';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
import { useNavigate } from 'react-router-dom';
import {handleLogout} from '../services/Logout';
import axios from 'axios';

// FUNCTION THET CONTAINS ALL HEADER INFO AND FEATURES 
function Header({ currentPage,  onNavigate  }) {
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  
  // NAVIGATE TO PROFILE PAGE
  const goToProfile = () => {
    if (onNavigate) {
      onNavigate("Profile"); 
    } else {
      navigate('/dashboard/profile'); 
    }
  };

  // NAVIGATE TO SETTINGS PAGE
  const goToManagement = () => {
    if (onNavigate) {
      onNavigate("Management"); 
    } else {
      navigate('/dashboard/management'); 
    }
  };

  // GET USER NAME FROM LOCALSTORAGE
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (user && user.name) {
      setUserName(user.name);
      setUserType(user.usertype); 
    }

    // Fetch the user's profile photo
    const fetchUserProfilePhoto = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(`http://localhost:8000/get-user/${user.id}`);
          const userData = response.data;

          // If user has a photo URL, update the profile photo state
          if (userData.photo_url) {
            setProfilePhotoUrl(userData.photo_url);
          }
        } catch (error) {
          console.error("Error retrieving user photo:", error);
        }
      }
    };

    fetchUserProfilePhoto();
  }, []);

  // Close Notification dropdown 
  useEffect(() => {
    function handleClickOutside(event) {
      
      if (notificationRef.current && !notificationRef.current.contains(event.target) && !event.target.closest('.icon')) {
        setShowNotifications(false);
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationRef]); 

  return (
    <div className="header">
      <img src={logo} alt="WorkTime Report Icon" className="app_icon_header" />
      <div className="greetings">
        Welcome to WorkTime Report,<span style={{color:'aqua'}}> {userName}</span>!
      </div>
      <h2 className="current_page">{currentPage}</h2>
      <div className="header_icons">
        <span className="icon" title="Notifications" onClick={() => setShowNotifications(prev => !prev)}>🔔</span>
        {showNotifications && (
          <div ref={notificationRef} className="notification_dropdown">
            <p className="notification_text">No notifications</p>
          </div>
        )}
        {userType === 313330001 && (
          <span onClick={goToManagement} className="icon" title="Management">⚙️</span>
        )}
      </div>
      <img 
        onClick={goToProfile} 
        title={userName} 
        className="user_photo" 
        src={profilePhotoUrl || defaultProfilePhoto}
          alt="User Profile"
      />
      <button onClick={() => handleLogout(navigate)} className="logout_button">Logout</button>
    </div>
  );
}

export default Header;