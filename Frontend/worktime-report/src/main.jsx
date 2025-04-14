import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/index.css'
import './styles/banner_and_footer.css'
import './styles/header.css'
import './styles/dashboard.css'
import App from './App.jsx'
import DashBoard from './pages/dashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} /> 
        <Route path="/dashboard" element={<DashBoard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
