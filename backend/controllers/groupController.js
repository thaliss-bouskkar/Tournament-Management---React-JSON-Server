const Group = require('../models/Group');

exports.getGroups = async (req, res) => {
    try {
        const filters = { ...req.query };
        ['_sort', '_order', '_limit', '_page', '_expand', '_embed'].forEach(param => delete filters[param]);

        const groups = await Group.find(filters);
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const group = new Group(req.body);
        const savedGroup = await group.save();
        res.status(201).json(savedGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const updatedGroup = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedGroup) return res.status(404).json({ message: 'Group not found' });
        res.json(updatedGroup);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const deletedGroup = await Group.findByIdAndDelete(req.params.id);
        if (!deletedGroup) return res.status(404).json({ message: 'Group not found' });
        res.json({ message: 'Group deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
