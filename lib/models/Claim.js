const mongoose = require('mongoose');

const claimsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    disasterType: {
        type: String,
        required: true,
        enum: ['Flood', 'Earthquake', 'Fire', 'Hurricane', 'Other'] // Example disaster types
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Approved', 'Rejected', 'Under Review'], // Example statuses
        default: 'Pending'
    },
    documents: {
        type: [String], // Array of document URLs or file paths
        required: true
    },
    location: {
        type: String,
        required: true
    },
    reviewNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Claim', claimsSchema);