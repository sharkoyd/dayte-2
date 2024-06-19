const mongoose = require('mongoose');

// schema defines the structure of the documents that you can store in the collection
const Schema = mongoose.Schema;


const interestSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    icon:{
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('Interest', interestSchema);