import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/index.css';
import './styles/banner_and_footer.css';
import './styles/header.css';
import './styles/main_dashboard.css';
import './styles/profile.css';
import App from './App.jsx';
import MainDashboard from './pages/MainDashboard';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Vacations from './pages/Vacations';
import Settings from './pages/Settings';
import Profile from './pages/Profile'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} /> 
        <Route path="/dashboard" element={<MainDashboard />}>
          <Route index element={<Dashboard />} /> {/* Conteúdo principal */}
          <Route path="reports" element={<Reports />} />
          <Route path="vacations" element={<Vacations />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
