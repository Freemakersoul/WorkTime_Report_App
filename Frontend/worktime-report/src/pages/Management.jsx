import React, { useEffect, useState } from 'react';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
import Calendar from 'react-calendar';
import axios from 'axios';

const Management = () => {

  // CONSTS FOR USER MANAGEMENT
  const [users, setUsers] = useState([]);
  const [userViewMode, setUserViewMode] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // CONSTS FOR LEAVES MANAGEMENT
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // CONSTS FOR REPORTS MANAGEMENT
  const [accounts, setAccounts] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeTypes, setTimeTypes] = useState([]);
  const [reportViewMode, setReportViewMode] = useState('list');
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editedComment, setEditedComment] = useState('');
  const [editedHours, setEditedHours] = useState('');
  const [editedReportStatus, setEditedReportStatus] = useState (313330000)
  const [editedActivityType, setEditedActivityType] = useState('');
  const [editedAccount, setEditedAccount] = useState('');
  const [editedProject, setEditedProject] = useState('');
  const [editedProjectType, setEditedProjectType] = useState('');
  const [editedTask, setEditedTask] = useState('');
  const [editedTimeType, setEditedTimeType] = useState('');
  const [analyzedReport, setAnalyzedReport] = useState(null);
  const userType = [
    { value: 313330000, label: "User" },
    { value: 313330001, label: "Admin" },
  ];

  // USER MANAGEMENT
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
      setUserViewMode("list");
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

  const getUserTypeLabel = (type) => {
    switch (type) {
      case 313330000: return "User";
      case 313330001: return "Admin";
      default: return "Desconhecido";
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(user.password || '');
    setSelectedUserType(user.usertype || '');
    setProfilePhotoUrl(user.photo_url || '');
    setUserViewMode('profile');
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

  // LEAVES MANAGEMENT
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
          locale="en-US"
          tileClassName={({ date, view }) => {
            if (view !== 'month') return null;
            const classes = [];

            if (isHoliday(date)) classes.push('holiday');
            if (isLeaveDay(date)) classes.push('leave-day');
            if (date.getDay() === 0 || date.getDay() === 6) classes.push('weekend');
            
            return classes.join(' ') || null;
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
  
  // REPORTS MANAGEMENT
  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await axios.patch(`http://localhost:8000/update-reportstatus/${reportId}`, {
        cr6ca_reportstatus: newStatus,
      });
  
      // Atualiza o estado local
      setReports(prevReports =>
        prevReports.map(report =>
          report.cr6ca_timereportid === reportId
            ? { ...report, cr6ca_reportstatus: newStatus }
            : report
        )
      );
  
      alert("Status atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error.response?.data || error.message);
      alert("Falha ao atualizar o status do relatório.");
    }
  };

  const handleEditReport = (report) => {
    console.log("EDITING REPORT:", report);
    setSelectedReport(report);
    setEditedComment((report.cr6ca_comment || '').trim());
    setEditedHours(report.cr6ca_hoursworked || '');
    setEditedAccount(report.cr6ca_AccountID?.accountid || '');
    setEditedActivityType(report.cr6ca_ActivityTypeID?.cr6ca_activitytypeid || '');
    setEditedProject(report.cr6ca_ProjectID?.cr6ca_projectid || '');
    setEditedProjectType(report.cr6ca_ProjectTypeID?.cr6ca_projecttypeid || '');
    setEditedTask(report.cr6ca_TaskID?.activityid || '');
    setEditedTimeType(report.cr6ca_TimeTypeID?.cr6ca_timetypeid || '');
    setEditedReportStatus(report.cr6ca_reportstatus);
    setReportViewMode('edit');
  };

  const handleEditReportSubmit = async (e) => {
    e.preventDefault();

    console.log('selectedReport:', selectedReport);


    const employeeId = selectedReport.cr6ca_EmployeeID.cr6ca_employeeid;

    console.log({
      editedAccount,
      editedActivityType,
      editedProject,
      editedProjectType,
      editedTask,
      editedTimeType,
      employeeId, // Certifique-se de passar o id do funcionário aqui
      editedHours,
      editedComment
  });

    // Verifique se algum valor está undefined ou null
    if (!editedAccount || !editedActivityType || !editedProject || !editedProjectType || !editedTask || !editedTimeType) {
      alert('Todos os campos obrigatórios devem ser preenchidos!');
      return;
    }
    
    try {
      await axios.patch(`http://localhost:8000/update-timereport/${selectedReport.cr6ca_timereportid}`, {
        accountid: editedAccount,
        cr6ca_activitytypeid: editedActivityType,
        cr6ca_projectid: editedProject,
        cr6ca_projecttypeid: editedProjectType,
        activityid: editedTask,
        cr6ca_timetypeid: editedTimeType,
        cr6ca_employeeid: employeeId,
        cr6ca_hoursworked: Number(editedHours),
        cr6ca_comment: editedComment,
        cr6ca_reportstatus: editedReportStatus,
      });
  
      // Atualiza a lista de relatórios com as alterações
      setReports(prevReports => 
        prevReports.map(report => 
            report.cr6ca_timereportid === selectedReport.cr6ca_timereportid 
                ? { 
                    ...report, 
                    cr6ca_comment: editedComment, 
                    cr6ca_hoursworked: editedHours, 
                    cr6ca_ActivityTypeID: editedActivityType,
                    cr6ca_AccountID: editedAccount,
                    cr6ca_ProjectTypeID: editedProjectType,
                    cr6ca_ProjectID: editedProject,
                    cr6ca_TaskID: editedTask,
                    cr6ca_TimeTypeID: editedTimeType,
                }
                : report
        )
      );
      
      setReportViewMode('list');
      alert("Report successfully updated!");
    } catch (error) {
      console.error("Error updating report:", error.response ? error.response.data : error.message);
      alert("Failed to update the report.");
    }
  };

  // USEEFFECTS FOR USERS, LEAVES, HOLIDAYS AND REPORTS
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

    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-user-timereports');
        console.log(response.data);
        setReports(response.data.value); 
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
      }
    };

    const fetchOptions = async () => {
          try {
            const [
              accountsRes,
              activityTypesRes,
              projectsRes,
              projectTypesRes,
              tasksRes,
              timeTypesRes
            ] = await Promise.all([
              axios.get("http://localhost:8000/get-account-options"),
              axios.get("http://localhost:8000/get-activitytype-options"),
              axios.get("http://localhost:8000/get-project-options"),
              axios.get("http://localhost:8000/get-projecttype-options"),
              axios.get("http://localhost:8000/get-task-options"),
              axios.get("http://localhost:8000/get-timetype-options"),
            ]);
    
            setAccounts(accountsRes.data);
            setActivityTypes(activityTypesRes.data);
            setProjects(projectsRes.data);
            setProjectTypes(projectTypesRes.data);
            setTasks(tasksRes.data);
            setTimeTypes(timeTypesRes.data);
          } catch (error) {
            console.error("Erro ao buscar dados:", error);
          } 
      };

    fetchOptions ();
    fetchReports();
    fetchHolidays();
    fetchUsers();
    fetchLeaves();
  }, []);

  const statusOptions = {
    313330000: "Pending",
    313330001: "Approved",
    313330002: "Rejected"
  }

  const handleViewChange = (mode) => {
    setReportViewMode(mode);
  };

  const handleAnalyzeReport = (report) => {
    console.log("Analisando relatório:", report);
    handleViewChange('analyze');
    setAnalyzedReport(report);
  };

  const handleBackToTable = () => {
    setReportViewMode('list');
    setSelectedReport(null);  
  };

  return (
    <div className="management_content">
      {/* USERS MANAGEMENT */}
      <div className="management_left_section">
        {userViewMode === 'list' ? (
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
                  onClick={() => setUserViewMode('list')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="divider_left"></div>
        
      {/* LEAVES MANAGEMENT */}
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
                    {leave.status === 313330000 && ( 
                      <>
                        <button className="approve_button" onClick={() => handleApprove(leave.id)}>✅</button>
                        <button className="reject_button" onClick={() => handleReject(leave.id)}>❌</button>
                      </>
                    )}
                    {leave.status === 313330001 && <span className="status_approved">✅ Approved</span>}
                    {leave.status === 313330002 && <span className="status_rejected"> ❌ Rejected</span>}
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

      {/* REPORTS MANAGEMENT */}
      <div className="management_right_section">
        <h1 className="main_title">Reports Management</h1>
        <div className="reports_container">
        {reportViewMode === 'list' && (
          <table className="reports_table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Hours worked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.cr6ca_timereportid}>
                    <td>{report.cr6ca_EmployeeID?.cr6ca_name || "—"}</td>
                    <td>{new Date(report.createdon).toLocaleDateString()}</td>
                    <td>{report.cr6ca_hoursworked}</td>
                    <td>
                      {parseInt(report.cr6ca_reportstatus) === 313330000 ? (
                        <>
                          <button className="analyze_button" title="Analyze" onClick={() => handleAnalyzeReport(report)}>🔍</button>
                          <button
                            className="report_edit_button"
                            title="Edit"
                            onClick={() => handleEditReport(report)}
                          >
                            ✏️
                          </button>
                          <button
                            className="approve_button"
                            title="Approve"
                            onClick={() => handleStatusUpdate(report.cr6ca_timereportid, 313330001)}
                          >
                            ✅
                          </button>
                          <button
                            className="reject_button"
                            title="Reject"
                            onClick={() => handleStatusUpdate(report.cr6ca_timereportid, 313330002)}
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <>
                          {parseInt(report.cr6ca_reportstatus) === 313330001 && (
                            <span className="status_approved">✅ Approved</span>
                          )}
                          {parseInt(report.cr6ca_reportstatus) === 313330002 && (
                            <span className="status_rejected">❌ Rejected</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Nenhum relatório disponível.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {reportViewMode === 'analyze' && analyzedReport && (
            <div className="analysis_section">
              <h2>Relatório Analisado</h2>
              <p><strong>Data:</strong> {new Date(analyzedReport.createdon).toLocaleDateString()}</p>

              <p><strong>Horas:</strong> {analyzedReport.cr6ca_hoursworked}</p>

              <p><strong>Status:</strong> {statusOptions[analyzedReport.cr6ca_reportstatus] || analyzedReport.cr6ca_reportstatus}</p>

              <p><strong>Cliente:</strong> {analyzedReport.cr6ca_AccountID?.name}</p>

              <p><strong>Tipo de Atividade:</strong> {
                activityTypes.find(a => a.id === analyzedReport.cr6ca_ActivityTypeID?.cr6ca_activitytypeid)?.name || "—"
              }</p>

              <p><strong>Projeto:</strong> {
                projects.find(p => p.id === analyzedReport.cr6ca_ProjectID?.cr6ca_projectid)?.name || '—'
              }</p>

              <p><strong>Tipo de Projeto:</strong> {
                projectTypes.find(pt => pt.id === analyzedReport.cr6ca_ProjectTypeID?.cr6ca_projecttypeid)?.name || '—'
              }</p>

              <p><strong>Tarefa:</strong> {
                tasks.find(t => t.id === analyzedReport.cr6ca_TaskID?.activityid)?.name || '—'
              }</p>

              <p><strong>Tipo de Tempo:</strong> {
                timeTypes.find(tt => tt.id === analyzedReport.cr6ca_TimeTypeID?.cr6ca_timetypeid)?.name || '—'
              }</p>

              <p><strong>Comentário:</strong> {analyzedReport.cr6ca_comment || '—'}</p>
              <button onClick={handleBackToTable}>Back</button>
            </div>
          )}
          {reportViewMode === 'edit' && selectedReport && (
            <div className="edit-report-form">
              <h2>Edit Report</h2>
              <form onSubmit={handleEditReportSubmit}>

                {/* Accounts */}
                <div className="edit-field">
                  <div className="current-value">
                    Client: {accounts.find(acc => acc.id === selectedReport?.cr6ca_AccountID?.accountid)?.name || '—'}
                  </div>
                  <select
                    value={editedAccount}
                    onChange={(e) => setEditedAccount(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity Type */}
                <div className="edit-field">
                  <div className="current-value">
                  Activity Type: {activityTypes.find(a => a.id === selectedReport?.cr6ca_ActivityTypeID?.cr6ca_activitytypeid)?.name || '—'}
                  </div>
                  <select
                    value={editedActivityType}
                    onChange={(e) => setEditedActivityType(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {activityTypes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project */}
                <div className="edit-field">
                  <div className="current-value">
                  Project: {projects.find(p => p.id === selectedReport?.cr6ca_ProjectID?.cr6ca_projectid)?.name || '—'}
                  </div>
                  <select
                    value={editedProject}
                    onChange={(e) => setEditedProject(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Type */}
                <div className="edit-field">
                  <div className="current-value">
                    Project Type: {projectTypes.find(pt => pt.id === selectedReport?.cr6ca_ProjectTypeID?.cr6ca_projecttypeid)?.name || '—'}
                  </div>
                  <select
                    value={editedProjectType}
                    onChange={(e) => setEditedProjectType(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {projectTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task */}
                <div className="edit-field">
                  <div className="current-value">
                    Task: {tasks.find(t => t.id === selectedReport?.cr6ca_TaskID?.activityid)?.name || '—'}
                  </div>
                  <select
                    value={editedTask}
                    onChange={(e) => setEditedTask(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Type */}
                <div className="edit-field">
                  <div className="current-value">
                    Time Type: {timeTypes.find(tt => tt.id === selectedReport?.cr6ca_TimeTypeID?.cr6ca_timetypeid)?.name || '—'}
                  </div>
                  <select
                    value={editedTimeType}
                    onChange={(e) => setEditedTimeType(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {timeTypes.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label>Hours Worked:</label>
                <input
                  type="number"
                  value={editedHours}
                  onChange={(e) => setEditedHours(e.target.value)}
                />

                <label>Comment:</label>
                <input
                  type="text"
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                />

                <div className="form-actions">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={handleBackToTable}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Management;