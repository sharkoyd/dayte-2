const mongoose = require('mongoose');

// schema defines the structure of the documents that you can store in the collection
const Schema = mongoose.Schema;



const userImageSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    image: {
        type: String,
        required: true
    },
    // this is to help with ordering the images in the carousel
    position: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('UserImage', userImageSchema);