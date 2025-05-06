// Styles, libraries, components, modules imports
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css';
import './styles/banner_and_footer.css';
import './styles/header.css';
import './styles/main_dashboard.css';
import './styles/profile.css';
import './styles/management.css';
import './styles/vacations.css';
import './styles/reports.css';
import './styles/invoice.css';
import './styles/dashboard.css';
import App from './App.jsx';
import MainDashboard from './pages/MainDashboard';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Vacations from './pages/Vacations';
import Management from './pages/Management';
import Profile from './pages/Profile';
import Invoice from './pages/Invoice';

// Routes navigation
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} /> 
        <Route path="/dashboard" element={<MainDashboard />}>
          <Route index element={<Dashboard />} /> {/* Main content */}
          <Route path="reports" element={<Reports />} />
          <Route path="vacations" element={<Vacations />} />
          <Route path="management" element={<Management />} />
          <Route path="profile" element={<Profile />} />
          <Route path="invoice" element={<Invoice />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
