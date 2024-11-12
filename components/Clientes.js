import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import InputMask from 'react-input-mask';
import styles from '../Styles/Clientes.module.css';

Modal.setAppElement('#root');

const Clientes = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentClient, setCurrentClient] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteIsOpen, setConfirmDeleteIsOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [cities, setCities] = useState([]);
  const [emailError, setEmailError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    cnpj: '',
    email: ''
  });
  
  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('http://localhost:5188/Client', axiosConfig);
        const sortedClients = sortClientsByName(response.data, sortOrder);
        setClients(sortedClients);
      } catch (err) {
        setError('Erro ao carregar os clientes');
      } finally {
        setLoading(false);
      }
    };

    const fetchCities = async () => {
      try {
        const response = await axios.get('http://localhost:5188/City', axiosConfig);
        setCities(response.data);
      } catch (err) {
        setError('Erro ao carregar as cidades');
      }
    };

    fetchClients();
    fetchCities();
  }, [sortOrder]);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
  };

  const sortClientsByName = (clientsArray, order) => {
    return [...clientsArray].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return order === 'asc' ? comparison : -comparison;
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      city: '',
      cnpj: '',
      email: ''
    });
  };

  const filterClients = (clientsList) => {
    return clientsList.filter(client => {
      const cityName = cities.find(city => city.id === client.fkCityId)?.name || '';
      
      const nameMatch = client.name.toLowerCase().includes(filters.name.toLowerCase());
      const cityMatch = !filters.city || cityName.toLowerCase().includes(filters.city.toLowerCase());
      const cnpjMatch = client.cnpj.includes(filters.cnpj.replace(/\D/g, ''));
      const emailMatch = client.email.toLowerCase().includes(filters.email.toLowerCase());

      return nameMatch && cityMatch && cnpjMatch && emailMatch;
    });
  };

  const openModal = (client = null) => {
    setCurrentClient(client || {
      name: '',
      streetplace: '',
      neighborhood: '',
      number: '',
      complement: '',
      phone: '',
      email: '',
      cnpj: '',
      fkCityId: '',
    });
    setIsEditing(!!client);
    setModalIsOpen(true);
    setEmailError(null);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setCurrentClient(null);
  };

  const openConfirmDeleteModal = (client) => {
    setClientToDelete(client);
    setConfirmDeleteIsOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setConfirmDeleteIsOpen(false);
    setClientToDelete(null);
  };

  const handleInputChange = (field, value) => {
    setCurrentClient((prevClient) => ({
      ...prevClient,
      [field]: value,
    }));
  };

  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSave = async () => {
    if (!isValidEmail(currentClient.email)) {
      setEmailError('O email fornecido não é válido. Por favor, insira um email válido.');
      return;
    }

    try {
      const cleanedClient = {
        ...currentClient,
        phone: removeMask(currentClient.phone),
        cnpj: removeMask(currentClient.cnpj),
      };

      if (isEditing) {
        await axios.put(`http://localhost:5188/Client/${currentClient.id}`, cleanedClient, axiosConfig);
      } else {
        await axios.post('http://localhost:5188/Client', cleanedClient, axiosConfig);
      }

      const response = await axios.get('http://localhost:5188/Client', axiosConfig);
      setClients(sortClientsByName(response.data, sortOrder));
      closeModal();
    } catch (err) {
      setError('Erro ao salvar cliente');
    }
  };

  const formatPhone = (phone) => {
    return phone
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatCNPJ = (cnpj) => {
    return cnpj
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const removeMask = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleDelete = async () => {
    if (clientToDelete) {
      try {
        await axios.delete(`http://localhost:5188/Client/${clientToDelete.id}`, axiosConfig);
        setClients((prevClients) => prevClients.filter((client) => client.id !== clientToDelete.id));
        closeConfirmDeleteModal();
      } catch (err) {
        setError('Erro ao excluir cliente');
      }
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  const filteredClients = filterClients(clients);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Clientes</h1>
        <button
          onClick={() => window.location.href = 'https://slime-goose-9d2.notion.site/CLIENTES-128f55e7219b8081b0d2c0d051357dd9'}
          className={styles.helpButton}
        >
          <span className={styles.icon}>?</span>
        </button>
      </div>
      
      <button className={styles.createButton} onClick={() => openModal()}>
        Adicionar Novo Cliente
      </button>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            className={styles.filterInput}
          />
          
          <input
            type="text"
            placeholder="Filtrar por cidade..."
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className={styles.filterInput}
          />
          
          <InputMask
            mask="99.999.999/9999-99"
            placeholder="Filtrar por CNPJ..."
            value={filters.cnpj}
            onChange={(e) => handleFilterChange('cnpj', e.target.value)}
            className={styles.filterInput}
          />
          
          <input
            type="text"
            placeholder="Filtrar por email..."
            value={filters.email}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            className={styles.filterInput}
          />
          
          <button onClick={clearFilters} className={styles.clearFiltersButton}>
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                Nome
                <button onClick={toggleSortOrder} className={styles.sortButton}>
                  {sortOrder === 'asc' ? '↓' : '↑'}
                </button>
              </th>
              <th>Rua</th>
              <th>Bairro</th>
              <th>Número</th>
              <th>Complemento</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>CNPJ</th>
              <th>Cidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const cityName = cities.find((city) => city.id === client.fkCityId)?.name || 'Não especificado';

              return (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.streetplace}</td>
                  <td>{client.neighborhood}</td>
                  <td>{client.number}</td>
                  <td>{client.complement}</td>
                  <td>{formatPhone(client.phone)}</td>
                  <td>{client.email}</td>
                  <td>{formatCNPJ(client.cnpj)}</td>
                  <td>{cityName}</td>
                  <td>
                    <button className={styles.editButton} onClick={() => openModal(client)}>
                      Editar
                    </button>
                    <button className={styles.deleteButton} onClick={() => openConfirmDeleteModal(client)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel={isEditing ? 'Editar Cliente' : 'Criar Cliente'}
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <h2>{isEditing ? 'Editar Cliente' : 'Criar Cliente'}</h2>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={currentClient?.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          <label>Nome</label>
        </div>
        <div className={styles.inputContainer}>
          <InputMask
            mask="(99) 99999-9999"
            value={currentClient?.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
          <label>Telefone</label>
        </div>
        <div className={styles.inputContainer}>
          <InputMask
            mask="99.999.999/9999-99"
            value={currentClient?.cnpj || ''}
            onChange={(e) => handleInputChange('cnpj', e.target.value)}
          />
          <label>CNPJ</label>
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={currentClient?.streetplace || ''}
            onChange={(e) => handleInputChange('streetplace', e.target.value)}
          />
          <label>Rua</label>
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={currentClient?.neighborhood || ''}
            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
          />
          <label>Bairro</label>
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={currentClient?.number || ''}
            onChange={(e) => handleInputChange('number', e.target.value)}
          />
          <label>Número</label>
        </div>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={currentClient?.complement || ''}
            onChange={(e) => handleInputChange('complement', e.target.value)}
          />
          <label>Complemento</label>
        </div>
        <div className={styles.inputContainer}>
          <input
            type="email"
            value={currentClient?.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
          <label>Email</label>
          {emailError && <p className={styles.error}>{emailError}</p>}
        </div>
        <div className={styles.inputContainer}>
          <select
            value={currentClient?.fkCityId || ''}
            onChange={(e) => handleInputChange('fkCityId', e.target.value)}
          >
            <option value="">Selecione a cidade</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <label>Cidade</label>
        </div>
        <button onClick={handleSave} className={styles.saveButton}>
          {isEditing ? 'Salvar' : 'Criar'}
        </button>
        <button onClick={closeModal} className={styles.cancelButton}>
          Cancelar
        </button>
      </Modal>

      <Modal
        isOpen={confirmDeleteIsOpen}
        onRequestClose={closeConfirmDeleteModal}
        contentLabel="Excluir Cliente"
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <h2>Tem certeza que deseja excluir o cliente {clientToDelete?.name}?</h2>
        <button onClick={handleDelete} className={styles.deleteConfirmButton}>
          Excluir
        </button>
        <button onClick={closeConfirmDeleteModal} className={styles.cancelButton}>
          Cancelar
        </button>
      </Modal>
    </div>
  );
};

export default Clientes;