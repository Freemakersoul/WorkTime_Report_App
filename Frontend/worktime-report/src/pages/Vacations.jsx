import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCalendarAlt } from 'react-icons/fa';
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
  const [holidays, setHolidays] = useState([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
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

    // Chama a função para buscar os dados de férias
    fetchVacationData();
    fetchVacationStatusByUser();
    fetchHolidays();
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

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('A data de início não pode ser posterior à data de fim.');
      return;
    }

    // Cálculo de dias solicitados
    let requestedDays = (end - start) / (1000 * 60 * 60 * 24) + 1;

    if (halfDay === 0.5) {
      requestedDays = 0.5;
    }

    const availableDays = vacationData?.available_days ?? 0;

    if (requestedDays > availableDays) {
      alert('Você não tem dias de férias suficientes para esta solicitação.');
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

  const isHoliday = (date) => {
    return holidays.some(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getFullYear() === date.getFullYear() &&
             holidayDate.getMonth() === date.getMonth() &&
             holidayDate.getDate() === date.getDate();
    });
  };

  const toggleHolidayModal = () => {
    setIsHolidayModalOpen(!isHolidayModalOpen);
  };

  // Renderiza os feriados no modal
  const renderHolidayList = () => {
    return holidays.map((holiday, index) => (
      <div key={index} className="holiday_item">
        <p><strong>{holiday.name}</strong> - {holiday.date.toLocaleDateString()}</p>
      </div>
    ));
  };
  
  return (
    <div className="vacations_content">
      <div className="vacations_left_section">
        <h1 className="main_title">Annual Leave: {vacationData?.year || 'Loading...'} </h1>
        <img src={vacations} alt="calendar photo" className="annual_leave_photo"/>
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
        <h1 className="main_title">Annual Leave Request</h1>
  
        <form className="annual_leave_form" onSubmit={handleSubmitVacationRequest}>
        
          <label className="form_label">Start date:</label>
          <div className="start_date_container">
            <input
              className="form_input"
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            /> 
            <FaCalendarAlt
              title="Holidays"
              className="holiday_icon"
              onClick={toggleHolidayModal}
            />
          </div>
          {startDate && isHoliday(new Date(startDate)) && (
            <div className="holiday_warning">This is a holiday!</div>
          )}

          {/* Modal com os feriados */}
          {isHolidayModalOpen && (
            <div className="holiday_modal">
              <div className="holiday_modal_content">
                <h3>Public Holidays</h3>
                {renderHolidayList()}
                <button className="close_modal" onClick={toggleHolidayModal}>Close</button>
              </div>
            </div>
          )}
          
          <label className="form_label">End date:</label>
          <input
            className="form_input"
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          {endDate && isHoliday(new Date(endDate)) && (
            <div className="holiday_warning">This is a holiday!</div>
          )}
          
          <h3 className="secondary_title">Request for a Half Day or Full Day off:</h3>
          <div className="info">(Only for half and full days)</div>
          <select className="option_selected" value={halfDay} onChange={(e) => setHalfDay(parseFloat(e.target.value))}>
            <option value={0.0}>Select an option</option>
            <option value={1.0}>Full Day</option>
            <option value={0.5}>Half Day</option>
          </select>

          <button className="submit_button" type="submit">🗓️ Submit Annual Leave Request</button>

          {/* IT ISNT A PART OF THE FORM, ITS JUST TO BE ALIGN WITH IT */}
          {/*BEGIN */}
          {vacationRequestStatus && (
            <div>
              <h3>Status</h3>
              <p>{vacationRequestStatus.message}</p>
            </div>
          )}

          <div>
            <h3 className="vacation_request_status">Last request state:</h3>
            <div>
              Request status – 
              <span
                className={
                  currentVacationStatus === 313330002
                    ? 'status_text rejected'
                    : currentVacationStatus === 313330000
                    ? 'status_text pending'
                    : currentVacationStatus === 313330001
                    ? 'status_text approved'
                    : 'status_text'
                }
              >
                {vacationStatusMap[currentVacationStatus] || 'Unknown'}
              </span>
            </div>
          </div>

          {isRejected && (
            <div className="rejection_reason">
              <label>Rejection reason:</label>
              <textarea
                id="reasonIfRejected"
                value={reasonIfRejected}
                readOnly
              ></textarea>
            </div>
          )}
          {/* END */}

        </form>
      </div>
    </div>
  );
};

export default Vacations;