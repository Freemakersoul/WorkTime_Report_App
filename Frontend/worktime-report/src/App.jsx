import { useState, useEffect } from 'react';
import logo from './assets/imgs/logotype.png';
import BannerAndFooter from './components/BannerAndFooter';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* FUNCTIONAL COMPONENT THAT CONTAINS THE INDEX CONTENT AND
 HANDLES THE REGISTER AND THE LOGIN TO THE APP*/
const App = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // USER REGISTER
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    const userData = {
      email: email,
      name: name,
      password: password,
      usertype: 313330000
    };

    setLoading(true); // Show loading
    setErrorMessage(''); // cleans the previous error message

    try {
      const response = await axios.post("http://localhost:8000/create-user", userData,{
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log("ID criado:", response.data.cr6ca_employeeid);
      alert("Usuário registrado com sucesso!");
      localStorage.setItem('registerMessage', 'Register in evaluation');
      navigate('/');  // Navigates to index page after success
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      setErrorMessage('Erro ao registrar usuário. Tente novamente.');
    } finally {
      setLoading(false); // Finishes Loading
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post("http://localhost:8000/login", { email, password });
  
      localStorage.setItem("user", JSON.stringify(response.data.user)); // salva o nome, email, etc
  
      alert("Login bem-sucedido!");
      window.location.href = "/dashboard"; // ou usa useNavigate("/dashboard")
    } catch (error) {
      console.error("Erro no login:", error.response?.data || error.message);
      alert("Email ou senha inválidos. Tente novamente.");
    }
    
  };

  useEffect(() => {
    const message = localStorage.getItem('registerMessage');
    if (message) {
      setRegisterMessage(message);
      localStorage.removeItem('registerMessage'); // Cleans message after show up
    }
  }, []);

  return (
    <>
      <BannerAndFooter />
      <div className="app_content">
        <div className="app_title">
          <strong>WorkTime Report</strong>
          <img src={logo} alt="WorkTime Report Icon" className="app_icon" />
        </div>
        <p className="app_info">A tool for your daily time reporting tasks</p>

        {registerMessage && <div className="register_message">{registerMessage}</div>}

        <div className="login_or_register">
          {!isRegistering ? (
            <>
              <h1 className="login_title">Sign in</h1>

              <form className="login_form" onSubmit={handleLogin}>
                <label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete = "email"
                    required
                  />
                </label>
                <label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete = "password"
                    required
                  />
                </label>
                <button className="btn_login" type="submit">Login</button>
              </form>

              <p className="register_info">
                Don't you have an account?{' '}
                <button onClick={() => setIsRegistering(true)} className="register_link">Sign up!</button>
              </p>
            </>
          ) : (
            <>
              <h2 className="register_form_title">Sign Up</h2>
              <form className="register_form" onSubmit={handleSubmit}>
                <div>
                  <label>
                    <input
                      type="text"
                      value={name}
                      id="name"
                      placeholder="First and last name"
                      onChange={(e) => setName(e.target.value)}
                      autoComplete = "name"
                      required
                    />
                  </label>
                  <label>
                    <input
                      type="email"
                      value={email}
                      id="email"
                      placeholder="Email"
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete = "email"
                      required
                    />
                  </label>

                  <label>
                    <input
                      type="password"
                      value={password}
                      id="password"
                      placeholder="Password"
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete = "password"
                      required
                    />
                  </label>

                  <label>
                    <input
                      type="password"
                      id="confirm_password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete = "password"
                      required
                    />
                  </label>

                  {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                  {loading ? (
                    <button className="btn_register" type="submit" disabled>Loading...</button>
                  ) : (
                    <button className="btn_register" type="submit">Register</button>
                  )}
                  <button className="btn_back" onClick={() => setIsRegistering(false)}>Back</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default App;