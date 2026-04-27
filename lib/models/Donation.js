const mongoose = require('mongoose');

const donationsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    disasterType: {
        type: String,
        required: true,
        enum: ['Flood', 'Earthquake', 'Fire', 'Hurricane', 'Other'] // Example disaster types
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true // Ensures each transaction hash is unique
    },
    nftTokenId: {
        type: String,
        required: true,
        unique: true // Ensures each NFT token ID is unique
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Donation', donationsSchema);