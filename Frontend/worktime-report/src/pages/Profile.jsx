import React, {useEffect, useState} from 'react';
import defaultProfilePhoto from '../assets/imgs/default_profile_photo.png';
import axios from 'axios';

// Reports.jsx
const Profile = () => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');

  // Carregar dados do usuário e roles ao montar o componente
  useEffect(() => {
    // Obter dados do usuário do localStorage (incluindo userId)
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserName(user.name);
      setUserEmail(user.email);
      setUserPassword(user.password); // Se a senha estiver no localStorage
    }

    // Obter as opções de cargos (roles) disponíveis
    const fetchRoles = async () => {
      try {
        const response = await axios.get('http://localhost:8000/get-role-values'); // URL do backend
        setRoles(response.data.roles); // Corrigido para acessar "roles"
      } catch (error) {
        console.error('Erro ao buscar opções de cargos:', error);
      }
    };
    fetchRoles();
  }, []);

  // Função para atualizar o perfil do usuário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Obter o userId do localStorage (não alterá-lo aqui)
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;  // Obter o userId diretamente do localStorage

    if (!userId) {
      alert('Usuário não encontrado.');
      return;
    }

    try {
      const response = await axios.patch(`http://localhost:8000/update-user/${userId}`, {
        email: userEmail,
        name: userName,
        password: userPassword,
        usertype: 313330000
      });

      console.log('Usuário atualizado:', response.data);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar o perfil:', error);
      alert('Erro ao atualizar o perfil');
    }
  };

  useEffect(() => {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (user && user.name) {
        setUserName(user.name);
      }
    }, []);

  return (
    <div className="profile_content">
      <div className="profile_right_content">
        <img src={defaultProfilePhoto} alt="profile photo" className="profile_photo" />
        <div className="profile_name">{userName}</div>
      </div>
      {/* Formulário para editar o perfil */}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            required
          />
        </div>

        {/* Dropdown para escolher o cargo */}
        <div>
          <label>Cargo:</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            required
          >
            <option value="">Selecione um cargo</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Atualizar Perfil</button>
      </form>
    </div>
  );
};

export default Profile;