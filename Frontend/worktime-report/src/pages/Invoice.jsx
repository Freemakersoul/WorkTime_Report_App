import React, { useEffect, useState } from 'react';
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

const Invoice = () => {

  // CONSTS TO FETCH SELECTED CLIENT INFO
  const [invoices, setInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // USEEFFECT TO FETCH INVOICE DATA
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-invoices');
        const data = response.data?.value || [];
        setInvoices(data);
        if (data.length > 0) {
          const firstClient = data[0]?.cr6ca_AccountID?.name || '';
          setSelectedClient(firstClient);
        }
      } catch (error) {
        console.error('Error while fetching invoices:', error);
      }
    };

    fetchInvoices();
  }, []);

  // USE EFFECT TO FETCH INVOICE DATA FROM SELECTED CLIENT
  useEffect(() => {
    if (selectedClient) {
      const invoice = invoices.find(inv => inv.cr6ca_AccountID?.name === selectedClient);
      setSelectedInvoice(invoice);
    }
  }, [selectedClient, invoices]);

  // FUNCTION TO GET CLIENT PHOTO BASED ON CLIENT NAME
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
  
    return nameMap[clientName] || alticeImg;  
  };

  return (
    <div className="invoice_content">
      {/* LEFT SECTION - SELECT CLIENT */}
      <div className="invoice_left_section">
        <h1 className="main_title">Client Projects</h1>
        <label className="client_select" htmlFor="client-select">Select a Client:</label>
        <select
          id="client-select"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
        >
          {Array.from(new Set(invoices.map(inv => inv.cr6ca_AccountID?.name)))
            .filter(name => !!name)
            .map((name, idx) => (
              <option key={idx} value={name}>{name}</option>
            ))}
        </select>

        {selectedInvoice && (
          <div className="client_summary">
            <img
              src={getClientImagePath(selectedInvoice.cr6ca_AccountID?.name)}
              alt="Client"
              onError={(e) => e.currentTarget.src = '/assets/imgs/default_profile_photo.png'}
            />
            <p><strong>Client:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_AccountID?.name || '—'}</span></p>
            <p><strong>Project:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_ProjectID?.cr6ca_name || '—'}</span></p>
            
          </div>
        )}
      </div>

      <div className="divider"></div>
      
      {/* RIGHT SECTION - CLIENT INVOICE INFO */}
      <div className="invoice_right_section">
        <h1 className="main_title">Client Invoice Details</h1>
        {selectedInvoice ? (
          <div>
            <img
              src={getClientImagePath(selectedInvoice.cr6ca_AccountID?.name)}
              alt="Client"
              onError={(e) => e.currentTarget.src = '/assets/imgs/default_profile_photo.png'}
            />

            <p><strong>Client:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_AccountID?.name || '—'}</span></p>

            <p><strong>Project:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_ProjectID?.cr6ca_name || '—'}</span></p>

            <p><strong>Amount:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_amount || '—'} €</span></p>

            <p><strong>Base amount:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_amountbase || '—'} €</span></p>

            <p><strong>Issue date:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_issuedate?.split('T')[0] || '—'}</span></p>


            <p><strong>Due date:</strong> <span style={{ color: 'aqua' }}>{selectedInvoice.cr6ca_duedate?.split('T')[0] || '—'}</span></p>
          </div>
        ) : (
          <p>Select a client to see more details.</p>
        )}
      </div>
    </div>
  );
};

export default Invoice;