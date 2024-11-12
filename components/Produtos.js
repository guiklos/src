import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import styles from '../Styles/Products.module.css';

// Configuração do Modal para trabalhar com a aplicação
Modal.setAppElement('#root');

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
  name: '',
  productType: '',  // mantenha como string vazia
  description: '',
  value: '',
  thickness: '',
  width: '',
  length: '',
});
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [validationError, setValidationError] = useState('');

  const token = localStorage.getItem('token');

  const [filters, setFilters] = useState({
    search: '',
    productType: '', // Adicione esta linha
    minValue: '',
    maxValue: '',
    minThickness: '',
    maxThickness: '',
    minWidth: '',
    maxWidth: '',
    minLength: '',
    maxLength: '',
  });

  // Definir o cabeçalho Authorization
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`, // Adicionar o token JWT
    },
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5188/Product', axiosConfig);
        setProducts(response.data);
      } catch (err) {
        setError('Erro ao carregar os produtos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = [...products];

    // Filtro por texto (nome ou descrição)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

     // Filtro por tipo de produto
   if (filters.productType !== '') {
      result = result.filter(product => 
        product.productType === Number(filters.productType)
      );
    }

    // Filtro por valor
    if (filters.minValue) {
      result = result.filter(product => product.value >= Number(filters.minValue));
    }
    if (filters.maxValue) {
      result = result.filter(product => product.value <= Number(filters.maxValue));
    }

    // Filtro por espessura
    if (filters.minThickness) {
      result = result.filter(product => product.thickness >= Number(filters.minThickness));
    }
    if (filters.maxThickness) {
      result = result.filter(product => product.thickness <= Number(filters.maxThickness));
    }

    // Filtro por largura
    if (filters.minWidth) {
      result = result.filter(product => product.width >= Number(filters.minWidth));
    }
    if (filters.maxWidth) {
      result = result.filter(product => product.width <= Number(filters.maxWidth));
    }

    // Filtro por comprimento
    if (filters.minLength) {
      result = result.filter(product => product.length >= Number(filters.minLength));
    }
    if (filters.maxLength) {
      result = result.filter(product => product.length <= Number(filters.maxLength));
    }

    setFilteredProducts(result);
  }, [filters, products]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      productType: '', // Adicione esta linha
      minValue: '',
      maxValue: '',
      minThickness: '',
      maxThickness: '',
      minWidth: '',
      maxWidth: '',
      minLength: '',
      maxLength: '',
    });
  };

  const PRODUCT_TYPES = {
  0: 'Padrão',
  1: 'Pintado',
  2: 'Naval',
  3: 'Plastificado',
  4: 'Virolinha',
  5: 'Flexível',
  
};


  const handleInputChange = (field, value) => {
    if (isEditMode && editingProduct) {
      // Para o campo productType, converta para número
      if (field === 'productType') {
        setEditingProduct(prevProduct => ({
          ...prevProduct,
          [field]: value === '' ? '' : Number(value)
        }));
      } else {
        setEditingProduct(prevProduct => ({
          ...prevProduct,
          [field]: value
        }));
      }
    } else {
      if (field === 'productType') {
        setNewProduct(prevProduct => ({
          ...prevProduct,
          [field]: value === '' ? '' : Number(value)
        }));
      } else {
        setNewProduct(prevProduct => ({
          ...prevProduct,
          [field]: value
        }));
      }
    }
  };

  

  const validateFields = (product) => {
    if (product.value < 1 || product.thickness < 1 || product.width < 1 || product.length < 1) {
      setValidationError('Os valores devem ser maiores ou iguais a 1');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleCreate = async () => {
  if (!validateFields(newProduct)) return;

  try {
    const newProductData = {
      ...newProduct,
      productType: parseInt(newProduct.productType), // Use parseInt ao invés de Number
      value: Number(newProduct.value),
      thickness: Number(newProduct.thickness),
      width: Number(newProduct.width),
      length: Number(newProduct.length),
    };

    await axios.post('http://localhost:5188/Product', newProductData, axiosConfig);
      setNewProduct({
        name: '',
        productType: '',
        description: '',
        value: '',
        thickness: '',
        width: '',
        length: '',
      });
      const response = await axios.get('http://localhost:5188/Product', axiosConfig);
      setProducts(response.data);
      setIsEditMode(false);
    } catch (err) {
      setError('Erro ao criar produto');
    }
  };

  const handleUpdate = async () => {
    if (!validateFields(editingProduct)) return;

    try {
      const updatedProduct = {
        ...editingProduct,
        productType: Number(editingProduct.productType),
        value: Number(editingProduct.value),
        thickness: Number(editingProduct.thickness),
        width: Number(editingProduct.width),
        length: Number(editingProduct.length),
      };

      await axios.put(
        `http://localhost:5188/Product/${editingProduct.id}`, 
        updatedProduct, 
        axiosConfig
      );
      
      setEditingProduct(null);
      setIsEditMode(false);
      const response = await axios.get('http://localhost:5188/Product', axiosConfig);
      setProducts(response.data);
    } catch (err) {
      setError('Erro ao atualizar produto');
    }
  };


  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5188/Product/${confirmDeleteProduct}`, axiosConfig);
      setProducts(prevProducts => prevProducts.filter(product => product.id !== confirmDeleteProduct));
      setConfirmDeleteProduct(null);
    } catch (err) {
      setError('Erro ao deletar produto');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsEditMode(true);
  };

  const closeModal = () => {
    setIsEditMode(false);
    setEditingProduct(null);
  };

  const openDeleteConfirmModal = (productId) => {
    setConfirmDeleteProduct(productId);
  };

  const closeDeleteConfirmModal = () => {
    setConfirmDeleteProduct(null);
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
     <div className={styles.container}>
      <div className={styles.header}>
        <h1>Produtos</h1>
      </div>

      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
   <label>Tipo de Produto</label>
      <select
        value={filters.productType}
        onChange={(e) => handleFilterChange('productType', e.target.value)}
        className={styles.select}
      >
        <option value="">Todos</option>
        <option value="0">Padrão</option>
        <option value="1">Pintado</option>
        <option value="2">Naval</option>
        <option value="3">Plastificado</option>
        <option value="4">Virolinha</option>
        <option value="5">Flexível</option>
      </select>
</div>

        <div className={styles.advancedFilters}>
          <div className={styles.filterGroup}>
            <label>Valor (R$)</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minValue}
                onChange={(e) => handleFilterChange('minValue', e.target.value)}
                className={styles.rangeInput}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxValue}
                onChange={(e) => handleFilterChange('maxValue', e.target.value)}
                className={styles.rangeInput}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Espessura (mm)</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minThickness}
                onChange={(e) => handleFilterChange('minThickness', e.target.value)}
                className={styles.rangeInput}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxThickness}
                onChange={(e) => handleFilterChange('maxThickness', e.target.value)}
                className={styles.rangeInput}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Largura (m)</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minWidth}
                onChange={(e) => handleFilterChange('minWidth', e.target.value)}
                className={styles.rangeInput}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxWidth}
                onChange={(e) => handleFilterChange('maxWidth', e.target.value)}
                className={styles.rangeInput}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Comprimento (m)</label>
            <div className={styles.rangeInputs}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minLength}
                onChange={(e) => handleFilterChange('minLength', e.target.value)}
                className={styles.rangeInput}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxLength}
                onChange={(e) => handleFilterChange('maxLength', e.target.value)}
                className={styles.rangeInput}
              />
            </div>
          </div>

          <button onClick={clearFilters} className={styles.clearFiltersButton}>
            Limpar Filtros
          </button>
        </div>
      </div>


      <div>
        <button 
          onClick={() => window.location.href = 'https://slime-goose-9d2.notion.site/PRODUTO-128f55e7219b8076880af71edee86ca5'} 
          style={{
            padding: '10px 20px',
            width: '10px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: '2px solid #4CAF50',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s, color 0.3s',
            display: 'inline-block',
          }}>
          <span style={styles.icon}>?</span>
        </button>
      </div>
      <div className={styles.formContainer}>
        <button onClick={() => setIsEditMode(true)} className={styles.createButton}>
          Adicionar Novo Produto
        </button>
        <Modal
          isOpen={isEditMode || !!editingProduct}
          onRequestClose={closeModal}
          contentLabel={editingProduct ? 'Editar Produto' : 'Criar Produto'}
          className={styles.modal}
          overlayClassName={styles.overlay}
        >
          <h2>{editingProduct ? 'Editar Produto' : 'Criar Produto'}</h2>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              type="text"
              value={editingProduct ? editingProduct.name : newProduct.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          
          <div className={styles.formGroup}>
  <label htmlFor="productType">Tipo de Produto</label>
  <select
    id="productType"
    value={editingProduct ? editingProduct.productType : newProduct.productType}
    onChange={(e) => handleInputChange('productType', e.target.value)}
    className={styles.select}
  >
    <option value="">Selecione um tipo</option>
    <option value="0">Padrão</option>
    <option value="1">Pintado</option>
    <option value="2">Naval</option>
    <option value="3">Plastificado</option>
    <option value="4">Virolinha</option>
    <option value="5">Flexível</option>

  </select>
</div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição</label>
            <input
              id="description"
              type="text"
              value={editingProduct ? editingProduct.description : newProduct.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="value">Valor (R$)</label>
            <input
              id="value"
              type="number"
              value={editingProduct ? editingProduct.value : newProduct.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="thickness">Espessura (mm)</label>
            <div className={styles.inputWithUnit}>
              <input
                id="thickness"
                type="number"
                value={editingProduct ? editingProduct.thickness : newProduct.thickness}
                onChange={(e) => handleInputChange('thickness', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="width">Largura (m)</label>
            <div className={styles.inputWithUnit}>
              <input
                id="width"
                type="number"
                value={editingProduct ? editingProduct.width : newProduct.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="length">Comprimento (m)</label>
            <div className={styles.inputWithUnit}>
              <input
                id="length"
                type="number"
                value={editingProduct ? editingProduct.length : newProduct.length}
                onChange={(e) => handleInputChange('length', e.target.value)}
              />
            </div>
          </div>

          {validationError && <p className={styles.validationError}>{validationError}</p>}
          
          <div className={styles.buttonGroup}>
            <button className={styles.submitButton} onClick={editingProduct ? handleUpdate : handleCreate}>
              {editingProduct ? 'Salvar' : 'Criar'}
            </button>
            <button className={styles.submitButton} onClick={closeModal}>Cancelar</button>
          </div>
        </Modal>
        <Modal
          isOpen={!!confirmDeleteProduct}
          onRequestClose={closeDeleteConfirmModal}
          contentLabel="Confirmar Exclusão"
          className={styles.modal}
          overlayClassName={styles.overlay}
        >
          <h2>Confirmar Exclusão</h2>
          <p>Você tem certeza que deseja excluir este produto?</p>
          <button className={styles.submitButton} onClick={handleDelete}>Confirmar</button>
          <button className={styles.submitButton} onClick={closeDeleteConfirmModal}>Cancelar</button>
        </Modal>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Valor (R$)</th>
              <th>Espessura (mm)</th>
              <th>Largura (m)</th>
              <th>Comprimento (m)</th>
              <th>Criado em:</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{PRODUCT_TYPES[product.productType]}</td>
                <td>{product.description}</td>
                <td>{product.value}</td>
                <td>{product.thickness} </td>
                <td>{product.width}</td>
                <td>{product.length}</td>
                <td>{new Date(product.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <button className={styles.editButton} onClick={() => openEditModal(product)}>
                    Editar
                  </button>
                  <button className={styles.deleteButton} onClick={() => openDeleteConfirmModal(product.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Produtos;
