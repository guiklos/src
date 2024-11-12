// src/components/PedidosList.js
import React, { useEffect, useState } from 'react';
import { fetchCidades } from '../services/cityService';

const CidadesList = () => {
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCidades = async () => {
      try {
        const data = await fetchCidades();
        setCidades(data);
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
      } finally {
        setLoading(false);
      }
    };

    getCidades();
  }, []);

  if (loading) return <div>Carregando...</div>;

  console.log(cidades, 'FUUU');

  return (
    <div>
      <h1>Lista de Cidades</h1>
      <ul>
        {cidades.map(cidade => (
          <li key={cidade}>{cidade}</li>
        ))}
      </ul>
    </div>
  );
};

export default CidadesList;
