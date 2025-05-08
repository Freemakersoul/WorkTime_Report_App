import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { FaCalendarAlt } from 'react-icons/fa';
import vacations from '../assets/imgs/vacations.png';

const Vacations = () => {

  // CONSTS TO CREATE VACATION REQUEST, TO SEE REQUEST STATE, ETC...
  const [vacationData, setVacationData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [halfDay, setHalfDay] = useState(0); 
  const [reasonIfRejected, setReasonIfRejected] = useState('');
  const [currentVacationStatus, setCurrentVacationStatus] = useState(313330000);
  const [isRejected, setIsRejected] = useState(false); 
  const [vacationRequestStatus, setVacationRequestStatus] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  const { addNotification } = useOutletContext();

  // UEEFECCTS TO FETCH VACATION DATA, VACATION STATUS AND FECTCH HOLIDAYS
  useEffect(() => {

    if (!user || !user.id) {
      console.log('User not found');
      return;
    }
    
    // FUNCTION TO FETCH VACATION DATA
    const fetchVacationData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/get-vacation-balance/${user.id}`);
        

        if (response.data.vacation_balances && response.data.vacation_balances.length > 0) {
          // Sort data by year (from the last to the oldest)
          const sorted = response.data.vacation_balances.sort((a, b) => b.year - a.year);
          setVacationData(sorted[0]); 
        }
      } catch (error) {
        console.error('Error while fetching vacation balance:', error);
      }
    };

    // FUNCTION TO FETCH VACATION STATUS
    const fetchVacationStatusByUser = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/get-vacation-status-by-user-id/${user.id}`);
        console.log('Most recent status:', response.data);
    
        const { vacation_status, reason_if_rejected } = response.data;
    
        setCurrentVacationStatus(vacation_status);
        setReasonIfRejected(reason_if_rejected);
    
        setIsRejected(vacation_status === 313330002); 
      } catch (error) {
        console.error('Error while fetching most recent status:', error);
      }
    };

    // FUNCTION TO FETCH PUBLIC HOLIDAYS
    const fetchHolidays = async () => {
          try {
            const response = await axios.get("http://localhost:8000/get-public-holidays"); // 
            const formatted = response.data.holidays.map(h => ({
              date: new Date(h.cr6ca_holidaydate),
              name: h.cr6ca_description
            }));

            formatted.sort((a, b) => a.date - b.date);

            setHolidays(formatted);
          } catch (error) {
            console.error("Error fetching public holidays:", error);
          }
        };

    
    fetchVacationData();
    fetchVacationStatusByUser();
    fetchHolidays();
  },[]);

  // FUNCTION TO HANDLE VACATION REQUEST SUBMITTION
  const handleSubmitVacationRequest = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert('Complete all fields');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert('The start date must be earlier or equal to the end date.');
      return;
    }

    // CALCULATE REQUESTED DAYS
    let requestedDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = SUNDAY, 6 = SATURDAY
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(current)) {
        requestedDays++;
      }
  
      current.setDate(current.getDate() + 1);
    }

    if (halfDay === 0.5 && start.toDateString() === end.toDateString()) {
      requestedDays = 0.5;
    }

    // CONST TAHT GETS AVAILABLE DAYS VALUE
    const availableDays = vacationData?.available_days ?? 0;

    if (requestedDays > availableDays) {
      alert('You have not enough available days to make the request.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/create-vacation', {
        start_date: startDate,
        end_date: endDate,
        half_day: halfDay,
        user_id: user.id
      });

      setVacationRequestStatus(response.data); 

      // If request is rejected, allow reason if rejected to be write 
      if (response.data.status === 'rejected') {
        setIsRejected(true);
        setReasonIfRejected(response.data.reason_if_rejected || ''); 
      }
      
      alert('Annual leave request submitted!');
      addNotification('✅ Annual leave request submitted!');

    } catch (error) {
      alert('Error while submmiting request!');
      addNotification('❌ Error while submmiting request!');
      console.error('Error while making request:', error);
      setVacationRequestStatus({ message: 'Error while making request:' });
    }
  };

  // DICTIONARY WITH VACATION STATUS
  const vacationStatusMap = {
    313330000: 'Pending',
    313330001: 'Approved',
    313330002: 'Rejected',
  };

  // FUNCTION THAT HANDLES IF ITS HOLIDAY OR NOT
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

  //FUNCTION THAT RENDERIZE HOLIDAYS ON MODAL
  const renderHolidayList = () => {

    const sortedHolidays = [...holidays].sort((a, b) => a.date - b.date);

    return sortedHolidays.map((holiday, index) => (
      <div key={index} className="holiday_item">
        <p><strong>{holiday.name}</strong> - {holiday.date.toLocaleDateString()}</p>
      </div>
    ));
  };
  
  return (
    <div className="vacations_content">
      {/* VACATIONS LEFT SECTION */}
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

      {/* VACATIONS RIGHT SECTION */}
      <div className="vacations_right_section">
        <h1 className="main_title">Annual Leave Request</h1>
        {/* VACATIONS REQUEST FORM */}
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
              title="Public Holidays"
              className="holiday_icon"
              onClick={toggleHolidayModal}
            />
          </div>
          {startDate && isHoliday(new Date(startDate)) && (
            <div className="holiday_warning">This is a holiday!</div>
          )}

          {isHolidayModalOpen && (
            <div className="holiday_modal">
              <div className="holiday_modal_content">
                <h2 style={{ color: 'aqua' }}>Public Holidays</h2>
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

          <button className="submit_button" type="submit">🗓️ Submit Request</button>

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