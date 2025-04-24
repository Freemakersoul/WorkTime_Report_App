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
  const [holidays, setHolidays] = useState([]);
  const userType = [
    { value: 313330000, label: "User" },
    { value: 313330001, label: "Admin" },
  ];

  const handleApprove = async (leaveId) => {
    try {
      await axios.patch(`http://localhost:8000/update-vacation-status/${leaveId}`, {
        vacation_status: 313330001  // Aprovado
      });
      setLeaves((prevLeaves) => prevLeaves.filter((leave) => leave.id !== leaveId));
      alert("Leave request approved!");
    } catch (error) {
      console.error("Error approving leave:", error);
      alert("Failed to approve leave request.");
    }
  };
  
  const handleReject = async (leaveId) => {
    const reason = prompt("Please provide a reason for rejecting:");
    if (!reason) return;
  
    try {
      await axios.patch(
        `http://localhost:8000/update-vacation-status/${leaveId}`,
        {
          vacation_status: 313330002,
          reason_if_rejected: reason,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setLeaves((prevLeaves) => prevLeaves.filter((leave) => leave.id !== leaveId));
      alert("Leave request rejected!");
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert("Failed to reject leave request.");
    }
  };

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

    const isHoliday = (date) => {
      return holidays.some(h =>
        h.date.getFullYear() === date.getFullYear() &&
        h.date.getMonth() === date.getMonth() &&
        h.date.getDate() === date.getDate()
      );
    };

    return (
      <div className="my-calendar-wrapper">
        <Calendar
          onChange={setDate}
          value={date}
          tileClassName={({ date }) => {
            if (isHoliday(date)) return 'holiday';
            if (isLeaveDay(date)) return 'leave-day';
            if (date.getDay() === 0 || date.getDay() === 6) return 'weekend';
            return null;  // Se não for nenhum dos casos, não altera a célula
          }}
          tileContent={({ date }) => {
            const leave = leaves.find(l => date >= new Date(l.start) && date <= new Date(l.end));
            const holiday = holidays.find(h => 
              h.date.getFullYear() === date.getFullYear() &&
              h.date.getMonth() === date.getMonth() &&
              h.date.getDate() === date.getDate()
            );
  
            return (
              <>
                {leave && holiday ? (
                  <span className="leave-holiday-icons">
                    <span className="leave-marker" title={leave.name}>🌴</span>
                    <span className="holiday-marker" title={holiday.name}>🎉</span>
                  </span>
                ) : (
                  <>
                    {leave && <span className="leave-marker" title={leave.name}>🌴</span>}
                    {holiday && <span className="holiday-marker" title={holiday.name}>🎉</span>}
                  </>
                )}
              </>
            );
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
          status: leave.vacation_status 
        }));

        const sortedLeaves = leavesData.sort((a, b) => new Date(b.start) - new Date(a.start));
    
        setLeaves(sortedLeaves);  
      } catch (error) {
        console.error("Erro ao buscar leaves:", error);
      }
    };

    const fetchHolidays = async () => {
      try {
        const response = await axios.get("http://localhost:8000/get-public-holidays"); // 
        const formatted = response.data.holidays.map(h => ({
          date: new Date(h.cr6ca_holidaydate),
          name: h.cr6ca_description
        }));
        setHolidays(formatted);
      } catch (error) {
        console.error("Erro ao buscar feriados:", error);
      }
    };
    
    fetchHolidays();
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
            <h1 className="main_title">Users Management</h1> 
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
        <h1 className="main_title"> Leave Management</h1>
        <div>
          <table className="leave_table">
            <thead>
              <tr>
                <th>User</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Half Day</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.name}</td>
                  <td>{new Date(leave.start).toLocaleDateString()}</td>
                  <td>{new Date(leave.end).toLocaleDateString()}</td>
                  <td>{leave.halfDay === 1 ? "Yes" : "No"}</td>
                  <td>
                    {leave.status === 313330000 && ( // 313330000 = Pendente
                      <>
                        <button className="approve_button" onClick={() => handleApprove(leave.id)}>✅</button>
                        <button className="reject_button" onClick={() => handleReject(leave.id)}>❌</button>
                      </>
                    )}
                    {leave.status === 313330001 && <span className="status_approved">✅</span>}
                    {leave.status === 313330002 && <span className="status_rejected">❌</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="calendar">
          <MyCalendar leaves={leaves} holidays={holidays}/>
        </div>
      </div>

      <div className="divider_right"></div>

      <div className="management_right_section">
        <h1 className="main_title">Reports Management</h1>
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