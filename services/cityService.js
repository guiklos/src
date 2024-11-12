// src/services/CidadeService.js
import axiosInstance from '../api/axiosInstance';

export const fetchCidades = async () => {
  const response = await axiosInstance.get('/City');
  return response.data;
};

export const createCidade = async (cidade) => {
  const response = await axiosInstance.post('/City', cidade);
  return response.data;
};
