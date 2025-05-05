import React, {useEffect, useState} from 'react';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
import clock from '../assets/imgs/clock.png';
import vacations from '../assets/imgs/vacations.png';
import axios from 'axios';

// FUNCTIONAL COMPONENT THAT CONTAINS ALL PROFILE CONTENT AND FEATURES
const Profile = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(defaultProfilePhoto);
  const [isEditing, setIsEditing] = useState(false);
  const [vacationData, setVacationData] = useState(null);

  // LOADING USER DATA AND ROLE TO SHOW ON PERSONAL INFO
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email);

      // REQUEST TO GET CURRENT USER PROFILE DATA
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/get-user/${user.id}`);
          const userData = response.data;

          
          if (userData.password) {
            setUserPassword(userData.password); 
          }

          // CHECK IF USER-DATA HAS PHOTO_URL AND UPDATE THE STATE 
          if (userData.photo_url) {
            setProfilePhotoUrl(userData.photo_url);
          }
        } catch (error) {
          console.error("Error retrieving updated photo:", error);
        }
      };

      fetchUserData();

      // FETCH VACATION DATA BASED ON USER ID
      const fetchVacationData = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/get-vacation-balance/${user.id}`);
          if (response.data.vacation_balances && response.data.vacation_balances.length > 0) {
            const sorted = response.data.vacation_balances.sort((a, b) => b.year - a.year);
            setVacationData(sorted[0]); // get the most recent vacation balance
          }
        } catch (error) {
          console.error('Erro ao buscar saldo de férias:', error);
        }
      };

      fetchVacationData();
    }

    // SAVES THE SELECTED ROLE ON LOALSTORAGE
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole) {
      setSelectedRole(savedRole);
    }

    // GET ROLE OPTIONS 
    const fetchRoles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-role-values'); 
        if (response.data && Array.isArray(response.data.roles)) {
          setRoles(response.data.roles);
        }
      } catch (error) {
        console.error('Error retrieving role options.', error);
      }
    };

    fetchRoles();
  }, []);

  // UPDATE USER DATA
  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user.id;

    if (!userId) {
      alert('User not found.');
      return;
    }

    // FORM CONTENT (TO UPDATE USER DATA)
    const formData = new FormData();
    formData.append("email", userEmail);
    formData.append("name", userName);
    if (userPassword) {
      formData.append("password", userPassword);
    }
    if (selectedPhoto) {
      formData.append("file", selectedPhoto);
    }

    // UPDATE REQUEST TO BACKEND
    try {
      const response = await axios.patch(`http://localhost:8000/update-user/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      console.log('Updated user data:', response.data);
      alert('Profile sucessfully updated!');
      setIsEditing(false); // TO BE ON INFO MODE

      // UDATE USER PHOTO
      if (response.data.photo_url) {
        setProfilePhotoUrl(response.data.photo_url);
      }

      // UPDATE USER DATA (WITHOUT PHOTO)
      const updatedUser = {
        ...user,
        name: userName,
        email: userEmail,
        ...(userPassword && { password: userPassword }) 
      };

      // SAVE USER DATA ON LOCALSTORAGE
      localStorage.setItem("user", JSON.stringify(updatedUser))

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error while updating profile');
    }
  };

  // FILE CHANGE UPDATE
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedPhoto(file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfilePhotoUrl(previewUrl); 
    }
  };

  useEffect(() => {
    const content = document.querySelector(".scale_wrapper_content");
    const wrapper = document.getElementById("scale_wrapper");
  
    const baseWidth = 1024;
    const baseHeight = 600;
  
    const scaleToFit = () => {
      const scaleY = content.clientHeight / baseHeight;
      const scaleX = content.clientWidth / baseWidth;
      const scale = Math.min(scaleX, scaleY);
  
      wrapper.style.transform = `scale(${scale})`;
    };
  
    // Inicialize scale
    scaleToFit();
  
    // Check changes of the size of the content
    const resizeObserver = new ResizeObserver(() => {
      scaleToFit();
    });
  
    if (content) resizeObserver.observe(content);
  
    // Fallbackto resize the window
    window.addEventListener("resize", scaleToFit);
  
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scaleToFit);
    };
  }, []);

  return (
    <div className="scale_wrapper_content">
      <div id="scale_wrapper">
        <div className="profile_content">
          {/* PROFILE LEFT SECTION */}
          <div className="profile_left_section">
              <img src={profilePhotoUrl || defaultProfilePhoto} alt="profile photo" className="profile_photo"/>
            {/* PROFILE INFO VIEW MODE IF ISNT EDITING, 
              IF IS EDITING CHANGES TO EDIT PROFILE VIEW MODE  */}
            {!isEditing ? (
              <div className="profile_info_view">
                <div>
                  <div className="photo_profile_legend">Your profile photo</div>
                  <h2 className="profile_info_title">Personal Info:</h2>
                  <p><strong>Name:</strong> <span style={{ color: 'aqua' }}>{userName}</span></p>
                  <p><strong>Email:</strong> <span style={{ color: 'aqua' }}>{userEmail}</span></p>
                  <p><strong>Role:</strong> {' '}
                    <span style={{ color: 'aqua' }}>
                      {roles.find(r => r.value == selectedRole)?.label || 'N/A'}
                    </span></p>
                  <button className="edit_button" onClick={() => setIsEditing(true)}>🖉 Edit Profile</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="profile_edit_form">

                  <label htmlFor="fileUpload" className="custom_file_button">
                  🖉 Change profile photo
                  </label>
                  <input
                    id="fileUpload"
                    className="profile_input_photo"
                    type="file"
                    onChange={handleFileChange}  
                    accept="image/*" 
                  />

                <h2 className="profile_edit_title">Personal Info Edit:</h2>

                  <label>Name:</label>
                  <input
                    className="edit_profile_input"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                
                  <label>Email:</label>
                  <input
                    className="edit_profile_input"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                
                  <label>Password:</label>
                  <input
                    className="edit_profile_input"
                    type="password" 
                     value={userPassword ? '*****' : ''}
                    onChange={(e) => setUserPassword(e.target.value)}
                  />
                    
                  <label>Select Role:</label>
                  <select className="role_options"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      localStorage.setItem('selectedRole', e.target.value); // SAVED ON LOCALSTORAGE
                    }}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                <div className="edit_buttons">
                  <button className="save_button" type="submit">Save</button>
                  <button className="cancel_button" type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="divider_left"></div>
          
          {/* PROFILE MIDDLE SECTION */}
          <div className="profile_middle_section">
            <img src={clock} alt="clock photo" className="clock_photo"/>
            <div className="hours_worked_main_info">
              <h2 className="hours_worked_main_title">Hours Worked This Year:</h2>
              <p className="hours_worked_info"><strong>200 Hours</strong></p>
            </div>
            <h3 className="hours_worked_title">Hours Worked Today:</h3>
            <p className="hours_worked_info" style={{ color: 'lightgreen' }}>8 Hours</p>
            <h3 className="hours_worked_title">Hours Worked This Week:</h3>
            <p className="hours_worked_info">40 Hours</p>
            <h3 className="hours_worked_title">Hours Worked This Month:</h3>
            <p className="hours_worked_info">176 Hours</p>
            
          </div>

          <div className="divider_right"></div>

          {/* PROFILE RIGHT SECTION */}
          <div className="profile_right_section">
            <img src={vacations} alt="calendar photo" className="vacations_photo"/>
            <div className="vacations_info_content">
              <h2 className="vacations_title">Annual leave used:</h2>
              <p className="vacations_info">{vacationData ? (22) - vacationData.available_days : 'Loading...'} Days</p>
              <h2 className="vacations_title">Annual leave outstanding:</h2>
              <p className="vacations_info">{vacationData ? vacationData.available_days + (vacationData.carried_over_days || 0) : 'Loading...'} Days</p>
              <h2 className="vacations_title">Carried over days:</h2>
              <p className="vacations_info">{vacationData ? vacationData.carried_over_days : 'Loading...'} Days</p>
            </div>
            <button className="schedule_vacations_button">🗓️ Schedule annual leave</button>
          </div>
        </div>
      </div>
    </div>  
    
  );
};

export default Profile;