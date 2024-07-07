import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../CSS/TransactionPage.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('3'); 
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [statistics, setStatistics] = useState({ totalAmount: 0, soldItems: 0, notSoldItems: 0 });
    const [activeSection, setActiveSection] = useState('dashboard');
    const chartRef = useRef(null);

    useEffect(() => {
        fetchTransactionsByMonth(selectedMonth);
    }, [selectedMonth, page, perPage]);

    useEffect(() => {
        if (activeSection === 'chart' && chartRef.current) {
            
            chartRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeSection]);

    const fetchTransactionsByMonth = async (month) => {
        try {
            const response = await axios.get('https://mern-stack-coding-challenge.onrender.com/api/transactions', {
                params: {
                    month,
                    page,
                    perPage
                }
            });
            setTransactions(response.data.transactions);
            setAllTransactions(response.data.transactions); 
            setTotalPages(response.data.totalPages);
            calculateStatistics(response.data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const calculateStatistics = (transactions) => {
        const totalAmount = transactions.reduce((acc, transaction) => acc + transaction.price, 0);
        const soldItems = transactions.filter(transaction => transaction.sold).length;
        const notSoldItems = transactions.length - soldItems;

        setStatistics({ totalAmount, soldItems, notSoldItems });
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        filterTransactions(e.target.value);
    };

    const filterTransactions = (text) => {
        const filteredTransactions = allTransactions.filter(transaction =>
            transaction.productTitle.toLowerCase().includes(text.toLowerCase()) ||
            transaction.productDescription.toLowerCase().includes(text.toLowerCase()) ||
            transaction.price.toString().toLowerCase().includes(text.toLowerCase())
        );
        setTransactions(filteredTransactions);
        setTotalPages(Math.ceil(filteredTransactions.length / perPage));
        setPage(1); 
        calculateStatistics(filteredTransactions);
    };

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
    };

    const handleSearchClick = () => {
        filterTransactions(searchText);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handlePerPageChange = (e) => {
        setPerPage(e.target.value);
        setPage(1); 
    };

    const getPriceRangeData = () => {
        const priceRanges = [
            { label: '$0 - $10', min: 0, max: 10, count: 0 },
            { label: '$10 - $50', min: 10, max: 50, count: 0 },
            { label: '$50 - $100', min: 50, max: 100, count: 0 },
            { label: '$100 - $500', min: 100, max: 500, count: 0 },
            { label: '$500+', min: 500, max: Infinity, count: 0 }
        ];

        transactions.forEach(transaction => {
            const range = priceRanges.find(r => transaction.price > r.min && transaction.price <= r.max);
            if (range) range.count++;
        });

        return {
            labels: priceRanges.map(r => r.label),
            datasets: [
                {
                    label: 'Number of Items',
                    data: priceRanges.map(r => r.count),
                    backgroundColor: '#f4a261'
                }
            ]
        };
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div>
            <nav className="navbar">
                <button className={`btn btn-nav ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>Transaction Dashboard</button>
                <button className={`btn btn-nav ${activeSection === 'statistics' ? 'active' : ''}`} onClick={() => setActiveSection('statistics')}>Transaction Statistics</button>
                <button className={`btn btn-nav ${activeSection === 'chart' ? 'active' : ''}`} onClick={() => setActiveSection('chart')}>Bar Chart</button>
            </nav>

            <div className="content">
                {activeSection === 'dashboard' && (
                    <div>
                        <div className="controls">
                            <input
                                type="text"
                                placeholder="Search transaction"
                                value={searchText}
                                onChange={handleSearchChange}
                                className="form-control"
                            />
                            <button onClick={handleSearchClick} className="btn btn-primary">Search</button>
                            <select value={selectedMonth} onChange={handleMonthChange} className="form-select">
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="table-container">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>Price</th>
                                        <th>Category</th>
                                        <th>Sold</th>
                                        <th>Image</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.id}</td>
                                            <td>{transaction.productTitle}</td>
                                            <td>{transaction.productDescription}</td>
                                            <td>{transaction.price}</td>
                                            <td>{transaction.category}</td>
                                            <td>{transaction.sold ? 'Yes' : 'No'}</td>
                                            <td>
                                                <img src={transaction.image} alt={transaction.productTitle} className="transaction-image" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination-container">
                            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="btn btn-secondary">
                                Previous
                            </button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="btn btn-secondary">
                                Next
                            </button>
                        </div>
                        <div className="per-page-select">
                            <span>Per Page:</span>
                            <select value={perPage} onChange={handlePerPageChange} className="form-select">
                                <option value={10}>10</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeSection === 'statistics' && (
                    <div className="statistics-section">
                        <h2>Statistics - {monthNames[selectedMonth - 1]}</h2>
                        <div className="statistics-card">
                            <p>Total Sale Amount: ${statistics.totalAmount.toFixed(2)}</p>
                            <p>Total Sold Items: {statistics.soldItems}</p>
                            <p>Total Not Sold Items: {statistics.notSoldItems}</p>
                        </div>
                    </div>
                )}

{activeSection === 'chart' && (
  <div className="chart-section" ref={chartRef}>
    <h2>Bar Chart - {monthNames[selectedMonth - 1]}</h2>
    <div className="chart-container">
      <Bar
        data={getPriceRangeData()}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            },
            title: {
              display: true,
              text: 'Number of Items by Price Range'
            }
          }
        }}
      />
    </div>
  </div>
)}

            </div>
        </div>
    );
};

export default TransactionsPage;
