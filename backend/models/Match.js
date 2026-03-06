const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    groupId: { type: String },
    teamAId: { type: String, required: true },
    teamBId: { type: String, required: true },
    date: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    status: { type: String, enum: ['upcoming', 'live', 'finished', 'locked'], default: 'upcoming' },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 }
}, { timestamps: true });

matchSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Match', matchSchema);
