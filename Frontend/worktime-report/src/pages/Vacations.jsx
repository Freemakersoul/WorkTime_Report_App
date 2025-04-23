import React, { useEffect, useState } from 'react';
import axios from 'axios';
import vacations from '../assets/imgs/vacations.png';

const Vacations = () => {
  const [vacationData, setVacationData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [halfDay, setHalfDay] = useState(0); // 0 for full day, 1 for half day
  const [reasonIfRejected, setReasonIfRejected] = useState('');
  const [currentVacationStatus, setCurrentVacationStatus] = useState(313330000);
  const [isRejected, setIsRejected] = useState(false); 
  const [vacationRequestStatus, setVacationRequestStatus] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {

    if (!user || !user.id) {
      console.log('Usuário não encontrado no localStorage');
      return;
    }

    const fetchVacationData = async () => {
      try {
        // Faz a requisição à API para buscar o saldo de férias
        const response = await axios.get(`http://localhost:8000/get-vacation-balance/${user.id}`);
        console.log('Resposta de férias:', response.data);

        if (response.data.vacation_balances && response.data.vacation_balances.length > 0) {
          // Ordena os dados por ano (do mais recente para o mais antigo)
          const sorted = response.data.vacation_balances.sort((a, b) => b.year - a.year);
          setVacationData(sorted[0]); // Pega o saldo de férias mais recente
        }
      } catch (error) {
        console.error('Erro ao buscar saldo de férias:', error);
      }
    };

    // Chama a função para buscar os dados de férias
    fetchVacationData();
    fetchVacationStatusByUser();
  },[]);

  const fetchVacationStatusByUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/get-vacation-status-by-user-id/${user.id}`);
      console.log('Status mais recente:', response.data);
  
      const { vacation_status, reason_if_rejected } = response.data;
  
      setCurrentVacationStatus(vacation_status);
      setReasonIfRejected(reason_if_rejected);
  
      setIsRejected(vacation_status === 313330002); // Rejeitada
    } catch (error) {
      console.error('Erro ao buscar status mais recente de férias:', error);
    }
  };

  const handleSubmitVacationRequest = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/create-vacation', {
        start_date: startDate,
        end_date: endDate,
        half_day: halfDay,
        user_id: user.id
      });

      setVacationRequestStatus(response.data); // Armazena a resposta de sucesso ou erro
      console.log('Resultado da requisição de férias:', response.data);

      // Se a solicitação for rejeitada, vamos permitir que o motivo da rejeição seja preenchido
      if (response.data.status === 'rejected') {
        setIsRejected(true);
        setReasonIfRejected(response.data.reason_if_rejected || '');  // Se a resposta já tiver motivo de rejeição
      }

    } catch (error) {
      console.error('Erro ao criar solicitação de férias:', error);
      setVacationRequestStatus({ message: 'Erro ao criar solicitação de férias' });
    }
  };

  const vacationStatusMap = {
    313330000: 'Pending',
    313330001: 'Approved',
    313330002: 'Rejected',
  };

  console.log('currentVacationStatus:', currentVacationStatus);
  
  return (
    <div className="vacations_content">
      <div className="vacations_left_section">
        <h1 className="manage_title">Current year: {vacationData?.year || 'Loading...'} </h1>
        <img src={vacations} alt="calendar photo" className="vacations_photo"/>
        <div className="vacations_info_content">
          <h2 className="vacations_title">Annual leave used:</h2>
          <p className="vacations_info">{vacationData ? (22) - vacationData.available_days : 'Loading...'} Days</p>
          <h2 className="vacations_title">Annual leave outstanding:</h2>
          <p className="vacations_info">{vacationData ? vacationData.available_days + (vacationData.carried_over_days || 0) : 'Loading...'} Days</p>
          <h2 className="vacations_title">Carried over days:</h2>
          <p className="vacations_info">{vacationData ? vacationData.carried_over_days : 'Loading...'} Days</p>
        </div>
      </div>
      <div className="divider"></div>
      <div className="vacations_right_section">
        <h1 className="manage_title">Request Vacation</h1>
        <form onSubmit={handleSubmitVacationRequest}>
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <h3>Request for a Half Day or Full Day off:</h3>
            <select value={halfDay} onChange={(e) => setHalfDay(parseFloat(e.target.value))}>
              <option value={0.0}>Select an option</option>
              <option value={1.0}>Full Day</option>
              <option value={0.5}>Half Day</option>
            </select>
          </div>

          <button type="submit">Submit Vacation Request</button>
        </form>

        {vacationRequestStatus && (
          <div className="vacation-request-status">
            <h3>Status</h3>
            <p>{vacationRequestStatus.message}</p>
          </div>
        )}

        <div><strong>Last request state:</strong></div>
        <div>Request status – {vacationStatusMap[currentVacationStatus] || 'Unknown'}</div>

        {isRejected && (
          <div className="form-group">
            <label htmlFor="reasonIfRejected">Reason if Rejected</label>
            <textarea
              id="reasonIfRejected"
              value={reasonIfRejected}
              readOnly
            ></textarea>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vacations;