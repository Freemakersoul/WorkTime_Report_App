// IMPORTS NEEDED
import React, { useEffect, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

const Reports = () => {

  // CONSTS TO FETCH TIME REPORT ORIGINAL VALUES  
  const [accounts, setAccounts] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeTypes, setTimeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // CONSTS TO SELECTED OPTIONS AND SET VALUES ON CREATE REPORT FORM FIELDS
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedActivityType, setSelectedActivityType] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedTimeType, setSelectedTimeType] = useState("");
  const [comment, setComment] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");

  // CONSTS FOR REPORTS MANAGEMENT (EDIT SELECTED REPORT AND ANALYZE REPORT)
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editedComment, setEditedComment] = useState('');
  const [editedHours, setEditedHours] = useState('');
  const [editedActivityType, setEditedActivityType] = useState('');
  const [editedAccount, setEditedAccount] = useState('');
  const [editedProject, setEditedProject] = useState('');
  const [editedProjectType, setEditedProjectType] = useState('');
  const [editedTask, setEditedTask] = useState('');
  const [editedTimeType, setEditedTimeType] = useState('');
  const [analyzedReport, setAnalyzedReport] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  // CONSTS TO GET USER INFO
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const { addNotification } = useOutletContext();

  // REPORTS MANAGEMENT
  // FUNCTION O HANDLE TIME REPORT EDITION
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
      handleViewChange('edit');
    };
    
    // FUNCTION THET HANDLES THE TIME REPORT SUBMITTION
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
        employeeId, 
        editedHours,
        editedComment
    });
  
      // VERIFIES IF A VALUE IS UNDEFINED OR NULL
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
          cr6ca_comment: editedComment
        });
    
        // UPDATES TIME REPORTS LIST
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
        
        setViewMode('list');
        addNotification('✅ Report updated sucessfully!');
      } catch {
        addNotification('❌ Error while updating report');
      }
    };

  // USEFFECTS FOR OPTIONS AND REPORTS 
  useEffect(() => {

    // FUNCTION TO GET FIELDS OPTIONS
    const fetchOptions = async () => {
      setLoading(true);
      setErrorMessage(null);
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
        setErrorMessage("Erro ao buscar dados. Tente novamente.");
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // FUNCTION TO GET TIME REPORTS LIST
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-user-timereports');
        const allReports = response.data.value;
    
        // Filtra apenas os relatórios do usuário logado
        const userReports = allReports.filter(
          (report) => report.cr6ca_EmployeeID?.cr6ca_employeeid === userId
        );
    
        setReports(userReports);
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
      }
    };
      
    fetchReports();
    fetchOptions();
  },[]);

  // FUNCTION TO VALIDATE FORM (CREATE REPORT)
  const isFormValid = () => {
    return (
      selectedAccount &&
      selectedActivityType &&
      selectedProject &&
      selectedProjectType &&
      selectedTask &&
      selectedTimeType &&
      hoursWorked && hoursWorked > 0
    );
  };

  //FUNCTION TO SUBMIT FORM (CREATE REPORT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount || !selectedActivityType || !selectedProject || !selectedTimeType || !hoursWorked) {
      alert('Por favor, preencha todos os campos.');
      console.log('Campos não preenchidos:', {
        selectedAccount,
        selectedActivityType,
        selectedProject,
        selectedTimeType,
        hoursWorked
      });
      return;
    }
  
    const data = {
      accountid: selectedAccount,
      cr6ca_activitytypeid: selectedActivityType,
      cr6ca_projectid: selectedProject,
      cr6ca_projecttypeid: selectedProjectType,
      activityid: selectedTask,
      cr6ca_timetypeid: selectedTimeType,
      cr6ca_comment: comment,
      cr6ca_hoursworked: parseFloat(hoursWorked), 
      cr6ca_employeeid: userId,
    };
  
    try {
      await axios.post(
        "http://localhost:8000/create-timereport", 
        data, 
        {
          headers: {
            "Content-Type": "application/json", 
          }
        }
      );
      alert('Report sucessfully created!');
      addNotification('✅ Report created sucessfully!');
    } catch  {
      addNotification('❌ Error while creating report!');
    }
  };

  // FUNCTION TO GET LAST REPORT INFO
  const lastReport = reports.length > 0
  ? reports.reduce((latest, current) => {
      return new Date(current.createdon) > new Date(latest.createdon) ? current : latest;
    })
  : null;

  // DICTIONARY TO MANAGE REPORT STATUS
  const statusOptions = {
    313330000: "Pending",
    313330001: "Approved",
    313330002: "Rejected"
  }

  // FUNCTION TO HANDLE VIEW MODE CHANGES
  const handleViewChange = (mode) => {
    setViewMode(mode);
  };
  
  // FUNCTION TO ANALYZE REPORTS INFO
  const handleAnalyzeReport = (report) => {
    console.log("Analisando relatório:", report);
    handleViewChange('analyze');
    setAnalyzedReport(report);
  };

  // FUNCTION TO CHANGE VIEW BACK TO LIST MODE
  const handleBackToTable = () => {
    setViewMode('list');
    setSelectedReport(null);  // Limpa o relatório selecionado
  };

  return (
    <>
      {/* REPORTS */}
      <div className="reports_content">
        {/* REPORT SUBMIT FORM */}
        <div className="reports_left_section">
        <h1 className="main_title">Report Submit</h1>
          <form onSubmit={handleSubmit} className="report_form">
            <div>
              <div className="report_field">
                <label>Client:</label>
                <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
                  <option value="">Selecione</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report_field">
                <label>Activity type:</label>
                <select value={selectedActivityType} onChange={(e) => setSelectedActivityType(e.target.value)}>
                  <option value="">Selecione</option>
                  {activityTypes.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report_field">
                <label>Project:</label>
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  <option value="">Selecione</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report_field">
                <label>Project type:</label>
                <select value={selectedProjectType} onChange={(e) => setSelectedProjectType(e.target.value)}>
                  <option value="">Selecione</option>
                  {projectTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report_field">
                <label>Task:</label>
                <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                  <option value="">Selecione</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report_field">
                <label>Time type:</label>
                <select value={selectedTimeType} onChange={(e) => setSelectedTimeType(e.target.value)}>
                  <option value="">Selecione</option>
                  {timeTypes.map((tt) => (
                    <option key={tt.id} value={tt.id}>
                      {tt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report_field">
                <label>Hours worked:</label>
                <input
                  type="number"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  step="0.50"
                  min="0"
                />
              </div>

              <div className="report_field">
                <label className="comment_label">Comment (optional):</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>

              <button className="report_submit_button" type="submit" disabled={!isFormValid()}>
                Send for approval
              </button>
            </div>
          </form>
          {loading && <div>Loading data...</div>}
          {errorMessage && <div className="error">{errorMessage}</div>}
        </div>

        <div className="divider_left"></div>
        
        {/* LAST REPORT DETAILS */}
        {lastReport && (
          <div className="reports_middle_section">
            <h1 className="main_title">Last Report Details</h1>
            <div className="middle_section_content">
              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={
                    lastReport.cr6ca_reportstatus === 313330002
                      ? 'status_text rejected'
                      : lastReport.cr6ca_reportstatus === 313330000
                      ? 'status_text pending'
                      : lastReport.cr6ca_reportstatus === 313330001
                      ? 'status_text approved'
                      : 'status_text'
                  }
                >
                  {statusOptions[lastReport.cr6ca_reportstatus] || lastReport.cr6ca_reportstatus}
                </span>
              </p>

              <p><strong>Date:</strong> <span style={{ color: 'aqua' }}>{new Date(lastReport.createdon).toLocaleDateString()}</span></p>

              <p><strong>Client:</strong> <span style={{ color: 'aqua' }}>{lastReport.cr6ca_AccountID?.name}</span></p>

              <p><strong>Activity type:</strong> <span style={{ color: 'aqua' }}>
                {activityTypes.find(a => a.id === lastReport.cr6ca_ActivityTypeID?.cr6ca_activitytypeid)?.name || "—"}
              </span></p>

              <p><strong>Project:</strong> <span style={{ color: 'aqua' }}>
                {projects.find(p => p.id === lastReport.cr6ca_ProjectID?.cr6ca_projectid)?.name || '—'}
              </span></p>

              <p><strong>Project type:</strong> <span style={{ color: 'aqua' }}>
                {projectTypes.find(pt => pt.id === lastReport.cr6ca_ProjectTypeID?.cr6ca_projecttypeid)?.name || '—'}
              </span></p>

              <p><strong>Task:</strong> <span style={{ color: 'aqua' }}>
                {tasks.find(t => t.id === lastReport.cr6ca_TaskID?.activityid)?.name || '—'}
              </span></p>

              <p><strong>Time type:</strong> <span style={{ color: 'aqua' }}>
                {timeTypes.find(tt => tt.id === lastReport.cr6ca_TimeTypeID?.cr6ca_timetypeid)?.name || '—'}
              </span></p>

              <p><strong>Hours worked:</strong> <span style={{ color: 'aqua' }}>{lastReport.cr6ca_hoursworked}</span></p>

              <p className="comment_line">
                <strong>Comment:</strong>
                <div className="tooltip_container">
                  <span className="comment_text">{lastReport.cr6ca_comment || '—'}</span>
                  {lastReport.cr6ca_comment && (
                    <div className="tooltip_box">
                      {lastReport.cr6ca_comment}
                    </div>
                  )}
                </div>
              </p>
            </div>

          </div>
        )}

        <div className="divider_right"></div>
        
        {/* USER REPORTS MANAGEMENT */}
        <div className="reports_right_section">
          <div className="reports_container">
            <h1 className="main_title">All Reports Submitted</h1>
            {/* USER REPORTS LIST VIEW MODE */}
            {viewMode === 'list' && (
              <table className="user_reports_table">
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
                          
                          <button className="analyze_button" title="Analyze" onClick={() => handleAnalyzeReport(report)}>🔍</button>
                          <button className="report_edit_button" title="Edit" onClick={() => handleEditReport(report)}>✏️</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No reports available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            {/* USER REPORTS ANALYZE VIEW MODE */}
            {viewMode === 'analyze' && analyzedReport && (
              <div className="analysis_section">
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={
                      analyzedReport.cr6ca_reportstatus === 313330002
                        ? 'status_text rejected'
                        : analyzedReport.cr6ca_reportstatus === 313330000
                        ? 'status_text pending'
                        : analyzedReport.cr6ca_reportstatus === 313330001
                        ? 'status_text approved'
                        : 'status_text'
                    }
                  >
                    {statusOptions[analyzedReport.cr6ca_reportstatus] || analyzedReport.cr6ca_reportstatus}
                  </span>
                </p>

                <p><strong>Date:</strong> <span style={{ color: 'aqua' }}>{new Date(analyzedReport.createdon).toLocaleDateString()}</span></p>

                <p><strong>Client:</strong> <span style={{ color: 'aqua' }}>{analyzedReport.cr6ca_AccountID?.name}</span></p>

                <p><strong>Activity type:</strong> <span style={{ color: 'aqua' }}>{
                  activityTypes.find(a => a.id === analyzedReport.cr6ca_ActivityTypeID?.cr6ca_activitytypeid)?.name || "—"
                }</span></p>

                <p><strong>Project:</strong> <span style={{ color: 'aqua' }}>{
                  projects.find(p => p.id === analyzedReport.cr6ca_ProjectID?.cr6ca_projectid)?.name || '—'
                }</span></p>

                <p><strong>Project type:</strong> <span style={{ color: 'aqua' }}>{
                  projectTypes.find(pt => pt.id === analyzedReport.cr6ca_ProjectTypeID?.cr6ca_projecttypeid)?.name || '—'
                }</span></p>

                <p><strong>Task:</strong> <span style={{ color: 'aqua' }}>{
                  tasks.find(t => t.id === analyzedReport.cr6ca_TaskID?.activityid)?.name || '—'
                }</span></p>

                <p><strong>Time type:</strong> <span style={{ color: 'aqua' }}>{
                  timeTypes.find(tt => tt.id === analyzedReport.cr6ca_TimeTypeID?.cr6ca_timetypeid)?.name || '—'
                }</span></p>

                <p><strong>Hours worked:</strong> <span style={{ color: 'aqua' }}>{analyzedReport.cr6ca_hoursworked}</span></p>

                <div className="comment_line">
                  <strong>Comment:</strong>
                  <div className="tooltip_container">
                    <span className="comment_text">{analyzedReport.cr6ca_comment || '—'}</span>
                    {analyzedReport.cr6ca_comment && (
                      <div className="tooltip_box">
                        {analyzedReport.cr6ca_comment}
                      </div>
                    )}
                  </div>
                </div>

                <button className="back_button" onClick={handleBackToTable}>← Back</button>
                
              </div>
            )}
            {/* USER REPORTS EDIT VIEW MODE */}
            {viewMode === 'edit' && selectedReport && (
              <div className="edit_report_form">
                <form  onSubmit={handleEditReportSubmit}>
                  <h3 className="edit_report_title">Edit Report:</h3>
                  {/* Accounts */}
                  <div className="edit_field">
                    <div className="current_value">
                      Client: <span style={{ color: 'aqua' }}>{accounts.find(acc => acc.id === selectedReport?.cr6ca_AccountID?.accountid)?.name || '—'}</span>
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
                  <div className="edit_field">
                    <div className="current_value">
                    Activity Type: <span style={{ color: 'aqua' }}>{activityTypes.find(a => a.id === selectedReport?.cr6ca_ActivityTypeID?.cr6ca_activitytypeid)?.name || '—'}</span>
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
                  <div className="edit_field">
                    <div className="current_value">
                    Project: <span style={{ color: 'aqua' }}>{projects.find(p => p.id === selectedReport?.cr6ca_ProjectID?.cr6ca_projectid)?.name || '—'}</span>
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
                  <div className="edit_field">
                    <div className="current_value">
                      Project Type: <span style={{ color: 'aqua' }}>{projectTypes.find(pt => pt.id === selectedReport?.cr6ca_ProjectTypeID?.cr6ca_projecttypeid)?.name || '—'}</span>
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
                  <div className="edit_field">
                    <div className="current_value">
                      Task: <span style={{ color: 'aqua' }}>{tasks.find(t => t.id === selectedReport?.cr6ca_TaskID?.activityid)?.name || '—'}</span>
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
                  <div className="edit_field">
                    <div className="current_value">
                      Time Type: <span style={{ color: 'aqua' }}>{timeTypes.find(tt => tt.id === selectedReport?.cr6ca_TimeTypeID?.cr6ca_timetypeid)?.name || '—'}</span>
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
                  
                  <div className="edit_field">
                    <div className="current_value">
                      Hours Worked: <span style={{ color: 'aqua' }}>
                        {selectedReport?.cr6ca_hoursworked ?? '—'}
                      </span>
                    </div>
                    <input
                      className="hours_input_value"
                      type="number"
                      value={editedHours}
                      onChange={(e) => setEditedHours(e.target.value)}
                      step="0.50"
                      min="0"
                    />
                  </div>
                  
                  <div className="edit_report_bottom">
                    <div className="comment_area">
                      <label>Comment:</label>
                      <textarea
                        type="text"
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                      /></div>

                    <div className="form_actions">
                      <button className="save_button" type="submit">Save Changes</button>
                      <button className="cancel_button" type="button" onClick={handleBackToTable}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;