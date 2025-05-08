import React, { useState } from 'react'
import BannerAndFooter from '../components/banner_and_footer'
import logo from '../assets/imgs/logotype.png'
import { useNavigate } from 'react-router-dom';

function Register() {

  // CONSTS TO USER REGISTERING
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const navigate = useNavigate();

  // FUNCTION TO USER REGISTERING 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    alert("User registered sucessfully!");
  };

  const handleBack = () => {
    navigate('/');  // Navigates to index page
  };

  return (
    <>
      <BannerAndFooter /> 
      <div className="app_content">
        <div className="app_title">
        <strong>WorkTime Report</strong>
        <img src={logo} alt="WorkTime Report Icon" className="app_icon" />
        </div>
        <p className="app_info">A tool for your daily time reporting tasks</p>
        <div className="register_form" >
          <h2 className="register_form_title">Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>
              <input
                type="email"
                value={email}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              </label>
            </div>
            <div>
              <label>
              <input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              </label>
            </div>
            <div>
              <label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              </label>
            </div>
            <button className="btn_register" type="submit">Register</button>
            <button className="btn_back" onClick={handleBack}>Back</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Register;