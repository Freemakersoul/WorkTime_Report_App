import React, {useEffect, useState} from 'react';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
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

  // LOADING USER DATA AND ROLE TO SHOW ON PERSONAL INFO
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email);
      setUserPassword(user.password);

      // REQUEST TO GET CURRENT PHOTO PROFILE
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/get-user/${user.id}`);
          const userData = response.data;

          // CHECK IF USER-DATA HAS PHOTO_URL AND UPDATE THE STATE 
          if (userData.photo_url) {
            setProfilePhotoUrl(userData.photo_url);
          }
        } catch (error) {
          console.error("Erro ao buscar foto atualizada:", error);
        }
      };

      fetchUserData();
    }

    // SAVES THE SELECTED ROLE ON LOALSTORAGE
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole) {
      setSelectedRole(savedRole);
    }

    // GET ROLE OPTIONS 
    const fetchRoles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-role-values'); // BACKEND URL
        setRoles(response.data.roles); 
      } catch (error) {
        console.error('Erro ao buscar opções de cargos:', error);
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
      alert('Usuário não encontrado.');
      return;
    }

    // FORM CONTENT (TO UPDATE USER DATA)
    const formData = new FormData();
    formData.append("email", userEmail);
    formData.append("name", userName);
    formData.append("password", userPassword);
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
      alert('Profile updated sucessfully!');
      setIsEditing(false); // INFO MODE

      // UDATE USER PHOTO
      if (response.data.photo_url) {
        setProfilePhotoUrl(response.data.photo_url);
      }

      // UPDATE USER DATA (WITHOUT PHOTO)
      const updatedUser = {
        ...user,
        name: userName,
        email: userEmail,
        password: userPassword, 
      };

      // SAVE USER DATA ON LOCALSTORAGE
      localStorage.setItem("user", JSON.stringify(updatedUser))

    } catch (error) {
      console.error('Erro ao atualizar o perfil:', error);
      alert('Erro ao atualizar o perfil');
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

  return (
    <div className="profile_content">
        <div className="profile_left_section">
        <div className="profile_left_content">
          <img
            src={profilePhotoUrl || defaultProfilePhoto}
            alt="profile photo"
            className="profile_photo"
          />
        </div>

        {!isEditing ? (
          <div className="profile_info_view">
            <div>
              <div className="photo_profile_legend">Profile photo</div>
              <h1 className="profile_info_title">Personal Info:</h1>
              <p><strong>Name:</strong> <span style={{ color: 'aqua' }}>{userName}</span></p>
              <p><strong>Email:</strong> <span style={{ color: 'aqua' }}>{userEmail}</span></p>
              <p><strong>Role:</strong> {' '}
                <span style={{ color: 'aqua' }}>
                  {roles.find(r => r.value == selectedRole)?.label || 'N/A'}
                </span></p>
              <button className="edit_button" onClick={() => setIsEditing(true)}>Edit Profile 🖉</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile_edit_form">

              <label htmlFor="fileUpload" className="custom_file_button">
                Change photo 🖉
              </label>
              <input
                id="fileUpload"
                className="profile_input_photo"
                type="file"
                onChange={handleFileChange}  
                accept="image/*" 
              />

            <h1 className="profile_edit_title">Personal Info Edit:</h1>

              <label>Name:</label>
              <input
                className="profile_input"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            
              <label>Email:</label>
              <input
                className="profile_input"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            
              <label>Password:</label>
              <input
                className="profile_input"
                type="password" 
                value={userPassword}
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
      <div className="profile_middle_section">
        <div className="profile_extra_box">fdhfdh</div>
      </div>
      <div className="profile_right_section">
        <div className="profile_extra_box">hfdhdh</div>
      </div>
    </div>
  );
};

export default Profile;