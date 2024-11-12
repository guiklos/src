import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Relatorios from './components/Relatorios'; 
import Pedidos from './components/Pedidos';     
import Clientes from './components/Clientes';   
import Produtos from './components/Produtos';   
import Login from './components/Login';         
import logo from './images/logo512.png';      
import { isAuthenticated } from './utils/auth';

const LogoutButton = ({ handleLogout }) => {
  return (
    <div className="logoutButton">
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AuthenticatedLayout = ({ children }) => {
  const handleLogout = () => {

    localStorage.removeItem('token');

    window.location.href = '/login'; 
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <img src={logo} alt="Logo" className="logo" />
        <ul>
          <li>
            <Link to="/pedidos">Pedidos</Link>
          </li>
          <li>
            <Link to="/clientes">Clientes</Link>
          </li>
          <li>
            <Link to="/produtos">Produtos</Link>
          </li>
          <li>
            <Link to="/relatorios">Relatórios</Link>
          </li>
          <li>
            <Link to="https://slime-goose-9d2.notion.site/Central-de-ajuda-LCPC-128f55e7219b80d6b7b5e9a7dfa59e06">Ajuda</Link>
          </li>
        </ul>
        <LogoutButton handleLogout={handleLogout} />
      </nav>
      <div className="content">
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Pedidos /> {}
              </AuthenticatedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Relatorios />
              </AuthenticatedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/pedidos"
          element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Pedidos />
              </AuthenticatedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Clientes />
              </AuthenticatedLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/produtos"
          element={
            <PrivateRoute>
              <AuthenticatedLayout>
                <Produtos />
              </AuthenticatedLayout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

const styles = `
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: 'Inter', sans-serif;
  }

  body {
    background-color: #e1e8ee;
  }

  .app-container {
    display: flex;
    height: 100vh;
    overflow: hidden; 
  }

  .sidebar {
    width: 250px;
    background-color: #5A7696;
    color: #fff;
    height: 100%;
    padding: 20px;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    position: fixed;
  }

  .logo {
    width: 50%;
    margin-bottom: 20px;
  }

  .sidebar ul {
    list-style-type: none;
    padding: 0;
    width: 100%;
  }

  .sidebar li {
    margin: 20px 0;
  }

  .sidebar a {
    text-decoration: none;
    color: #fff;
    font-size: 18px;
    display: block;
    padding: 10px 15px;
    border-radius: 5px;
    background-color: #4D6784;
    text-align: center;
    transition: background 0.3s, transform 0.3s;
  }

  .sidebar a:hover {
    background-color: #405971;
    transform: translateY(-2px);
  }

  .content {
    margin-left: 280px;
    flex-grow: 1;
    padding: 20px;
    background-color: #ffffff;
    overflow-y: auto; 
  }

  .logoutButton {
    position: absolute;
    bottom: 5rem; 
    left: 20px; 
    width: calc(100% - 40px); 
  }

  .logoutButton button {
    width: 100%;
    background-color: #f44336;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    text-align: center;
    transition: background 0.3s ease-in-out;
  }

  .logoutButton button:hover {
    background-color: #d32f2f;
  }
`;

const injectStyles = () => {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
};

injectStyles();

export default App;