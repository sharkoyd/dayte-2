const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VerificationCodeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    code: {
        type: String,
        required: true,
        default: '',
    },
    expiringMinutes: {
        type: Number,
        default: 5,
        required: true,
    },
});




VerificationCodeSchema.pre('save', function (next) {
    const code = Math.floor(100000 + Math.random() * 900000);
    this.code = code;
    next();

});


module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);