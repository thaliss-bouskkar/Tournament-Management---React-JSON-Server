import React, { useState, useEffect } from 'react';
import { matchService, teamService, groupService, playerService, statService, logService } from '../../services/api';
import { cascadeService } from '../../services/cascadeService';
import {
    Plus, Edit, Trash2, Calendar, Clock, Trophy, CheckCircle,
    XCircle, Users, BarChart, Search, ChevronRight, AlertCircle, Loader2, Filter,
    AlertTriangle, Lock, Play, Flag, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { isLocked, validateScheduling } from '../../utils/tournamentEngine';

/* ─────────────────────────────────────────────
   Status badge component (reused in every row)
───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    if (status === 'live') {
        return (
            <span className="badge badge-live">
                <span className="live-dot" />
                LIVE
            </span>
        );
    }
    if (status === 'finished') {
        return (
            <span className="badge badge-finished">
                <CheckCircle size={11} /> Finished
            </span>
        );
    }
    if (status === 'locked') {
        return (
            <span className="badge badge-locked">
                <Trophy size={11} /> Locked
            </span>
        );
    }
    // upcoming
    return (
        <span className="badge badge-upcoming">
            <Clock size={11} /> Upcoming
        </span>
    );
};

const MatchesCRUD = () => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal states
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const { user } = useAuth();
    const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin';

    // Form states - Matches (status defaults to 'upcoming' — the correct enum value)
    const [matchForm, setMatchForm] = useState({
        groupId: '', teamAId: '', teamBId: '', date: '', startTime: '', endTime: '', status: 'upcoming', scoreA: 0, scoreB: 0
    });

    // Form states - Stats
    const [statForm, setStatForm] = useState({
        playerId: '', goals: 0, assists: 0, yellowCards: 0, redCards: 0
    });
    const [matchStats, setMatchStats] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig] = useState({ key: 'date', direction: 'asc' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [mRes, tRes, gRes, pRes] = await Promise.all([
                matchService.getAll(),
                teamService.getAll(),
                groupService.getAll(),
                playerService.getAll()
            ]);
            setMatches(mRes.data);
            setTeams(tRes.data);
            setGroups(gRes.data);
            setPlayers(pRes.data);
        } catch {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleMatch = async (e) => {
        e.preventDefault();
        const { isValid, errors } = validateScheduling(matches, matchForm);
        if (!isValid) return errors.forEach(err => toast.error(err));
        try {
            await matchService.create({ ...matchForm, status: 'upcoming' });
            toast.success('Match scheduled successfully');
            setShowScheduleModal(false);
            setMatchForm({ groupId: '', teamAId: '', teamBId: '', date: '', startTime: '', endTime: '', status: 'upcoming', scoreA: 0, scoreB: 0 });
            fetchData();
        } catch {
            toast.error('Error scheduling match');
        }
    };

    const openStatsModal = async (match) => {
        setSelectedMatch(match);
        try {
            const { data } = await statService.getByMatch(match.id);
            setMatchStats(data);
            setShowStatsModal(true);
        } catch {
            toast.error('Error loading stats');
        }
    };

    const handleAddStat = async (e) => {
        e.preventDefault();
        if (isLocked(selectedMatch)) return toast.error('Match is locked');
        if (!statForm.playerId) return toast.error('Select a player');
        if (!selectedMatch?.id) return toast.error('Match context lost');
        try {
            const existingStat = matchStats.find(s => s.playerId === statForm.playerId);
            const player = players.find(p => p.id === statForm.playerId);
            if (existingStat) {
                await statService.update(existingStat.id, {
                    ...statForm,
                    matchId: selectedMatch.id,
                    goals: (existingStat.goals || 0) + (statForm.goals || 0),
                    assists: (existingStat.assists || 0) + (statForm.assists || 0),
                    yellowCards: (existingStat.yellowCards || 0) + (statForm.yellowCards || 0),
                    redCards: (existingStat.redCards || 0) + (statForm.redCards || 0)
                });
            } else {
                await statService.create({ ...statForm, matchId: selectedMatch.id, teamId: player.teamId });
            }
            toast.success('Statistic recorded');
            const { data: updatedStats } = await statService.getByMatch(selectedMatch.id);
            setMatchStats(updatedStats);
            setStatForm({ playerId: '', goals: 0, assists: 0, yellowCards: 0, redCards: 0 });
        } catch {
            toast.error('Error processing statistic');
        }
    };

    /* ── Status Transition Handlers ── */
    const handleSetStatus = async (match, newStatus) => {
        if (isLocked(match) && !isSuperAdmin) {
            return toast.error('Only Super Admins can modify locked matches');
        }

        const labels = { live: 'LIVE', finished: 'FINISHED', locked: 'LOCKED' };
        const confirmMsg = newStatus === 'locked'
            ? 'CRITICAL: Locking this match will prevent further edits to scores or statistics. Proceed?'
            : `Change match status to ${labels[newStatus] || newStatus.toUpperCase()}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await matchService.update(match.id, { status: newStatus });
            toast.success(`Match is now ${labels[newStatus] || newStatus}`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating status');
        }
    };

    /* ── Score Update (only allowed when LIVE) ── */
    const handleUpdateScore = async (matchId, field, value) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        if (match.status !== 'live') {
            return toast.error('Scores can only be edited when the match is LIVE');
        }
        const newVal = Math.max(0, Number(value));
        // Optimistic local update first, then persist
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: newVal } : m));
        try {
            await matchService.update(matchId, { [field]: newVal });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating score');
            fetchData(); // revert on failure
        }
    };

    /* ── Score Increment (+ / −) ── */
    const handleIncrementScore = (matchId, field, delta) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        if (match.status !== 'live') return toast.error('Match must be LIVE to edit scores');
        const current = Number(match[field] ?? 0);
        const next = Math.max(0, current + delta);
        handleUpdateScore(matchId, field, next);
    };

    /* ── Delete ── */
    const handleDeleteMatch = async (id) => {
        const match = matches.find(m => m.id === id);
        if (!match) return;

        if (isLocked(match)) {
            if (!isSuperAdmin) return toast.error('Access Denied: Only Super Admins can delete locked matches');
            setSelectedMatch(match);
            setShowDeleteConfirm(true);
            setDeleteConfirmText('');
            return;
        }

        if (!window.confirm('Delete this match and all related statistics? This action is permanent.')) return;
        try {
            setMatches(prev => prev.filter(m => m.id !== id));
            await cascadeService.deleteMatch(id);
            toast.success('Match deleted');
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete match');
            fetchData();
        }
    };

    const confirmDeleteLockedMatch = async () => {
        if (deleteConfirmText !== 'DELETE') {
            return toast.error('Please type DELETE to confirm this critical action');
        }
        const matchToLog = selectedMatch;
        try {
            const matchLabel = `${matchToLog.date} | ${teams.find(t => t.id === matchToLog.teamAId)?.name || 'Team A'} vs ${teams.find(t => t.id === matchToLog.teamBId)?.name || 'Team B'}`;
            setMatches(prev => prev.filter(m => m.id !== matchToLog.id));
            setShowDeleteConfirm(false);
            await cascadeService.deleteMatch(matchToLog.id);
            toast.success('Locked match permanently deleted');
            fetchData();
            logService.create({
                action: 'DELETE_LOCKED_MATCH',
                matchId: matchToLog.id,
                details: `Deleted locked match: ${matchLabel}`,
                admin: user?.name || 'Unknown',
                email: user?.email || 'Unknown'
            }).catch(err => console.error('Logging failed:', err));
        } catch {
            toast.error('Critical failure: Could not delete locked match records');
            fetchData();
        }
    };

    /* ── Filtering & Sorting ── */
    const FILTER_TABS = ['all', 'upcoming', 'live', 'finished', 'locked'];

    const filteredMatches = matches
        .filter(m => {
            if (filterStatus !== 'all' && m.status !== filterStatus) return false;
            const teamA = teams.find(t => t.id === m.teamAId);
            const teamB = teams.find(t => t.id === m.teamBId);
            const group = groups.find(g => g.id === m.groupId);
            const search = searchTerm.toLowerCase();
            return (
                (teamA?.name || '').toLowerCase().includes(search) ||
                (teamB?.name || '').toLowerCase().includes(search) ||
                (group?.name || '').toLowerCase().includes(search) ||
                (m.date || '').includes(search)
            );
        })
        .sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={40} /></div>;

    /* ── Score input styles ── */
    const scoreInputStyle = (isLive) => ({
        width: '50px',
        textAlign: 'center',
        padding: '5px',
        borderRadius: '6px',
        border: isLive ? '2px solid #10B981' : '1px solid #e5e7eb',
        fontWeight: 'bold',
        fontSize: '1rem',
        backgroundColor: isLive ? '#f0fdf4' : '#f9fafb',
        color: isLive ? '#065f46' : '#9ca3af',
        cursor: isLive ? 'text' : 'not-allowed',
        transition: 'all 0.2s',
        outline: 'none',
    });

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>Tournament Matches</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage match status, scores, and statistics.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '10px', gap: '2px' }}>
                        {FILTER_TABS.map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    backgroundColor: filterStatus === s ? 'white' : 'transparent',
                                    color: filterStatus === s
                                        ? (s === 'live' ? '#DC2626' : s === 'finished' ? '#059669' : s === 'locked' ? '#4B5563' : 'var(--primary)')
                                        : 'var(--text-muted)',
                                    boxShadow: filterStatus === s ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                                    transition: 'all 0.15s',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search matches..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '0.6rem 1rem 0.6rem 2.6rem', borderRadius: 'var(--radius)', border: '1px solid #ddd', width: '210px', fontSize: '0.875rem' }}
                        />
                    </div>

                    <button className="btn-primary" onClick={() => setShowScheduleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1.25rem' }}>
                        <Plus size={18} /> Schedule Match
                    </button>
                </div>
            </div>

            {/* ── Match Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                {filteredMatches.length > 0 ? filteredMatches.map(match => {
                    const group = groups.find(g => g.id === match.groupId);
                    const teamA = teams.find(t => t.id === match.teamAId);
                    const teamB = teams.find(t => t.id === match.teamBId);
                    const locked = isLocked(match);
                    const isLive = match.status === 'live';
                    const isFinished = match.status === 'finished' || locked;

                    const borderColor = isLive ? '#EF4444' : isFinished ? '#10B981' : locked ? '#6B7280' : '#D1D5DB';

                    return (
                        <div key={match.id} className="card match-card-admin" style={{
                            padding: '0 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: locked ? 0.88 : 1,
                            boxShadow: isLive ? '0 0 0 1px rgba(239,68,68,0.25), 0 4px 12px rgba(239,68,68,0.12)' : 'var(--shadow)',
                        }}>
                            {/* Status color stripe */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: borderColor }} />

                            {/* Date / Status Info */}
                            <div style={{ minWidth: '140px', padding: '1.25rem 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                                    <Calendar size={13} /> {match.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                                    <Clock size={13} /> {match.startTime}
                                </div>
                                <StatusBadge status={match.status} />
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.35rem' }}>
                                    Group {group?.name}
                                </div>
                            </div>

                            {/* Teams + Score */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, padding: '0 1rem' }}>
                                {/* Team A */}
                                <div style={{ textAlign: 'right', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem' }}>
                                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{teamA?.name}</span>
                                    <img src={teamA?.logo || '/teamlogo.png'} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                                </div>

                                {/* Score Stepper — editable only when LIVE */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {/* Score A stepper */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        {isLive && (
                                            <button
                                                className="score-btn"
                                                onClick={() => handleIncrementScore(match.id, 'scoreA', 1)}
                                                title="+1 Goal Team A"
                                            >+</button>
                                        )}
                                        <div style={{
                                            width: '44px', height: '44px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '900', fontSize: '1.4rem',
                                            borderRadius: '8px',
                                            backgroundColor: isLive ? '#f0fdf4' : '#f9fafb',
                                            border: isLive ? '2px solid #10B981' : '1px solid #e5e7eb',
                                            color: isLive ? '#065f46' : '#9ca3af',
                                            transition: 'all 0.2s',
                                        }}>
                                            {match.scoreA}
                                        </div>
                                        {isLive && match.scoreA > 0 && (
                                            <button
                                                className="score-btn score-btn-minus"
                                                onClick={() => handleIncrementScore(match.id, 'scoreA', -1)}
                                                title="-1 Goal Team A"
                                            >−</button>
                                        )}
                                    </div>

                                    <span style={{ color: '#9ca3af', fontWeight: '900', fontSize: '1.4rem', lineHeight: 1 }}>:</span>

                                    {/* Score B stepper */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        {isLive && (
                                            <button
                                                className="score-btn"
                                                onClick={() => handleIncrementScore(match.id, 'scoreB', 1)}
                                                title="+1 Goal Team B"
                                            >+</button>
                                        )}
                                        <div style={{
                                            width: '44px', height: '44px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '900', fontSize: '1.4rem',
                                            borderRadius: '8px',
                                            backgroundColor: isLive ? '#f0fdf4' : '#f9fafb',
                                            border: isLive ? '2px solid #10B981' : '1px solid #e5e7eb',
                                            color: isLive ? '#065f46' : '#9ca3af',
                                            transition: 'all 0.2s',
                                        }}>
                                            {match.scoreB}
                                        </div>
                                        {isLive && match.scoreB > 0 && (
                                            <button
                                                className="score-btn score-btn-minus"
                                                onClick={() => handleIncrementScore(match.id, 'scoreB', -1)}
                                                title="-1 Goal Team B"
                                            >−</button>
                                        )}
                                    </div>
                                </div>

                                {/* Team B */}
                                <div style={{ textAlign: 'left', flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <img src={teamB?.logo || '/teamlogo.png'} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{teamB?.name}</span>
                                </div>
                            </div>

                            {/* ── Match Dashboard Control Panel ── */}
                            <div className="match-controls-sidebar">

                                {/* Status Toggle Rail */}
                                <div className="status-rail">
                                    <button
                                        className={`rail-btn ${match.status === 'upcoming' ? 'active upcoming' : ''}`}
                                        onClick={() => handleSetStatus(match, 'upcoming')}
                                        title="Set to Upcoming"
                                    ><Clock size={16} /></button>

                                    <button
                                        className={`rail-btn ${match.status === 'live' ? 'active live' : ''}`}
                                        onClick={() => handleSetStatus(match, 'live')}
                                        title="Set to LIVE"
                                    ><Play size={16} /></button>

                                    <button
                                        className={`rail-btn ${match.status === 'finished' ? 'active finished' : ''}`}
                                        onClick={() => handleSetStatus(match, 'finished')}
                                        title="Set to Finished"
                                    ><CheckCircle size={16} /></button>

                                    <button
                                        className={`rail-btn ${match.status === 'locked' ? 'active locked' : ''}`}
                                        onClick={() => handleSetStatus(match, 'locked')}
                                        title="Lock Match Repository"
                                    ><Lock size={16} /></button>
                                </div>

                                {/* Main Dash Buttons */}
                                <div className="dashboard-btn-group">
                                    {/* Stats (Persistent for Live/Finished) */}
                                    {(isLive || match.status === 'finished') && (
                                        <button className="dash-btn primary" onClick={() => openStatsModal(match)}>
                                            <BarChart size={15} /> Stats
                                        </button>
                                    )}
                                </div>

                                <div className="dashboard-btn-group">
                                    {/* Remove / Delete */}
                                    {locked ? (
                                        isSuperAdmin && (
                                            <button className="dash-btn danger" onClick={() => handleDeleteMatch(match.id)}>
                                                <Trash2 size={15} /> Remove
                                            </button>
                                        )
                                    ) : (
                                        <button className="dash-btn danger" onClick={() => handleDeleteMatch(match.id)}>
                                            <Trash2 size={15} /> Delete
                                        </button>
                                    )}

                                    {/* Trophy for non-admins if locked */}
                                    {locked && !isSuperAdmin && (
                                        <div style={{ color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '4px' }}>
                                            <Trophy size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: '#fff', borderRadius: 'var(--radius)', border: '1px dashed #ddd' }}>
                        <AlertCircle size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No matches found.</p>
                    </div>
                )}
            </div>

            {/* ── Schedule Modal ── */}
            {showScheduleModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Schedule New Match</h3>
                            <button onClick={() => setShowScheduleModal(false)}><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleScheduleMatch} className="modal-form">
                            <div className="form-group">
                                <label>Group</label>
                                <select required value={matchForm.groupId} onChange={e => setMatchForm({ ...matchForm, groupId: e.target.value, teamAId: '', teamBId: '' })}>
                                    <option value="">Select Group</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>Group {g.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Team A</label>
                                    <select required value={matchForm.teamAId} onChange={e => setMatchForm({ ...matchForm, teamAId: e.target.value })}>
                                        <option value="">Select Team A</option>
                                        {teams.filter(t => t.groupId === matchForm.groupId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Team B</label>
                                    <select required value={matchForm.teamBId} onChange={e => setMatchForm({ ...matchForm, teamBId: e.target.value })}>
                                        <option value="">Select Team B</option>
                                        {teams.filter(t => t.groupId === matchForm.groupId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" required value={matchForm.date} onChange={e => setMatchForm({ ...matchForm, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Start Time</label>
                                <input type="time" required value={matchForm.startTime} onChange={e => setMatchForm({ ...matchForm, startTime: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.8rem' }}>
                                Create Match Schedule
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Stats Modal ── */}
            {showStatsModal && selectedMatch && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0 }}>Game Statistics</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {teams.find(t => t.id === selectedMatch.teamAId)?.name} vs {teams.find(t => t.id === selectedMatch.teamBId)?.name}
                                </p>
                            </div>
                            <button onClick={() => setShowStatsModal(false)}><XCircle size={24} /></button>
                        </div>
                        <div style={{ padding: '0 1.5rem 1.5rem' }}>
                            {/* ── Match Summary (Team vs Team) ── */}
                            {matchStats.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '12px', textAlign: 'center' }}>
                                    {[
                                        { label: 'Goals', key: 'goals' },
                                        { label: 'Assists', key: 'assists' },
                                        { label: 'Cards', key: 'cards' }
                                    ].map(stat => {
                                        const teamAVal = matchStats.filter(s => players.find(p => p.id === s.playerId)?.teamId === selectedMatch.teamAId)
                                            .reduce((acc, curr) => acc + (stat.key === 'cards' ? (curr.yellowCards + curr.redCards) : curr[stat.key]), 0);
                                        const teamBVal = matchStats.filter(s => players.find(p => p.id === s.playerId)?.teamId === selectedMatch.teamBId)
                                            .reduce((acc, curr) => acc + (stat.key === 'cards' ? (curr.yellowCards + curr.redCards) : curr[stat.key]), 0);

                                        return (
                                            <div key={stat.key}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{stat.label}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)' }}>{teamAVal}</span>
                                                    <span style={{ color: '#9ca3af' }}>vs</span>
                                                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--primary)' }}>{teamBVal}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <form onSubmit={handleAddStat} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '2rem', alignItems: 'end', backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '12px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Player</label>
                                    <select value={statForm.playerId} onChange={e => setStatForm({ ...statForm, playerId: e.target.value })} style={{ padding: '0.5rem' }}>
                                        <option value="">Select Player</option>
                                        <optgroup label={teams.find(t => t.id === selectedMatch.teamAId)?.name}>
                                            {players.filter(p => p.teamId === selectedMatch.teamAId).map(p => <option key={p.id} value={p.id}>{p.name} (#{p.number})</option>)}
                                        </optgroup>
                                        <optgroup label={teams.find(t => t.id === selectedMatch.teamBId)?.name}>
                                            {players.filter(p => p.teamId === selectedMatch.teamBId).map(p => <option key={p.id} value={p.id}>{p.name} (#{p.number})</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                {[['goals', 'G'], ['assists', 'A'], ['yellowCards', 'YC'], ['redCards', 'RC']].map(([field, label]) => (
                                    <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{label}</label>
                                        <input type="number" min="0" value={statForm[field]} onChange={e => setStatForm({ ...statForm, [field]: parseInt(e.target.value) || 0 })} style={{ padding: '0.5rem',width:'100%' }} />
                                    </div>
                                ))}
                                <button type="submit" className="btn-primary" style={{ padding: '0.6rem' }}><Plus size={22} /></button>
                            </form>

                            <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Player</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Pos</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Goals</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Assists</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Cards</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="stats-tbody">
                                        {matchStats.map(s => {
                                            const player = players.find(p => p.id === s.playerId);
                                            const team = teams.find(t => t.id === player?.teamId);
                                            return (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            {player?.number && <span style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>#{player.number}</span>}
                                                            <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{player?.name}</div>
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{team?.name}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#6b7280' }}>
                                                        {player?.position || '—'}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{s.goals}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{s.assists}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            {s.yellowCards > 0 && <span style={{ backgroundColor: '#FFD700', padding: '1px 5px', borderRadius: '2px', fontSize: '0.7rem' }}>{s.yellowCards}</span>}
                                                            {s.redCards > 0 && <span style={{ backgroundColor: '#FF4136', padding: '1px 5px', borderRadius: '2px', fontSize: '0.7rem', color: 'white' }}>{s.redCards}</span>}
                                                            {s.yellowCards === 0 && s.redCards === 0 && <span style={{ color: '#eee' }}>—</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <button className="text-danger" onClick={async () => {
                                                            try {
                                                                await statService.delete(s.id);
                                                                const { data: updatedStats } = await statService.getByMatch(selectedMatch.id);
                                                                setMatchStats(updatedStats);
                                                                toast.success('Stat removed');
                                                                fetchData();
                                                            } catch { toast.error('Error removing stat'); }
                                                        }}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {matchStats.length === 0 && (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No statistics recorded yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Locked Match Confirmation Modal ── */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', borderTop: '6px solid #EF4444' }}>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <h3 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                                    <Trash2 size={22} /> Permanently Delete Locked Match?
                                </h3>
                                <button onClick={() => setShowDeleteConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                    <XCircle size={22} />
                                </button>
                            </div>
                            <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
                                <p style={{ color: '#991b1b', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>⚠ This action is permanent and audited.</p>
                                <p style={{ color: '#991b1b', fontSize: '0.85rem' }}>All associated player statistics will be removed from the system.</p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                    Type <strong>DELETE</strong> to confirm:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder="TYPE DELETE HERE"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #EF4444', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" style={{ flex: 1, padding: '0.8rem' }}>Cancel</button>
                                <button onClick={confirmDeleteLockedMatch} className="btn-primary" style={{ flex: 1, padding: '0.8rem', backgroundColor: '#EF4444', border: 'none' }} disabled={deleteConfirmText !== 'DELETE'}>
                                    Confirm Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .match-card-admin { transition: all 0.2s ease; }
                .match-card-admin:hover { transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

                .btn-icon {
                    background: #f9fafb; border: 1px solid #eee; padding: 0.45rem;
                    border-radius: 8px; display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .btn-icon:hover { background: #f3f4f6; transform: translateY(-1px); }
                .btn-icon.primary:hover { color: var(--primary); border-color: var(--primary); background: rgba(6,78,59,0.06); }
                .btn-icon.danger:hover  { color: #EF4444; border-color: #EF4444; background: #fef2f2; }

                /* NEW Control Dashboard Styles */
                .match-controls-sidebar {
                    display: flex; flex-direction: column; gap: 0.75rem;
                    padding: 1.25rem 0 1.25rem 1rem; min-width: 150px;
                    border-left: 1px dashed #e5e7eb; margin-left: 0.5rem;
                    justify-content: center;
                }
                
                .status-rail {
                    display: flex; background: #f3f4f6; border-radius: 20px;
                    padding: 3px; gap: 2px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
                }
                .rail-btn {
                    flex: 1; border: none; background: transparent; padding: 6px;
                    border-radius: 17px; cursor: pointer; display: flex;
                    align-items: center; justify-content: center; transition: all 0.2s;
                    color: #9ca3af;
                }
                .rail-btn:hover { color: #4b5563; }
                .rail-btn.active { background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .rail-btn.active.upcoming { color: #2563EB; }
                .rail-btn.active.live     { color: #EF4444; }
                .rail-btn.active.finished { color: #10B981; }
                .rail-btn.active.locked   { color: #4b5563; }

                .dashboard-btn-group { display: flex; gap: 6px; }
                .dash-btn {
                    flex: 1; border: 1.5px solid #e5e7eb; background: #fff;
                    padding: 8px; border-radius: 10px; display: flex;
                    align-items: center; justify-content: center; gap: 6px;
                    font-size: 0.75rem; font-weight: 700; cursor: pointer;
                    transition: all 0.2s; color: #4b5563;
                }
                .dash-btn:hover { border-color: #d1d5db; background: #f9fafb; transform: translateY(-1px); }
                .dash-btn.primary { border-color: var(--primary); color: var(--primary); }
                .dash-btn.primary:hover { background: rgba(6,78,59,0.05); }
                .dash-btn.danger { border-color: #fecaca; color: #ef4444; }
                .dash-btn.danger:hover { background: #fef2f2; border-color: #ef4444; }

                /* Score stepper +/- buttons */
                .score-btn {
                    width: 26px; height: 26px; border-radius: 50%;
                    border: 1.5px solid #10B981; background: #fff;
                    color: #059669; font-size: 1rem; font-weight: 900;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; line-height: 1;
                    transition: background 0.15s, transform 0.1s;
                    padding: 0;
                }
                .score-btn:hover { background: #d1fae5; transform: scale(1.15); }
                .score-btn:active { transform: scale(0.95); }
                .score-btn-minus { border-color: #EF4444; color: #DC2626; }
                .score-btn-minus:hover { background: #fee2e2; }


                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
                    z-index: 2000; display: flex; justify-content: center;
                    align-items: center; padding: 1rem;
                }
                .modal-content {
                    background: white; width: 100%; border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden;
                }
                .modal-header {
                    padding: 1.5rem; border-bottom: 1px solid #f3f4f6;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .modal-form { padding: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
                .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--primary); }
                .form-group input, .form-group select {
                    padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem;
                }

                /* Table Zebra Striping */
                .stats-tbody tr:nth-child(even) { background-color: #fafafa; }
                .stats-tbody tr:hover { background-color: #f1f5f9; }
            `}</style>
        </div>
    );
};

export default MatchesCRUD;
