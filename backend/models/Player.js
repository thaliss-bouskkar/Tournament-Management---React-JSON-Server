const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    number: { type: String },
    position: { type: String },
    teamId: { type: String, required: true },
    imageUrl: { type: String }
}, { timestamps: true });

playerSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Player', playerSchema);
