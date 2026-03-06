const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    groupId: { type: String, required: true }, // Keep as String to easily support existing UUIDs/IDs from frontend, or switch to ObjectId if migrating. String is safer for direct replacement of json-server
    logo: { type: String },
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    gf: { type: Number, default: 0 },
    ga: { type: Number, default: 0 },
    gd: { type: Number, default: 0 },
    pts: { type: Number, default: 0 }
}, { timestamps: true });

teamSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    }
});

module.exports = mongoose.model('Team', teamSchema);
