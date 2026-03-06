const Player = require('../models/Player');

exports.getPlayers = async (req, res) => {
    try {
        const filters = { ...req.query };
        // Remove special json-server query params if they exist to avoid Mongo issues
        ['_sort', '_order', '_limit', '_page', '_expand', '_embed'].forEach(param => delete filters[param]);

        let query = Player.find(filters);

        const players = await query.exec();
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPlayerById = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ message: 'Player not found' });
        res.json(player);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPlayer = async (req, res) => {
    try {
        const player = new Player(req.body);
        const savedPlayer = await player.save();
        res.status(201).json(savedPlayer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePlayer = async (req, res) => {
    try {
        const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPlayer) return res.status(404).json({ message: 'Player not found' });
        res.json(updatedPlayer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePlayer = async (req, res) => {
    try {
        const deletedPlayer = await Player.findByIdAndDelete(req.params.id);
        if (!deletedPlayer) return res.status(404).json({ message: 'Player not found' });
        res.json({ message: 'Player deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
