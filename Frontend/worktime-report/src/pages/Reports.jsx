import React, { useEffect, useState } from "react";
import axios from 'axios';

// Reports.jsx
const Reports = () => {
  const [accounts, setAccounts] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeTypes, setTimeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedActivityType, setSelectedActivityType] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedTimeType, setSelectedTimeType] = useState("");
  const [comment, setComment] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");

  // CONSTS FOR REPORTS MANAGEMENT
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

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // REPORTS MANAGEMENT
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
          cr6ca_comment: editedComment
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
        
        setViewMode('list');
        alert("Report successfully updated!");
      } catch (error) {
        console.error("Error updating report:", error.response ? error.response.data : error.message);
        alert("Failed to update the report.");
      }
    };

  // Carregar todas as opções no mount
  useEffect(() => {
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

  // Validação de formulário
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
  
    // Imprimir os dados para depuração
    console.log("Dados enviados para o backend:", data);
  
    try {
      const response = await axios.post(
        "http://localhost:8000/create-timereport", 
        data, // Enviar os dados no corpo da requisição
        {
          headers: {
            "Content-Type": "application/json", // Garantir que o conteúdo seja JSON
          }
        }
      );
      console.log('Sucesso:', response.data);
    } catch (error) {
      console.error('Erro ao criar relatório:', error.response ? error.response.data : error.message);
    }
  };

  const lastReport = reports.length > 0
  ? reports.reduce((latest, current) => {
      return new Date(current.createdon) > new Date(latest.createdon) ? current : latest;
    })
  : null;

  const statusOptions = {
    313330000: "Pending",
    313330001: "Approved",
    313330002: "Rejected"
  }

  const handleViewChange = (mode) => {
    setViewMode(mode);
  };

  const handleAnalyzeReport = (report) => {
    console.log("Analisando relatório:", report);
    handleViewChange('analyze');
    setAnalyzedReport(report);
  };

  const handleBackToTable = () => {
    setViewMode('list');
    setSelectedReport(null);  // Limpa o relatório selecionado
  };

  return (
    <>
      <div className="reports_content">
        <div className="reports_left_section">
          <h1 className="main_title">Send Report</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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

            <div>
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

            <div>
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

            <div>
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

            <div>
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

            <div>
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

            <div>
              <label>Hours worked:</label>
              <input
                type="number"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                step="0.50"
                min="0"
              />
            </div>

            <div>
              <label>Comment (optional):</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            <button type="submit" disabled={!isFormValid()}>
              Send for approval
            </button>
          </form>
          {loading && <div>Loading data...</div>}
          {errorMessage && <div className="error">{errorMessage}</div>}
        </div>

        <div className="divider_left"></div>
        
        {lastReport && (
          <div className="reports_middle_section">
          <h1 className="main_title">Last Report</h1>
            <p><strong>Data:</strong> {new Date(lastReport.createdon).toLocaleDateString()}</p>
            <p><strong>Horas:</strong> {lastReport.cr6ca_hoursworked}</p>
            <p><strong>Status:</strong> {statusOptions[lastReport.cr6ca_reportstatus] || lastReport.cr6ca_reportstatus}</p>
            <p><strong>Cliente:</strong> {lastReport.cr6ca_AccountID?.name}</p>
            <p><strong>Tipo de Atividade:</strong> {
              activityTypes.find(a => a.id === lastReport.cr6ca_ActivityTypeID?.cr6ca_activitytypeid)?.name || "—"
            }</p>
            <p><strong>Projeto:</strong> {
              projects.find(p => p.id === lastReport.cr6ca_ProjectID?.cr6ca_projectid)?.name || '—'
            }</p>

            <p><strong>Tipo de Projeto:</strong> {
              projectTypes.find(pt => pt.id === lastReport.cr6ca_ProjectTypeID?.cr6ca_projecttypeid)?.name || '—'
            }</p>

            <p><strong>Tarefa:</strong> {
              tasks.find(t => t.id === lastReport.cr6ca_TaskID?.activityid)?.name || '—'
            }</p>

            <p><strong>Tipo de Tempo:</strong> {
              timeTypes.find(tt => tt.id === lastReport.cr6ca_TimeTypeID?.cr6ca_timetypeid)?.name || '—'
            }</p>

            <p><strong>Comentário:</strong> {lastReport.cr6ca_comment || '—'}</p>
          </div>
        )}

        <div className="divider_right"></div>

        <div className="reports_right_section">
        <h1 className="main_title">My Reports</h1>
        <div className="reports_container">
        {viewMode === 'list' && (
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
                      
                      <button className="analyze_button" title="Analyze" onClick={() => handleAnalyzeReport(report)}>🔍</button>
                      <button className="report_edit_button" title="Edit" onClick={() => handleEditReport(report)}>✏️</button>
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
          {viewMode === 'analyze' && analyzedReport && (
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
          {viewMode === 'edit' && selectedReport && (
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
    </>
  );
};

export default Reports;