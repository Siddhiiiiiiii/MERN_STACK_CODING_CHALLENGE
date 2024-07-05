const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/combined-data', async (req, res) => {
    try {
        const { month } = req.query;

        if (!month || isNaN(parseInt(month))) {
            return res.status(400).json({ error: 'Invalid month parameter' });
        }

        const [salesResponse, barChartResponse, pieChartResponse] = await Promise.all([
            axios.get('http://localhost:3000/api/statistics/sales', { params: { month } }),
            axios.get('http://localhost:3000/api/statistics/bar-chart', { params: { month } }),
            axios.get('http://localhost:3000/api/statistics/pie-chart', { params: { month } })
        ]);

        const salesData = salesResponse.data;
        const barChartData = barChartResponse.data;
        const pieChartData = pieChartResponse.data;

        const combinedData = {
            salesData,
            barChartData,
            pieChartData
        };

        res.status(200).json(combinedData);
    } catch (error) {
        console.error('Error fetching combined data:', error);

        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request:', error.request);
        } else {
            console.error('Message:', error.message);
        }

        res.status(500).json({ error: 'Failed to fetch combined data', message: error.message });
    }
});

module.exports = router;
