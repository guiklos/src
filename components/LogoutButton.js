import React from 'react';
import { useNavigate } from 'react-router-dom';
import ''; 

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {

    localStorage.removeItem('token');

    navigate('/login');
  };

  return (
    <div className="logoutButton">
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default LogoutButton;