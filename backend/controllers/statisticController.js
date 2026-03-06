const Statistic = require('../models/Statistic');

exports.getStatistics = async (req, res) => {
    try {
        const filters = { ...req.query };
        ['_sort', '_order', '_limit', '_page', '_expand', '_embed'].forEach(param => delete filters[param]);

        const statistics = await Statistic.find(filters);
        res.json(statistics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStatisticById = async (req, res) => {
    try {
        const statistic = await Statistic.findById(req.params.id);
        if (!statistic) return res.status(404).json({ message: 'Statistic not found' });
        res.json(statistic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createStatistic = async (req, res) => {
    try {
        const statistic = new Statistic(req.body);
        const savedStatistic = await statistic.save();
        res.status(201).json(savedStatistic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateStatistic = async (req, res) => {
    try {
        const updatedStatistic = await Statistic.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStatistic) return res.status(404).json({ message: 'Statistic not found' });
        res.json(updatedStatistic);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteStatistic = async (req, res) => {
    try {
        const deletedStatistic = await Statistic.findByIdAndDelete(req.params.id);
        if (!deletedStatistic) return res.status(404).json({ message: 'Statistic not found' });
        res.json({ message: 'Statistic deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
