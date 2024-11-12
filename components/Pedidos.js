import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../Styles/Pedidos.module.css';



const OrderStatus = {
  Pending: 0,
  InProgress: 1,
  Delivered: 2,
  Canceled: 3,
};

const OrderStatusLabels = {
  0: 'Aguardando envio',
  1: 'Enviado',
  2: 'Entregue',
  3: 'Cancelado',
};

const getStateLabel = (stateValue) => {
  // Garantir que o valor seja um número
  const numericState = Number(stateValue);
  
  // Verificar se é um número válido e está no OrderStatusLabels
  if (!isNaN(numericState) && OrderStatusLabels.hasOwnProperty(numericState)) {
    return OrderStatusLabels[numericState];
  }
  
  // Log para debug
  console.log('Estado inválido recebido:', stateValue, 'Tipo:', typeof stateValue);
  return 'Estado desconhecido';
};


const Pedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPedido, setEditingPedido] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newPedido, setNewPedido] = useState({
    description: '',
    totalValue: 0,
    discount: 0,
    shippingDate: '',
    expectedDeliveryDate: '',
    state: 0, // AGUARDANDO_ENVIO
    nInstallments: '',
    fkUserId: '',
    fkClientId: '',
    items: []
  });
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [itemsOrdem, setItemsOrdem] = useState([]);
  const [products, setProducts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [sortField, setSortField] = useState(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [filters, setFilters] = useState({
    description: '',
    state: '',
    clientId: '',
    minValue: '',
    maxValue: '',
    startDate: '',
    endDate: ''
  });

   const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedData, setPaginatedData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPedidos.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredPedidos.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filteredPedidos.length / itemsPerPage));
    
    // Reset to first page if current page would be out of bounds
    if (currentPage > Math.ceil(filteredPedidos.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredPedidos, currentPage, itemsPerPage]);

  // Pagination controls
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = parseInt(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

   const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getSortedClients = () => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  };

  const getSortedProducts = () => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  };

  const token = localStorage.getItem('token');

  // Definir o cabeçalho Authorization
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`, // Adicionar o token JWT
    },
  };


  const applyFilters = () => {
    let filtered = [...pedidos];

    if (filters.description) {
      filtered = filtered.filter(pedido => 
        pedido.description.toLowerCase().includes(filters.description.toLowerCase())
      );
    }

    // Corrigido para usar status em vez de state
    if (filters.state !== '') {
      filtered = filtered.filter(pedido => 
        pedido.status === parseInt(filters.state)  // Mudado de state para status
      );
    }

    if (filters.clientId) {
      filtered = filtered.filter(pedido => 
        pedido.fkClientId === filters.clientId
      );
    }

    if (filters.minValue) {
      filtered = filtered.filter(pedido => 
        pedido.totalValue >= parseFloat(filters.minValue)
      );
    }

    if (filters.maxValue) {
      filtered = filtered.filter(pedido => 
        pedido.totalValue <= parseFloat(filters.maxValue)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(pedido => 
        new Date(pedido.shippingDate) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(pedido => 
        new Date(pedido.shippingDate) <= new Date(filters.endDate)
      );
    }

    filtered.sort((a, b) => new Date(b.shippingDate) - new Date(a.shippingDate));
    
    setFilteredPedidos(filtered);
};

  useEffect(() => {
    applyFilters();
  }, [filters, pedidos]);

   const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      description: '',
      state: '',
      clientId: '',
      minValue: '',
      maxValue: '',
      startDate: '',
      endDate: ''
    });
  };


  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pedidosRes, usersRes, clientsRes, itemsRes, productsRes] = await Promise.all([
          axios.get('http://localhost:5188/Order', axiosConfig),
          axios.get('http://localhost:5188/User', axiosConfig),
          axios.get('http://localhost:5188/Client', axiosConfig),
          axios.get('http://localhost:5188/ItemOrder', axiosConfig),
          axios.get('http://localhost:5188/Product', axiosConfig)
        ]);

        // Sort orders by creation date in descending order (most recent first)
        const sortedPedidos = pedidosRes.data.sort((a, b) => {
          return new Date(b.shippingDate) - new Date(a.shippingDate);
        });

        setPedidos(sortedPedidos);
        setFilteredPedidos(sortedPedidos);
        setUsers(usersRes.data);
        setClients(clientsRes.data);
        setItemsOrdem(itemsRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  

  const formatDate = (date) => date ? new Date(date).toISOString() : '';

  const handleShippingDate = async (pedidoId) => {
  try {
    const currentDate = new Date().toISOString();
    const pedidoToUpdate = pedidos.find(p => p.id === pedidoId);
    
    if (!pedidoToUpdate) {
      throw new Error('Pedido não encontrado');
    }

    // Criamos um objeto com todos os dados necessários para a atualização
    const updatedData = {
      ...pedidoToUpdate,
      shippingDate: currentDate,
      status: OrderStatus.InProgress, // Usando o enum OrderStatus definido no início do arquivo
      state: OrderStatus.InProgress // Atualizando também o state para manter consistência
    };

    // Fazemos o PUT com todos os dados necessários
    await axios.put(`http://localhost:5188/Order/${pedidoId}`, updatedData, axiosConfig);

    // Atualizamos o estado local
    const updatedPedidos = pedidos.map((pedido) =>
      pedido.id === pedidoId 
        ? { ...pedido, shippingDate: currentDate, status: OrderStatus.InProgress, state: OrderStatus.InProgress }
        : pedido
    );

    setPedidos(updatedPedidos);
    setFilteredPedidos(updatedPedidos);
    setSuccessMessage('Pedido marcado como enviado com sucesso!');
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  } catch (error) {
    console.error('Erro ao atualizar o status do pedido:', error);
    setError('Erro ao atualizar o status do pedido');
    
    setTimeout(() => {
      setError('');
    }, 3000);
  }
};

const handleCancelOrder = async (pedidoId) => {
  try {
    const pedidoToUpdate = pedidos.find(p => p.id === pedidoId);
    
    if (!pedidoToUpdate) {
      throw new Error('Pedido não encontrado');
    }

    // Criamos um objeto com todos os dados necessários para a atualização
    const updatedData = {
      ...pedidoToUpdate,
      status: OrderStatus.Canceled,
      state: OrderStatus.Canceled
    };

    // Fazemos o PUT com todos os dados necessários
    await axios.put(`http://localhost:5188/Order/${pedidoId}`, updatedData, axiosConfig);

    // Atualizamos o estado local
    const updatedPedidos = pedidos.map((pedido) =>
      pedido.id === pedidoId 
        ? { ...pedido, status: OrderStatus.Canceled, state: OrderStatus.Canceled }
        : pedido
    );

    setPedidos(updatedPedidos);
    setFilteredPedidos(updatedPedidos);
    setConfirmDelete(null); // Fecha o modal de confirmação
    setSuccessMessage('Pedido cancelado com sucesso!');
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  } catch (error) {
    console.error('Erro ao cancelar o pedido:', error);
    setError('Erro ao cancelar o pedido');
    
    setTimeout(() => {
      setError('');
    }, 3000);
  }
};


  const renderStateSelect = (editingPedido, newPedido, handleInputChange, handleNewInputChange, fieldErrors) => {
  if (!editingPedido) {
    // Para novo pedido, apenas mostrar o status fixo
    return (
      <label>
        Estado
        <input
          type="text"
          value="Aguardando envio"
          disabled
          className="bg-gray-100 p-2 rounded"
        />
      </label>
    );
  }

  // Para edição, mostrar select com opções
  return (
    <label>
      Estado
      <select
        value={editingPedido.state}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          handleInputChange('state', value);
        }}
        className="p-2 border rounded"
      >
        {Object.entries(OrderStatusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {fieldErrors.state && <span className="text-red-500 text-sm">{fieldErrors.state}</span>}
    </label>
  );
};

  const calculateTotalValue = (items, discount) => {
    const total = items.reduce((total, item) => total + (item.quantity * item.itemValue), 0);
    return total - (total * (discount / 100)); 
  };

  const handleSort = (field) => {
  setSortField(field);
  setSortAscending(!sortAscending); 

  const sortedPedidos = [...pedidos].sort((a, b) => {
    if (a[field] < b[field]) {
      return sortAscending ? -1 : 1;
    }
    if (a[field] > b[field]) {
      return sortAscending ? 1 : -1;
    }
    return 0;
  });

  setPedidos(sortedPedidos);
};

  const handleInputChange = (field, value) => {
    setEditingPedido(prev => {
      const updatedPedido = { ...prev, [field]: value };
      return {
        ...updatedPedido,
        totalValue: calculateTotalValue(updatedPedido.items, updatedPedido.discount) 
      };
    });
  };

  const handleNewInputChange = (field, value) => {
    setNewPedido(prev => {
      const updatedPedido = { ...prev, [field]: value };
      return {
        ...updatedPedido,
        totalValue: calculateTotalValue(updatedPedido.items, updatedPedido.discount) 
      };
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = editingPedido ? [...editingPedido.items] : [...newPedido.items];
    
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'fkProductId') {
      const selectedProduct = products.find(product => product.id === value);
      if (selectedProduct) {
        updatedItems[index].itemValue = selectedProduct.value;
      }
    }
    
    const newTotalValue = calculateTotalValue(updatedItems, editingPedido ? editingPedido.discount : newPedido.discount);
    if (editingPedido) {
      setEditingPedido(prev => ({ ...prev, items: updatedItems, totalValue: newTotalValue }));
    } else {
      setNewPedido(prev => ({ ...prev, items: updatedItems, totalValue: newTotalValue }));
    }
  };

  const addItem = () => {
    if (editingPedido) {
      setEditingPedido(prev => {
        const newItems = [...prev.items, { fkProductId: '', quantity: 1, itemValue: 0 }];
        return { ...prev, items: newItems, totalValue: calculateTotalValue(newItems, prev.discount) };
      });
    } else {
      setNewPedido(prev => {
        const newItems = [...prev.items, { fkProductId: '', quantity: 1, itemValue: 0 }];
        return { ...prev, items: newItems, totalValue: calculateTotalValue(newItems, prev.discount) };
      });
    }
  };

  const removeItem = (index) => {
    if (editingPedido) {
      const updatedItems = editingPedido.items.filter((_, i) => i !== index);
      setEditingPedido(prev => ({ ...prev, items: updatedItems, totalValue: calculateTotalValue(updatedItems, prev.discount) }));
    } else {
      const updatedItems = newPedido.items.filter((_, i) => i !== index);
      setNewPedido(prev => ({ ...prev, items: updatedItems, totalValue: calculateTotalValue(updatedItems, prev.discount) }));
    }
  };

  const handleSave = async (pedidoId) => {
  try {
    setFieldErrors({});

    const errors = {};
    if (!editingPedido.description) errors.description = 'Descrição é obrigatória';
    if (!editingPedido.fkClientId) errors.fkClientId = 'Cliente é obrigatório';
    if (!editingPedido.shippingDate) errors.shippingDate = 'Data de envio é obrigatória';
    if (!editingPedido.expectedDeliveryDate) errors.expectedDeliveryDate = 'Data de entrega prevista é obrigatória';
    if (editingPedido.expectedDeliveryDate < editingPedido.shippingDate) errors.expectedDeliveryDate = 'Data de entrega prevista não pode ser menor que a data de envio';
    if (!editingPedido.state) errors.state = 'Estado é obrigatório';
    if (editingPedido.nInstallments < 1 || editingPedido.nInstallments > 36) errors.nInstallments = 'Número de parcelas deve estar entre 1 e 36';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const formattedPedido = {
      ...editingPedido,
      shippingDate: formatDate(editingPedido.shippingDate),
      expectedDeliveryDate: formatDate(editingPedido.expectedDeliveryDate)
    };

    await axios.put(`http://localhost:5188/Order/${pedidoId}`, formattedPedido, axiosConfig);
    const response = await axios.get('http://localhost:5188/Order', axiosConfig);
    setPedidos(response.data);
    setEditingPedido(null);
    setShowForm(true);
    setSuccessMessage('Pedido salvo com sucesso!');
  } catch (err) {
    setError('Erro ao salvar pedido');
  }setShowForm(false);
};

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5188/Order/${id}`, axiosConfig);
      setPedidos(prev => prev.filter(pedido => pedido.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError('Erro ao excluir pedido');
    }
  };

  const handleDeliveryComplete = async (pedidoId) => {
  try {
    const pedidoToUpdate = pedidos.find(p => p.id === pedidoId);
    
    if (!pedidoToUpdate) {
      throw new Error('Pedido não encontrado');
    }

    // Criar objeto atualizado com status de entregue
    const updatedData = {
      ...pedidoToUpdate,
      status: OrderStatus.Delivered,
      state: OrderStatus.Delivered
    };

    // Fazer o PUT com os dados atualizados
    await axios.put(`http://localhost:5188/Order/${pedidoId}`, updatedData, axiosConfig);

    // Atualizar o estado local
    const updatedPedidos = pedidos.map((pedido) =>
      pedido.id === pedidoId 
        ? { ...pedido, status: OrderStatus.Delivered, state: OrderStatus.Delivered }
        : pedido
    );

    setPedidos(updatedPedidos);
    setFilteredPedidos(updatedPedidos);
    setSuccessMessage('Pedido marcado como entregue com sucesso!');
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  } catch (error) {
    console.error('Erro ao atualizar o status do pedido:', error);
    setError('Erro ao marcar pedido como entregue');
    
    setTimeout(() => {
      setError('');
    }, 3000);
  }
};

  const handleEdit = (pedido) => {
    const itemsForEditingPedido = filterItemsOrdemByPedido(pedido.id);
    setEditingPedido({ ...pedido, items: itemsForEditingPedido });
    setShowForm(true);
  };

  const ShippingDateField = ({ editingPedido, newPedido, handleInputChange, fieldErrors }) => {
  if (!editingPedido) {
    return null; // Não mostra o campo para novos pedidos
  }

  return (
    <label>
      Data de Envio
      <input
        type="date"
        min={new Date().toISOString().split("T")[0]}
        value={formatDate(editingPedido.shippingDate)}
        onChange={(e) => handleInputChange('shippingDate', e.target.value)}
        disabled={editingPedido.state === OrderStatus.Pending}
      />
      {fieldErrors.shippingDate && <span className="text-red-500 text-sm">{fieldErrors.shippingDate}</span>}
    </label>
  );
};

  const handleCreate = async () => {
  try {
    setFieldErrors({});
    const errors = {};
    if (!newPedido.description) errors.description = 'Descrição é obrigatória';
    if (!newPedido.fkClientId) errors.fkClientId = 'Cliente é obrigatório';
    if (!newPedido.expectedDeliveryDate) errors.expectedDeliveryDate = 'Data de entrega prevista é obrigatória';
    if (newPedido.nInstallments < 1 || newPedido.nInstallments > 36) errors.nInstallments = 'Número de parcelas deve estar entre 1 e 36';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const formattedPedido = {
      ...newPedido,
      state: OrderStatus.Pending, // Força o status inicial
      shippingDate: null, // Inicialmente null
      expectedDeliveryDate: formatDate(newPedido.expectedDeliveryDate)
    };

    const response = await axios.post('http://localhost:5188/Order', formattedPedido, axiosConfig);
    const createdPedido = response.data;

    for (const item of newPedido.items) {
      await axios.post('http://localhost:5188/ItemOrder', {
        ...item,
        fkOrderId: createdPedido.id
      }, axiosConfig);
    }

    const pedidosResponse = await axios.get('http://localhost:5188/Order', axiosConfig);
    const itemsResponse = await axios.get('http://localhost:5188/ItemOrder', axiosConfig);
    setPedidos(pedidosResponse.data);
    setItemsOrdem(itemsResponse.data);
    setFilteredPedidos(pedidosResponse.data);
    
    setNewPedido({
      description: '',
      totalValue: 0,
      discount: 0,
      shippingDate: null,
      expectedDeliveryDate: '',
      state: OrderStatus.Pending,
      nInstallments: '',
      fkUserId: '',
      fkClientId: '',
      items: []
    });
    
    setShowForm(false);
    setSuccessMessage('Pedido criado com sucesso!');
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  } catch (err) {
    setError('Erro ao criar pedido');
  }
};

  const getUserNameById = (userId) => {
    const user = users.find(user => user.id === userId);
    return user ? user.username : 'Desconhecido';
  };

  const getClientNameById = (clientId) => {
    const client = clients.find(client => client.id === clientId);
    return client ? client.name : 'Desconhecido';
  };

  const getProductDetails = (productId) => {
    const product = products.find(product => product.id === productId);
    return product ? `${product.name} - ${product.value}` : 'Desconhecido';
  };

  const filterItemsOrdemByPedido = (pedidoId) => {
    return itemsOrdem.filter(item => item.fkOrderId === pedidoId);
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

   return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pedidos</h1>
        <button onClick={() => window.location.href = 'https://slime-goose-9d2.notion.site/PEDIDOS-12df55e7219b805bb807c77ae3ba10f1'} 
          className={styles.helpButton}>
          <span>?</span>
        </button>
        <button className={styles.createButton} onClick={() => setShowForm(true)}>Criar Pedido</button>
      </div>

      {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

      <div className={styles.filtersSection}>
        <h3>Filtros</h3>
        <div className={styles.filtersGrid}>
          <div className={styles.filterItem}>
            <input
              type="text"
              placeholder="Filtrar por descrição"
              value={filters.description}
              onChange={(e) => handleFilterChange('description', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterItem}>
  <select
    value={filters.state} // Mudado para 'state'
    onChange={(e) => handleFilterChange('state', e.target.value)}
    className={styles.filterSelect}
  >
    <option value="">Todos os estados</option>
    {Object.entries(OrderStatusLabels).map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </select>
</div>

          <div className={styles.filterItem}>
            <select
              value={filters.clientId}
              onChange={(e) => handleFilterChange('clientId', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos os clientes</option>
              {getSortedClients().map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <input
              type="number"
              placeholder="Valor mínimo"
              value={filters.minValue}
              onChange={(e) => handleFilterChange('minValue', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterItem}>
            <input
              type="number"
              placeholder="Valor máximo"
              value={filters.maxValue}
              onChange={(e) => handleFilterChange('maxValue', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterItem}>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterItem}>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className={styles.filterInput}
            />
          </div>

          <button onClick={clearFilters} className={styles.clearFiltersButton}>
            Limpar Filtros
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingPedido ? 'Editar Pedido' : 'Criar Pedido'}</h2>
              <button className={styles.closeButton} onClick={() => { setShowForm(false); setEditingPedido(null); }}>×</button>
            </div>

            <div className={styles.form}>
              <label>
                Cliente
                <select
                  value={editingPedido ? editingPedido.fkClientId : newPedido.fkClientId}
                  onChange={(e) => (editingPedido ? handleInputChange('fkClientId', e.target.value) : handleNewInputChange('fkClientId', e.target.value))}
                >
                  <option value="">Selecione um Cliente</option>
                  {getSortedClients().map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                {fieldErrors.fkClientId && <span className={styles.error}>{fieldErrors.fkClientId}</span>}
              </label>
              <h3>Itens do Pedido</h3>
              {editingPedido ? (
                editingPedido.items.map((item, index) => (
                  <div key={index} className={styles.itemRow}>
                    <select
                      value={item.fkProductId}
                      onChange={(e) => handleItemChange(index, 'fkProductId', e.target.value)}
                    >
                      <option value="">Selecione um Produto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{getProductDetails(product.id)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    />
                    <span>{item.itemValue}</span>
                    <button className={styles.removeItemButton} onClick={() => removeItem(index)}>Remover</button>
                  </div>
                ))
              ) : (
                newPedido.items.map((item, index) => (
                  <div key={index} className={styles.itemRow}>
                    <select
                      value={item.fkProductId}
                      onChange={(e) => handleItemChange(index, 'fkProductId', e.target.value)}
                    >
                      <option value="">Selecione um Produto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{getProductDetails(product.id)}</option>
                      ))}
                    </select>
                    <span>Quantidade:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    />
                    <span>  Valor: {item.itemValue}    </span>
                    <button className={styles.removeItemButton} onClick={() => removeItem(index)}>Remover</button>
                  </div>
                ))
              )}
              <button className={styles.addItemButton} onClick={addItem}>Adicionar Item</button>

               <label>
  Desconto (%)
  <input
    type="number"
    placeholder="Desconto (%)"
    value={editingPedido ? editingPedido.discount : newPedido.discount}
    onChange={(e) => {
      const value = e.target.value;

      // Permitir apenas números entre 0 e 100
      if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
        editingPedido ? handleInputChange('discount', value) : handleNewInputChange('discount', value);
      }
    }}
    onBlur={(e) => {
      let finalValue = Number(e.target.value);
      if (finalValue < 0) finalValue = 0;
      if (finalValue > 100) finalValue = 100;

      editingPedido ? handleInputChange('discount', finalValue) : handleNewInputChange('discount', finalValue);
    }}
  />
</label>

<h3>Total: {editingPedido ? calculateTotalValue(editingPedido.items, editingPedido.discount) : calculateTotalValue(newPedido.items, newPedido.discount)}</h3>

              
<ShippingDateField 
  editingPedido={editingPedido}
  newPedido={newPedido}
  handleInputChange={handleInputChange}
  fieldErrors={fieldErrors}
/>

<label>
  Data de Entrega Prevista
  <input
    type="date"
    min={editingPedido ? editingPedido.shippingDate : newPedido.shippingDate}  // Define a data mínima como a data de envio
    value={editingPedido ? formatDate(editingPedido.expectedDeliveryDate) : newPedido.expectedDeliveryDate}
    onChange={(e) => {
      const newDate = e.target.value;
      const shippingDate = editingPedido ? editingPedido.shippingDate : newPedido.shippingDate;
      
      // Verifica se a data de entrega prevista é maior ou igual à data de envio
      if (newDate >= shippingDate) {
        if (editingPedido) {
          handleInputChange('expectedDeliveryDate', newDate);
        } else {
          handleNewInputChange('expectedDeliveryDate', newDate);
        }
      } else {
        alert('A data de entrega prevista não pode ser menor que a data de envio.');
      }
    }}
  />
  {fieldErrors.expectedDeliveryDate && <span className={styles.error}>{fieldErrors.expectedDeliveryDate}</span>}
</label>
{renderStateSelect()}
             
<label>
  Nº de Parcelas
  <input
    type="text"
    placeholder="Número de Parcelas"
    value={editingPedido ? editingPedido.nInstallments : newPedido.nInstallments}
    onChange={(e) => {
      const value = e.target.value;

      // Verifica se o valor é um número entre 1 e 36
      if (/^\d*$/.test(value)) {
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue) && parsedValue <= 36 && parsedValue >= 1) {
          if (editingPedido) {
            handleInputChange('nInstallments', value);
          } else {
            handleNewInputChange('nInstallments', value);
          }
        } else if (value === '') {
          if (editingPedido) {
            handleInputChange('nInstallments', value);
          } else {
            handleNewInputChange('nInstallments', value);
          }
        }
      }
    }}
  />
</label>

              
<label>
  Descrição
  <input
    type="text"
    placeholder="Descrição"
    value={editingPedido ? editingPedido.description : newPedido.description}
    onChange={(e) => (editingPedido ? handleInputChange('description', e.target.value) : handleNewInputChange('description', e.target.value))}
  />
  {fieldErrors.description && <span className={styles.error}>{fieldErrors.description}</span>}
</label>
              <button className={styles.saveButton} onClick={editingPedido ? () => handleSave(editingPedido.id) : handleCreate}>
                {editingPedido ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.paginationControls}>
        <div className={styles.itemsPerPageControl}>
          <label>
            Itens por página:
            <select 
              value={itemsPerPage} 
              onChange={handleItemsPerPageChange}
              className={styles.itemsPerPageSelect}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className={styles.pageNavigation}>
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Anterior
          </button>
          <span className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Próxima
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Data de Envio</th>
              <th>Data de Entrega Prevista</th>
              <th>Estado</th>
              <th>Parcelas</th>
              <th>Cliente</th>
              <th align="right">
                <button onClick={() => handleSort('totalValue')}>
                  Total {'(R$)'} {sortField === 'description' && (sortAscending ? '⬆️' : '⬇️')}
                </button>
              </th>
              <th>Itens do pedido</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(pedido => (
              <tr key={pedido.id}>
                <td >{pedido.description}</td>
                <td>{new Date(pedido.shippingDate).toLocaleDateString('pt-BR')}</td>
                <td>{new Date(pedido.expectedDeliveryDate).toLocaleDateString('pt-BR')}</td>
                <td>{getStateLabel(pedido.status)}</td>
                <td>{pedido.nInstallments}</td>
                <td>{getClientNameById(pedido.fkClientId)}</td>
                <td align="right">{pedido.totalValue}</td>
                <td>
                  {filterItemsOrdemByPedido(pedido.id).map((item) => (
                    <div key={item.id}>
                      {getProductDetails(item.fkProductId)} (Quantidade: {item.quantity}, Preço: {item.itemValue})
                    </div>
                  ))}
                </td>
                <td>
  <button className={styles.editButton} onClick={() => handleEdit(pedido)}>
    Editar
  </button>
  {pedido.status !== OrderStatus.Canceled && pedido.status !== OrderStatus.Delivered && (
  <button 
    className={`${styles.deleteButton} ${styles.cancelButton}`} 
    onClick={() => setConfirmDelete(pedido.id)}
  >
    Cancelar
  </button>
)}

  {pedido.status === OrderStatus.Pending && (
    <button 
      className={styles.shippingButton}
      onClick={() => handleShippingDate(pedido.id)}
    >
      Realizar envio
    </button>
  )}
  {pedido.status === OrderStatus.InProgress && (
    <button 
      className={styles.deliveryButton}
      onClick={() => handleDeliveryComplete(pedido.id)}
    >
      Marcar como entregue
    </button>
  )}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>



      {confirmDelete && (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      <h3>Confirmação de Cancelamento</h3>
      <p>Tem certeza que deseja cancelar este pedido?</p>
      <p>Esta ação não poderá ser desfeita.</p>
      <div className={styles.modalButtons}>
        <button 
          className={styles.confirmButton}
          onClick={() => handleCancelOrder(confirmDelete)}
        >
          Sim, cancelar pedido
        </button>
        <button 
          className={styles.cancelButton}
          onClick={() => setConfirmDelete(null)}
        >
          Não, manter pedido
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Pedidos;
