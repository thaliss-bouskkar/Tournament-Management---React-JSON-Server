const Match = require('../models/Match');

/**
 * Auto-transitions upcoming → live when currentTime >= matchStart.
 * Does NOT touch finished or locked matches.
 */
const autoTransitionStatus = (match) => {
    if (match.status === 'finished' || match.status === 'locked') return match.status;
    if (!match.date || !match.startTime) return match.status;

    const now = new Date();
    const matchStart = new Date(`${match.date}T${match.startTime}:00`);

    if (now >= matchStart) return 'live';
    return 'upcoming';
};

// ─── GET ALL ────────────────────────────────────────────────────────────────
exports.getMatches = async (req, res) => {
    try {
        const filters = { ...req.query };
        ['_sort', '_order', '_limit', '_page', '_expand', '_embed'].forEach(p => delete filters[p]);

        const matches = await Match.find(filters);

        // Auto-transition upcoming → live if start time has passed
        const processed = await Promise.all(matches.map(async (match) => {
            const newStatus = autoTransitionStatus(match);
            if (newStatus !== match.status) {
                match.status = newStatus;
                await match.save();
            }
            return match;
        }));

        res.json(processed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET BY ID ───────────────────────────────────────────────────────────────
exports.getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Match not found' });
        res.json(match);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
exports.createMatch = async (req, res) => {
    try {
        const body = { ...req.body };
        // Normalise stale default values from older frontends
        if (!body.status || !['upcoming', 'live', 'finished', 'locked'].includes(body.status)) {
            body.status = 'upcoming';
        }
        const match = new Match(body);
        const saved = await match.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
exports.updateMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        const updates = { ...req.body };

        const current = await Match.findById(matchId);
        if (!current) return res.status(404).json({ message: 'Match not found' });

        // ── Score Rule: scores only editable when LIVE ──
        const touchesScore = updates.scoreA !== undefined || updates.scoreB !== undefined;
        if (touchesScore && current.status !== 'live') {
            return res.status(400).json({
                message: 'Scores can only be updated when match status is LIVE'
            });
        }

        // ── Status Transition Rules ──
        if (updates.status && updates.status !== current.status) {
            const from = current.status;
            const to = updates.status;

            // Validate enum
            const valid = ['upcoming', 'live', 'finished', 'locked'];
            if (!valid.includes(to)) {
                return res.status(400).json({ message: `Invalid status: ${to}` });
            }

            // Block unlocking a locked match back to finished (only super_admin flow
            // should ever attempt this, and it goes through the delete path instead)
            if (from === 'locked' && to === 'finished') {
                return res.status(400).json({
                    message: 'A locked match cannot be set back to FINISHED via this endpoint'
                });
            }

            console.log(`[Status Change] Match ${matchId}: ${from} -> ${to}`);
        }

        const updated = await Match.findByIdAndUpdate(matchId, updates, { new: true, runValidators: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
exports.deleteMatch = async (req, res) => {
    try {
        const deleted = await Match.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Match not found' });
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
