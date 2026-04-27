const mongoose = require('mongoose');

const transactionsSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true // Ensures each transaction hash is unique
    },
    type: {
        type: String,
        required: true,
        enum: ['Credit', 'Debit'] // Example transaction types
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now // Automatically sets the current date and time
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Completed', 'Failed'] // Example statuses
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Transaction', transactionsSchema);