const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors'); 
const transactionRouter = require('./routes/transactions'); 
const statisticsRouter = require('./routes/statistics'); 
const combinedApiRouter = require('./routes/combinedAPI'); 

const app = express();

// connectDB();

// CORS configuration
const corsOptions = {
  origin: 'https://mern-stack-coding-challenge.vercel.app/', 
  optionsSuccessStatus: 200,
};

app.use(cors());


mongoose.connect('mongodb+srv://siddhibhosale:hujO6JsBxI0V4ZXJ@cluster0.5fcdbte.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});


app.use(express.json());


app.use('/api/transactions', transactionRouter); 
app.use('/api/statistics', statisticsRouter); 
app.use('/api/combined', combinedApiRouter); 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
