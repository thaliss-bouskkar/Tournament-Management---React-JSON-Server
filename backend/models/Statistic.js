const mongoose = require('mongoose');

const statisticSchema = new mongoose.Schema({
    playerId: { type: String, required: true },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    matchId: { type: String },
    teamId: { type: String }
}, { timestamps: true });

statisticSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Statistic', statisticSchema);
