import axios from 'axios';

// Cria uma instância do axios
const api = axios.create({
  baseURL: 'http://localhost:5188', // Defina o URL base da sua API
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Recupera o token do localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`; // Adiciona o token ao cabeçalho
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
