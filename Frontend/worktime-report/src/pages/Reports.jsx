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

  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedActivityType, setSelectedActivityType] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedTimeType, setSelectedTimeType] = useState("");
  const [comment, setComment] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

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

    fetchOptions();
  }, []);

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

  return (
    <>
      <div className="reports_content">
        <div className="reports_left_section">
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

        <div className="reports_middle_section">
          {/* Aqui pode vir uma visualização ou detalhes do relatório, se necessário */}
        </div>

        <div className="divider_right"></div>

        <div className="reports_right_section">
          {/* Aqui pode vir outra seção de relatórios ou informações */}
        </div>
      </div>
    </>
  );
};

export default Reports;