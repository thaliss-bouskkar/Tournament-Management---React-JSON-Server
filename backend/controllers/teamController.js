const Team = require('../models/Team');

exports.getTeams = async (req, res) => {
    try {
        const filters = { ...req.query };
        ['_sort', '_order', '_limit', '_page', '_expand', '_embed'].forEach(param => delete filters[param]);

        const teams = await Team.find(filters);
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createTeam = async (req, res) => {
    try {
        const team = new Team(req.body);
        const savedTeam = await team.save();
        res.status(201).json(savedTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTeam) return res.status(404).json({ message: 'Team not found' });
        res.json(updatedTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const deletedTeam = await Team.findByIdAndDelete(req.params.id);
        if (!deletedTeam) return res.status(404).json({ message: 'Team not found' });
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
