import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from '../Styles/Relatorios.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ArcElement, Tooltip, Legend);

const Relatorios = () => {
  const getDefaultDates = () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const previousMonthDate = new Date(today);
    previousMonthDate.setMonth(today.getMonth() - 1);
    const startDate = previousMonthDate.toISOString().split('T')[0];
    return { startDate, endDate };
  };

  const { startDate: defaultStartDate, endDate: defaultEndDate } = getDefaultDates();

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [status, setStatus] = useState('');
  const [reportType, setReportType] = useState('Pedidos');
  const [clientId, setClientId] = useState('');
  const [productType, setProductType] = useState('');
  const [reportData, setReportData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('Usuário');
  const [showTooltip, setShowTooltip] = useState(false);

  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get('http://localhost:5188/User/me', axiosConfig);
        if (response.data && response.data.username) {
          setUsername(response.data.username);
        }
      } catch (error) {
        console.error('Erro ao obter as informações do usuário:', error);
      }
    };

    fetchUserInfo();
  }, [token]);

  useEffect(() => {
    setReportData(null);
    setError('');
    setStatus('');
    setClientId('');
    setProductType('');
  }, [reportType]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('http://localhost:5188/Client', axiosConfig);
        setClients(response.data);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };

    fetchClients();
  }, []);

  const handleGenerateReport = async () => {
    // Validate parameters based on report type
    if (
      (reportType === 'Pedidos' && (!startDate || !endDate)) ||
      (reportType === 'Faturamento' && (!startDate || !endDate)) ||
      (reportType === 'Produtos' && (!startDate || !endDate))
    ) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000); // Hide tooltip after 3 seconds
      return;
    }
  
    setShowTooltip(false);
    setLoading(true);
    setError('');
    try {
      let response;
      let params = {};
  
      // Add dates only for specific report types
      if (reportType !== 'TodosProdutos') {
        params.startDate = startDate ? new Date(startDate).toISOString() : '';
        params.endDate = endDate ? new Date(endDate).toISOString() : '';
      }
  
      // Add productType for "TodosProdutos" and "Produtos" report types
      if (reportType === 'TodosProdutos' || reportType === 'Produtos') {
        if (productType) params.productType = productType;
      }
  
      switch (reportType) {
        case 'Pedidos':
          if (status) params.status = status;
          response = await axios.get('http://localhost:5188/Order/report', {
            params,
            ...axiosConfig,
          });
          break;
        case 'Faturamento':
          if (clientId) params.clientId = clientId;
          response = await axios.get('http://localhost:5188/Order/billing-report', {
            params,
            ...axiosConfig,
          });
          break;
        case 'Produtos':
          response = await axios.get('http://localhost:5188/Order/top-sold-products', {
            params,
            ...axiosConfig,
          });
          break;
        case 'TodosProdutos':
          response = await axios.get('http://localhost:5188/Product/products-report', {
            params,
            ...axiosConfig,
          });
          break;
        default:
          break;
      }
  
      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao gerar o relatório:', error.response || error.message || error);
      setError('Erro ao gerar o relatório.');
    } finally {
      setLoading(false);
    }
  };
  

  const generatePDF = () => {
    if (!reportData || reportData.length === 0) {
      setError('Não há dados para gerar o relatório em PDF.');
      return;
    }

    const doc = new jsPDF();

    const formatDateToBrazilian = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    const formatCurrencyToBrazilian = (value) => value.toFixed(2).replace('.', ',');

    const translateOrderStatus = (status) => {
      const translations = {
        Pending: 'Pendente',
        InProgress: 'Em Progresso',
        Delivered: 'Entregue',
        Canceled: 'Cancelado',
      };
      return translations[status] || status;
    };

    const generateFileName = () => {
      let fileName = `relatorio_${reportType.toLowerCase()}`;
      if (startDate && endDate) {
        fileName += `_${formatDateToBrazilian(startDate)}_${formatDateToBrazilian(endDate)}`;
      }
      if (status) fileName += `_${status.toLowerCase()}`;
      if (productType) fileName += `_${productType.toLowerCase()}`;
      return `${fileName}.pdf`;
    };

    doc.setFontSize(16);
    doc.text(`Relatório de ${reportType}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Empresa: L.C. Penteado Compensados`, 10, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, 37);

    if (reportType !== 'TodosProdutos') {
      doc.text(
        `Período: ${formatDateToBrazilian(startDate)} - ${formatDateToBrazilian(endDate)}`,
        10,
        44
      );
    }

    if (reportType === 'Pedidos') {
      doc.text(`Status: ${status ? translateOrderStatus(status) : 'todos'}`, 10, 51);
    } else if (reportType === 'Faturamento') {
      doc.text(`Cliente: ${clientId ? clientId : 'todos'}`, 10, 51);
    } else if (reportType === 'Produtos' || reportType === 'TodosProdutos') {
      doc.text(`Tipo: ${productType || 'todos'}`, 10, 51);
    }

    doc.line(10, 55, 200, 55);

    let tableColumn = [];
    let tableRows = [];

    if (reportType === 'Pedidos') {
      tableColumn = ['Cliente', 'Data do Pedido', 'Status', 'Valor Total'];
      reportData.forEach((order) => {
        const orderData = [
          order.clientName,
          formatDateToBrazilian(order.orderDate),
          translateOrderStatus(order.status),
          { content: formatCurrencyToBrazilian(order.totalValue), styles: { halign: 'right' } },
        ];
        tableRows.push(orderData);
      });
    } else if (reportType === 'Faturamento') {
      tableColumn = ['Cliente', 'Total de Pedidos', 'Valor Total', 'Valor Médio'];
      reportData.forEach((billing) => {
        const billingData = [
          billing.clientName,
          billing.totalOrders,
          { content: formatCurrencyToBrazilian(billing.totalOrderValue || 0), styles: { halign: 'right' } },
          { content: formatCurrencyToBrazilian(billing.averageOrderValue || 0), styles: { halign: 'right' } },
        ];
        tableRows.push(billingData);
      });
    } else if (reportType === 'Produtos') {
      tableColumn = ['Produto', 'Categoria', 'Quantidade Vendida', 'Valor Total', 'Valor Médio'];
      reportData.forEach((product) => {
        const productData = [
          product.productName,
          product.productType,
          product.quantitySold,
          { content: formatCurrencyToBrazilian(product.totalSalesValue || 0), styles: { halign: 'right' } },
          { content: formatCurrencyToBrazilian(product.averageSalesValue || 0), styles: { halign: 'right' } },
        ];
        tableRows.push(productData);
      });
    } else if (reportType === 'TodosProdutos') {
      tableColumn = ['Nome', 'Descrição', 'Tipo', 'Espessura (mm)', 'Largura (m)', 'Comprimento (m)', 'Valor (R$)'];
      reportData.forEach((product) => {
        const productData = [
          product.name,
          product.description,
          product.productType,
          { content: product.thickness?.toFixed(2), styles: { halign: 'right' } },
          { content: product.width?.toFixed(2), styles: { halign: 'right' } },
          { content: product.length?.toFixed(2), styles: { halign: 'right' } },
          { content: formatCurrencyToBrazilian(product.value), styles: { halign: 'right' } },
        ];
        tableRows.push(productData);
      });
    }

    doc.autoTable({
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10, textColor: [0, 0, 0], fillColor: [255, 255, 255], halign: 'left' },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text(`${pageCount}`, pageWidth - 10, 10, { align: 'right' });
      },
    });

    const fileName = generateFileName();
    doc.save(fileName);
  };

  const renderChart = () => {
    if (!reportData || reportData.length === 0 || reportType === 'TodosProdutos') {
      return null;
    }

    if (reportType === 'Pedidos') {
      const labels = reportData.map((order) => order.clientName);
      const totalValues = reportData.map((order) => order.totalValue);
      return (
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'Valor Total por Cliente',
                data: totalValues,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          }}
        />
      );
    } else if (reportType === 'Faturamento') {
      const labels = reportData.map((billing) => billing.clientName);
      const totalOrderValues = reportData.map((billing) => billing.totalOrderValue || 0);
      return (
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'Faturamento Total por Cliente',
                data: totalOrderValues,
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
              },
            ],
          }}
        />
      );
    } else if (reportType === 'Produtos' || reportType === 'TodosProdutos') {
      const labels = reportData.map((product) => product.productName);
      const quantitiesSold = reportData.map((product) => product.quantitySold || 0);
      return (
        <div style={{ width: '50%', margin: 'auto' }}>
          <Pie
            data={{
              labels,
              datasets: [
                {
                  label: 'Quantidade Vendida',
                  data: quantitiesSold,
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container} key={reportType}>
      <div className={styles.header}>
        <h1>Relatórios</h1>
      </div>

      <form className={styles.form}>
  <div className={styles["form-row"]}>
    <label>
      Tipo de Relatório:
      <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
        <option value="Pedidos">Relatório de Pedidos</option>
        <option value="Faturamento">Relatório de Faturamento por Cliente</option>
        <option value="Produtos">Relatório de Produtos Mais Vendidos</option>
        <option value="TodosProdutos">Relatório de Todos os Produtos</option>
      </select>
    </label>

    {reportType === 'Pedidos' && (
      <label>
        Status:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="Pendente">Pendente</option>
          <option value="Processando">Processando</option>
          <option value="Enviado">Enviado</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </label>
    )}
    {reportType === 'Faturamento' && (
      <label>
        Cliente:
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Todos os Clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>
    )}
    {(reportType === 'Produtos' || reportType === 'TodosProdutos') && (
      <label>
        Categoria de Produto:
        <select value={productType} onChange={(e) => setProductType(e.target.value)}>
          <option value="">Todas as Categorias</option>
          <option value="Padrao">Padrão</option>
          <option value="Pintado">Pintado</option>
          <option value="Naval">Naval</option>
          <option value="Plastificado">Plastificado</option>
          <option value="Virolinha">Virolinha</option>
          <option value="Flexivel">Flexível</option>
        </select>
      </label>
    )}
  </div>

  {reportType !== 'TodosProdutos' && (
    <div className={styles["form-row"]}>
      <label>
        Data de Início:
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <label>
        Data de Fim:
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
    </div>
  )}

  <div className={styles.buttonsContainer}>
    <button type="button" onClick={handleGenerateReport} className={styles.generateButton}>
      Gerar Relatório
    </button>
    <button
      type="button"
      onClick={generatePDF}
      className={styles.downloadButton}
      disabled={!reportData || reportData.length === 0}
    >
      Baixar Relatório em PDF
    </button>
  </div>
</form>



      <div className={styles.resultContainer}>
        {loading ? (
          <p>Carregando...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : reportData && reportData.length > 0 ? (
          <>
            <h2>Resultado do Relatório</h2>
            {renderChart()}
            <br />
            <br />
            <table className={styles.table}>
              <thead>
                <tr>
                  {reportType === 'Pedidos' ? (
                    <>
                      <th>Nome do Cliente</th>
                      <th>Data do Pedido</th>
                      <th>Status</th>
                      <th className="right-align">Valor Total (R$)</th>
                      <th>Produtos</th>
                    </>
                  ) : reportType === 'Faturamento' ? (
                    <>
                      <th>Nome do Cliente</th>
                      <th>Total de Pedidos</th>
                      <th className="right-align">Valor Total dos Pedidos</th>
                      <th className="right-align">Valor Médio por Pedido</th>
                    </>
                  ) : reportType === 'Produtos' ? (
                    <>
                      <th>Nome do Produto</th>
                      <th>Categoria</th>
                      <th>Quantidade Vendida</th>
                      <th className="right-align">Valor Total (R$)</th>
                      <th className="right-align">Valor Médio</th>
                    </>
                  ) : (
                    <>
                      <th>Nome</th>
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th className="right-align">Espessura (mm)</th>
                      <th className="right-align">Largura (m)</th>
                      <th className="right-align">Comprimento (m)</th>
                      <th className="right-align">Valor (R$)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportType === 'Pedidos' &&
                  reportData.map((order, index) => (
                    <tr key={index}>
                      <td>{order.clientName}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td>{order.status}</td>
                      <td className="right-align">{order.totalValue?.toFixed(2)}</td>
                      <td>
                        <ul>
                          {order.products?.map((product, idx) => (
                            <li key={idx}>{product}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                {reportType === 'Faturamento' &&
                  reportData.map((billing, index) => (
                    <tr key={index}>
                      <td>{billing.clientName}</td>
                      <td>{billing.totalOrders}</td>
                      <td className="right-align">
                        {billing.totalOrderValue ? billing.totalOrderValue.toFixed(2) : '0.00'}
                      </td>
                      <td className="right-align">
                        {billing.averageOrderValue ? billing.averageOrderValue.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                {reportType === 'Produtos' &&
                  reportData.map((product, index) => (
                    <tr key={index}>
                      <td>{product.productName}</td>
                      <td>{product.productType}</td>
                      <td>{product.quantitySold}</td>
                      <td className="right-align">
                        {product.totalSalesValue ? product.totalSalesValue.toFixed(2) : '0.00'}
                      </td>
                      <td className="right-align">
                        {product.averageSalesValue ? product.averageSalesValue.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                {reportType === 'TodosProdutos' &&
                  reportData.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.description}</td>
                      <td>{product.productType}</td>
                      <td className="right-align">{product.thickness?.toFixed(2)}</td>
                      <td className="right-align">{product.width?.toFixed(2)}</td>
                      <td className="right-align">{product.length?.toFixed(2)}</td>
                      <td className="right-align">{product.value?.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>Nenhum dado encontrado para os critérios selecionados.</p>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
