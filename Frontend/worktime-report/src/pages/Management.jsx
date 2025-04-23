import React, { useEffect, useState } from 'react';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
import Calendar from 'react-calendar';
import axios from 'axios';

const Management = () => {

  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [leaves, setLeaves] = useState([]);
  const userType = [
    { value: 313330000, label: "User" },
    { value: 313330001, label: "Admin" },
  ];
  


  const MyCalendar = ({ leaves }) => {
    const [date, setDate] = useState(new Date());
  
    // Transforma as datas de início a fim de cada leave em objetos Date
    const leaveDates = leaves.flatMap(leave => {
      const start = new Date(leave.start);
      const end = new Date(leave.end);
      const days = [];
  
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d)); // Cria cópia da data
      }
  
      return days;
    });
  
    const isLeaveDay = (date) => {
      return leaveDates.some(
        (d) =>
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
      );
    };

    return (
      <div className="my-calendar-wrapper">
        <Calendar
          onChange={setDate}
          value={date}
          tileClassName={({ date }) => {
            if (date.getDay() === 0 || date.getDay() === 6) {
              return 'weekend';
            }
            if (isLeaveDay(date)) {
              return 'leave-day';
            }
          }}
          tileContent={({ date }) => {
            const matchingLeave = leaves.find((leave) => {
              const start = new Date(leave.start);
              const end = new Date(leave.end);
              return date >= start && date <= end;
            });
            return matchingLeave ? (
              <span className="leave-marker" title={matchingLeave.name}>🌴</span>
            ) : null;
          }}
        />
      </div>
    );
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(user.password || '');
    setSelectedUserType(user.usertype || '');
    setProfilePhotoUrl(user.photo_url || '');
    setViewMode('profile');
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:8000/delete-user/${userId}`);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        alert("User sucessfully delete!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error while deleting user.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedUser) {
      alert("No user selected.");
      return;
    }
  
    const formData = new FormData();
    formData.append("name", userName);
    formData.append("email", userEmail);
    if (userPassword) {
      formData.append("password", userPassword);
    }
    formData.append("usertype", selectedUserType);
    
    // Converter a imagem (se estiver em base64)
    if (profilePhotoUrl && profilePhotoUrl.startsWith("data:image")) {
      const blob = await (await fetch(profilePhotoUrl)).blob();
      formData.append("file", blob, "profile.png");
    }
  
    try {
      const response = await axios.patch(
        `http://localhost:8000/update-user/${selectedUser.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      alert("User successfully updated!");
      // Atualiza a lista de users com o novo nome/email/etc.
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, name: userName, email: userEmail, usertype: selectedUserType, photo_url: response.data.photo_url }
            : user
        )
      );
      setViewMode("list");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error while updating user.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/get-all-users");
        console.log("Dados dos utilizadores:", response.data.users);
        setUsers(response.data.users);
      } catch (error) {
        console.error("Erro ao buscar os utilizadores:", error);
      }
    };
  
    const fetchLeaves = async () => {
      try {
        const response = await axios.get("http://localhost:8000/get-all-vacations");
        console.log("Resposta das férias:", response.data);  // Adicionando o log aqui para inspecionar a estrutura real
    
        // Acessando o array correto 'vacations' em 'response.data'
        const leavesData = response.data.vacations.map(leave => ({
          id: leave.vacation_id,
          name: leave.user.name, 
          start: leave.start_date, 
          end: leave.end_date, 
          halfDay: leave.half_day, 
        }));
    
        console.log("Dados formatados das férias:", leavesData);  // Verificando a transformação dos dados
        setLeaves(leavesData);  // Atualiza o estado com os dados formatados
      } catch (error) {
        console.error("Erro ao buscar leaves:", error);
      }
    };
  
    fetchUsers();
    fetchLeaves();
  }, []);

  const getUserTypeLabel = (type) => {
    switch (type) {
      case 313330000: return "User";
      case 313330001: return "Admin";
      default: return "Desconhecido";
    }
  };

  return (
    <div className="management_content">
      <div className="management_left_section">
        {viewMode === 'list' ? (
          <>
            <h1 className="manage_title">Users Management</h1> 
            <div className="users_list_table">
              <table>
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><img className="user_profile_photo" src={user.photo_url || defaultProfilePhoto} alt="photo" /></td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{"•".repeat(user.password?.length || 5)}</td>
                      <td>{getUserTypeLabel(user.usertype)}</td>
                      <td>
                        <div className="users_list_actions">
                          <button className="users_edit_action" onClick={() => handleEdit(user)} title="Edit">✏️</button>
                          <button className="users_delete_actions" onClick={() => handleDelete(user.id)} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <img src={profilePhotoUrl || defaultProfilePhoto} alt="profile" className="profile_photo" />

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

              <h2 className="profile_edit_title">Edit Info:</h2>

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
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />

              <label>Select User Type:</label>
              <select
                className="usertype_options"
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
              >
                <option value="">Select Role</option>
                {userType.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <div className="edit_buttons">
                <button className="save_button" type="submit">Save</button>
                <button
                  className="cancel_button"
                  type="button"
                  onClick={() => setViewMode('list')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="divider_left"></div>

      <div className="management_middle_section">
        <h1 className="manage_title"> Leave Management</h1>
        <div>
          <h2>Leave requests:</h2>
          <ul>
            {leaves.map((leave) => (
              <li key={leave.id}>
                {leave.name}: {new Date(leave.start).toLocaleDateString()} - {new Date(leave.end).toLocaleDateString()}
                {leave.halfDay === 1 && <span> (Half Day)</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="calendar">
          <MyCalendar leaves={leaves} />
        </div>
      </div>

      <div className="divider_right"></div>

      <div className="management_right_section">
        <h1 className="manage_title">Reports Management</h1>
        <div className="reports_container">
          {/* Exemplo estático de relatório - substituir por dados do banco */}
          <div className="report_card">
            <h3>Report #1</h3>
            <p><strong>Autor:</strong> João Silva</p>
            <p><strong>Data:</strong> 2025-04-21</p>
            <p><strong>Conteúdo:</strong> Relatório sobre o desempenho semanal da equipe A. Foram cumpridos 95% das metas.</p>
            
            <div className="report_actions">
              <button className="report_button analyze">🔍 Analisar</button>
              <button className="report_button correct">✏️ Corrigir</button>
              <button className="report_button approve">✅ Aprovar</button>
            </div>
          </div>

          {/* Outros relatórios podem seguir este formato dinamicamente */}
        </div>
      </div>
    </div>
  );
};

export default Management;