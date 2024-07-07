const express = require('express');
const axios = require('axios');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get transactions with filtering, search, and pagination
router.get('/', async (req, res) => {
    const { month, search, page = 1, perPage = 10 } = req.query;

    console.log('Received query params:', { month, search, page, perPage });

    const query = {
        $expr: {
            $eq: [{ $month: "$dateOfSale" }, parseInt(month, 10)]
        }
    };

    if (search) {
        query.$or = [
            { productTitle: { $regex: search, $options: 'i' } },
            { productDescription: { $regex: search, $options: 'i' } },
            { price: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage, 10));
        const totalCount = await Transaction.countDocuments(query);

        res.json({
            transactions,
            totalPages: Math.ceil(totalCount / perPage),
            currentPage: parseInt(page, 10)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new transaction
router.post('/', async (req, res) => {
    try {
        const newTransaction = new Transaction(req.body);
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Initialize the database with data from third-party API
router.get('/initialize', async (req, res) => {
    try {
        const apiUrl = 'https://s3.amazonaws.com/roxiler.com/product_transaction.json';
        const batchSize = 60; s
        let allData = [];

        console.log('Starting data fetch for 60 items...');
        const response = await axios.get(apiUrl, {
            params: { page: 1 },
        });

        const data = response.data;
        console.log(`Fetched 60 items from page 1`);

        if (!Array.isArray(data) || data.length === 0) {
            console.log('No data fetched from API.');
            return res.status(404).send({ message: 'No data fetched from API.' });
        }
        allData.push(...data);

        console.log(`Data fetch complete, inserting ${allData.length} items into database...`);
        await Transaction.deleteMany({}); 

        for (let i = 0; i < allData.length; i += batchSize) {
            const batch = allData.slice(i, i + batchSize).map(item => ({
                id: item.id.toString(),
                productTitle: item.title,
                productDescription: item.description,
                price: item.price,
                category: item.category,
                image: item.image,
                sold: item.sold,
                dateOfSale: new Date(item.dateOfSale)
            }));

            await Transaction.insertMany(batch); 
            console.log(`Inserted batch ${i / batchSize + 1}`);
        }

        console.log('Database initialization complete.');

        res.status(200).send({ message: 'Database initialized with data from third-party API' });
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).send({ error: 'Failed to initialize database', message: error.message });
    }
});

module.exports = router;
