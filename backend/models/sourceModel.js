const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Source name is required'],
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Source', sourceSchema);
