const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    productTitle: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    sold: {
        type: Boolean,
        default: false
    },
    dateOfSale: {
        type: Date,
        required: true
    }
});

// Add a pre-save hook to ensure proper date handling
transactionSchema.pre('save', function(next) {
    if (!this.dateOfSale || isNaN(this.dateOfSale.getTime())) {
        return next(new Error('Invalid dateOfSale. Date must be valid.'));
    }
    next();
});

// Add a post-find hook to handle casting errors for dateOfSale
transactionSchema.post('find', function(error, res, next) {
    if (error.name === 'CastError' && error.path === 'dateOfSale') {
        return next(new Error('Invalid dateOfSale. Date must be valid.'));
    }
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
