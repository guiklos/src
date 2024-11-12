import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5188/auth/login', {
        username,
        password,
      });

      localStorage.setItem('token', response.data.token);

      navigate('/pedidos');
    } catch (error) {
      setError('Nome ou senha inválidos.');
    }
  };

  const handleForgotPassword = () => {
    toast.info('Para redefinir sua senha, entre em contato com o suporte.', {
      position: "top-right", // Definindo a posição correta
      autoClose: 5000,       // Fecha automaticamente em 5 segundos
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  

  return (
    <div style={styles.container}>
      <form style={styles.form} onSubmit={handleLogin}>
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>LCPC</h1>
          <p style={styles.slogan}>Tecnologia construindo o Futuro</p>
        </div>

        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Nome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.loginButton}>
          Entrar
        </button>

        <p style={styles.forgotPassword}>
          Esqueceu a senha?{' '}
          <a href="#" onClick={handleForgotPassword} style={styles.link}>
            Clique aqui
          </a>
        </p>
      </form>

      <ToastContainer />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f0f0',
  },
  form: {
    backgroundColor: '#fff',
    padding: '50px',
    borderRadius: '10px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: '40px',
  },
  logo: {
    fontSize: '50px',
    color: '#000',
    margin: '0',
    fontFamily: '"Arial Black", Gadget, sans-serif',
  },
  slogan: {
    fontSize: '18px',
    color: '#00A1E4',
    marginTop: '10px',
    fontWeight: '300',
  },
  inputGroup: {
    width: '100%',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '16px',
    boxSizing: 'border-box',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  loginButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#002C44',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
  },
  error: {
    color: 'red',
    marginBottom: '10px',
  },
  forgotPassword: {
    marginTop: '15px',
    fontSize: '14px',
    color: '#555',
  },
  link: {
    color: '#00A1E4',
    textDecoration: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default Login;
