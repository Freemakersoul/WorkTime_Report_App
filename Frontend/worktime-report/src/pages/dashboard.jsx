import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import clock from '../assets/imgs/clock.png';
import axios from 'axios';
import alticeImg from '../assets/imgs/altice.png';
import amazonImg from '../assets/imgs/amazon.png';
import cufImg from '../assets/imgs/CUF.png';
import fnacImg from '../assets/imgs/fnac.png';
import googleImg from '../assets/imgs/google.png';
import pfizerImg from '../assets/imgs/pfizer.png';
import wortenImg from '../assets/imgs/worten.png';
import microsoftImg from '../assets/imgs/microsoft.png';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
import reportIcon from '../assets/imgs/report.png';

const Dashboard = () => {

  const [summary, setSummary] = useState({
    totalHours: 0,
    projects: [],
    clients: [],
  });

  const [reportStatusSummary, setReportStatusSummary] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  });

  const [vacationStats, setVacationStats] = useState({
    approved: 0,
    rejected: 0,
    pending: 0,
    usedDays: 0,
    availableDays: 0,
    carriedOverDays: 0,
  });

  const COLORS = ['lightgreen', 'orange']; 
  const [latestReportData, setLatestReportData] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/get-user-timereports?cr6ca_employeeid=${userId}`);
        const reports = res.data.value || [];

        let total = 0;
        const projectSet = new Set();
        const clientSet = new Set();

        let approved = 0;
        let rejected = 0;
        let pending = 0;

        reports.forEach(report => {
          total += report.cr6ca_hoursworked || 0;

          if (report.cr6ca_ProjectID?.cr6ca_name) {
            projectSet.add(report.cr6ca_ProjectID.cr6ca_name);
          }

          if (report.cr6ca_AccountID?.name) {
            clientSet.add(report.cr6ca_AccountID.name);
          }

          const status = report.cr6ca_reportstatus;
          if (status === 313330001) approved++;
          else if (status === 313330002) rejected++;
          else pending++;

        });

        setSummary({
          totalHours: total,
          projects: Array.from(projectSet),
          clients: Array.from(clientSet),
        });

        setReportStatusSummary({
          total: reports.length,
          approved,
          rejected,
          pending
        });

        // Find most recent report
        const sorted = reports.sort((a, b) => new Date(b.createdon) - new Date(a.createdon));
        const latest = sorted[0];

        if (latest) {
          const accountName = latest.cr6ca_AccountID?.name;
          const projectName = latest.cr6ca_ProjectID?.cr6ca_name;

          // Fetch invoices to find matching one
          const invoiceRes = await axios.get('http://localhost:8000/get-invoices');
          const invoices = invoiceRes.data.value || [];

          const matchingInvoice = invoices.find(inv =>
            inv.cr6ca_AccountID?.name === accountName &&
            inv.cr6ca_ProjectID?.cr6ca_name === projectName
          );

          setLatestReportData({
            clientName: accountName,
            projectName: projectName,
            amount: matchingInvoice?.cr6ca_amount || 'N/A',
            clientImage: getClientImagePath(accountName)
          });
        }

      } catch (err) {
        console.error('Erro ao buscar relatórios:', err);
      }
    };

    const fetchVacationStats = async () => {
      try {
        const [vacationsRes, balanceRes] = await Promise.all([
          axios.get('http://localhost:8000/get-all-vacations'),
          axios.get(`http://localhost:8000/get-vacation-balance/${userId}`)
        ]);
    
  
        const userVacations = vacationsRes.data.vacations.filter(vac => vac.user.email === user.email);
    
        let approved = 0, rejected = 0, pending = 0;
    
        userVacations.forEach(v => {
          const status = v.vacation_status;
          if (status === 313330001) approved++;
          else if (status === 313330002) rejected++;
          else pending++;
        });
        

        const balances = balanceRes.data.vacation_balances;
        const currentYear = new Date().getFullYear();
        const current = balances.find(b => b.year === currentYear);
    
        const carriedOver = current?.carried_over_days ?? 0;
        const available = current.available_days + carriedOver;
        const usedDays =  (22 + carriedOver) - available;
    
        setVacationStats({
          approved,
          rejected,
          pending,
          usedDays,
          availableDays: available,
          carriedOverDays: carriedOver
        });
    
      } catch (err) {
        console.error("Erro ao buscar dados de férias:", err);
      }
    };
    
    fetchVacationStats();
    fetchReports();
  }, []);

  
  const getClientImagePath = (clientName) => {
    if (!clientName) return defaultProfilePhoto;  

    const nameMap = {
      'Altice': alticeImg,
      'Amazon': amazonImg,
      'CUF': cufImg,
      'Fnac': fnacImg,
      'Google': googleImg,
      'Microsoft': microsoftImg,
      'Pfizer': pfizerImg,
      'Worten': wortenImg
    };

    return nameMap[clientName] || defaultProfilePhoto;  
  };

  return (
    <div className="dashboard_content">
      <div className="dashboard_left_section">
        <div className="top_left_section">
          <img src={clock} alt="clock photo" className="clock"/>
          <div>
            <p><strong>Total hours worked:</strong> <span style={{ color: 'aqua' }}>{summary.totalHours}</span></p>
            <p><strong>Projects:</strong> <span style={{ color: 'aqua' }}>{summary.projects.join(', ') || 'Nenhum'}</span></p>
            <p><strong>Clients:</strong> <span style={{ color: 'aqua' }}>{summary.clients.join(', ') || 'Nenhum'}</span></p>
          </div>
        </div>
        <div className="horizontal-divider" />
        <div className="down_left_section">
          {latestReportData ? (
            <>
              <img
                src={latestReportData.clientImage}
                alt="Client"
                className="client_image"
                onError={(e) => e.currentTarget.src = '/assets/imgs/default_profile_photo.png'}
              />
              <div>
                <label><span style={{ color: 'lightgreen' }}>Currently working on:</span></label>
                <p><strong>Client:</strong> <span style={{ color: 'aqua' }}>{latestReportData.clientName}</span></p>
                <p><strong>Project:</strong> <span style={{ color: 'aqua' }}>{latestReportData.projectName}</span></p>
                <p><strong>Invoice amount:</strong> <span style={{ color: 'aqua' }}>{latestReportData.amount} €</span></p>
              </div>
            </>
          ) : (
            <p>Carregando informações do último relatório...</p>
          )}
        </div>
      </div>

      <div className="divider"></div>

      <div className="dashboard_right_section">
        <div className="top_right_section">
          <img  className="reports_icon" src={reportIcon} alt="Report Icon"/>
            <div>
              <p><strong>Reports submitted:</strong> <span style={{ color: 'aqua' }}>{reportStatusSummary.total}</span></p>
              <p><strong> Reports approved:</strong> <span style={{ color: 'lightgreen' }}>{reportStatusSummary.approved}</span></p>
              <p><strong>Reports rejected:</strong> <span style={{ color: 'red' }}>{reportStatusSummary.rejected}</span></p>
              <p><strong>Reports pending:</strong> <span style={{ color: 'orange' }}>{reportStatusSummary.pending}</span></p>
          </div>
        </div>

        <div className="horizontal-divider" />

        <div className="down_right_section">
        <div>
            <p><strong>Vacation Requests:</strong></p>
            <p>Approved: <span style={{ color: 'lightgreen' }}>{vacationStats.approved}</span></p>
            <p>Rejected: <span style={{ color: 'red' }}>{vacationStats.rejected}</span></p>
            <p>Pending: <span style={{ color: 'orange' }}>{vacationStats.pending}</span></p>
          </div>

          <div className="vacation-chart-wrapper" style={{ width: '40%', height: 200 }}>

          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={[
                  { name: 'Remaining Days', value: vacationStats.availableDays },
                  { name: 'Used Days', value: vacationStats.usedDays },
                ]}
                cx="50%" cy="50%"
                outerRadius={50}
                dataKey="value"
                label
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;