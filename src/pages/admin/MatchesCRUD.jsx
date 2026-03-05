import React, { useState, useEffect } from 'react';
import { matchService, teamService, groupService, playerService, statService, logService } from '../../services/api';
import { cascadeService } from '../../services/cascadeService';
import {
    Plus, Edit, Trash2, Calendar, Clock, Trophy, CheckCircle,
    XCircle, Users, BarChart, Search, ChevronRight, AlertCircle, Loader2, Filter,
    AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import { isLocked, validateScheduling } from '../../utils/tournamentEngine';

const MatchesCRUD = () => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, pending, finished, locked

    // Modal states
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const { user } = useAuth();
    // Case-insensitive check and ensuring it defaults correctly if needed for development
    const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin';

    // Form states - Matches
    const [matchForm, setMatchForm] = useState({
        groupId: '', teamAId: '', teamBId: '', date: '', startTime: '', endTime: '', status: 'scheduled', scoreA: 0, scoreB: 0
    });

    // Form states - Stats
    const [statForm, setStatForm] = useState({
        playerId: '', goals: 0, assists: 0, yellowCards: 0, redCards: 0
    });
    const [matchStats, setMatchStats] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig] = useState({ key: 'date', direction: 'asc' });

    useEffect(() => {
        fetchData();
    }, []);

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

        // Use engine for validation
        const { isValid, errors } = validateScheduling(matches, matchForm);
        if (!isValid) {
            return errors.forEach(err => toast.error(err));
        }

        try {
            await matchService.create(matchForm);
            toast.success('Match scheduled successfully');
            setShowScheduleModal(false);
            setMatchForm({ groupId: '', teamAId: '', teamBId: '', date: '', startTime: '', endTime: '', status: 'scheduled', scoreA: 0, scoreB: 0 });
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

        try {
            const existingStat = matchStats.find(s => s.playerId === statForm.playerId);
            const player = players.find(p => p.id === statForm.playerId);

            if (existingStat) {
                await statService.update(existingStat.id, {
                    ...statForm,
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

    const toggleMatchStatus = async (match) => {
        if (isLocked(match)) return toast.error('Match is locked');

        let newStatus;
        if (match.status === 'scheduled') newStatus = 'pending';
        else if (match.status === 'pending') newStatus = 'finished';
        else newStatus = 'pending';

        try {
            await matchService.update(match.id, { status: newStatus });
            toast.success(`Match marked as ${newStatus}`);
            fetchData();
        } catch {
            toast.error('Error updating status');
        }
    };

    const handleLockMatch = async (match) => {
        if (!window.confirm('CRITICAL: Locking this match will prevent ANY further edits to scores or statistics. Proceed?')) return;
        try {
            await matchService.update(match.id, { status: 'locked' });
            toast.success('Match repository LOCKED');
            fetchData();
        } catch {
            toast.error('Error locking match');
        }
    };

    const handleUpdateScore = async (matchId, field, value) => {
        const match = matches.find(m => m.id === matchId);
        if (isLocked(match)) return toast.error('Match is locked');

        try {
            await matchService.update(matchId, { [field]: Number(value), status: 'finished' });
            fetchData();
        } catch {
            toast.error('Error updating score');
        }
    };

    const handleDeleteMatch = async (id) => {
        const match = matches.find(m => m.id === id);
        if (!match) return;

        if (isLocked(match)) {
            if (!isSuperAdmin) {
                return toast.error('Access Denied: Only Super Admins can delete locked matches');
            }
            setSelectedMatch(match);
            setShowDeleteConfirm(true);
            setDeleteConfirmText('');
            return;
        }

        if (!window.confirm('Delete this match and all related statistics? This action is permanent.')) return;

        try {
            // Optimistic UI Update: Remove from local state immediately
            setMatches(prev => prev.filter(m => m.id !== id));
            await cascadeService.deleteMatch(id);
            toast.success('Match deleted');
            fetchData(); // Refresh to update teams/other stats from server
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete match');
            fetchData(); // Sync back if optimistic update failed
        }
    };

    const confirmDeleteLockedMatch = async () => {
        if (deleteConfirmText !== 'DELETE') {
            return toast.error('Please type DELETE to confirm this critical action');
        }

        const matchToLog = selectedMatch;
        try {
            const matchLabel = `${matchToLog.date} | ${teams.find(t => t.id === matchToLog.teamAId)?.name || 'Team A'} vs ${teams.find(t => t.id === matchToLog.teamBId)?.name || 'Team B'}`;

            // Optimistic UI Update
            setMatches(prev => prev.filter(m => m.id !== matchToLog.id));
            setShowDeleteConfirm(false);

            await cascadeService.deleteMatch(matchToLog.id);
            toast.success('Locked match permanently deleted');
            fetchData(); // Refresh everything to ensure consistency

            // Log the action (Non-blocking)
            logService.create({
                action: 'DELETE_LOCKED_MATCH',
                matchId: matchToLog.id,
                details: `Deleted locked match: ${matchLabel}`,
                admin: user?.name || 'Unknown',
                email: user?.email || 'Unknown'
            }).catch(err => console.error("Logging failed:", err));

        } catch {
            toast.error('Critical failure: Could not delete locked match records');
            fetchData();
        }
    };

    const filteredMatches = matches
        .filter(m => {
            if (filterStatus !== 'all' && m.status !== filterStatus) return false;

            const teamA = teams.find(t => t.id === m.teamAId);
            const teamB = teams.find(t => t.id === m.teamBId);
            const group = groups.find(g => g.id === m.groupId);
            const search = searchTerm.toLowerCase();
            return (teamA?.name || '').toLowerCase().includes(search) ||
                (teamB?.name || '').toLowerCase().includes(search) ||
                (group?.name || '').toLowerCase().includes(search) ||
                m.date.includes(search);
        })
        .sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={40} /></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>Tournament Matches</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Deterministic Match Engine active.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                        {['all', 'scheduled', 'pending', 'finished', 'locked'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    backgroundColor: filterStatus === s ? 'white' : 'transparent',
                                    color: filterStatus === s ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: filterStatus === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search matches..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd', width: '220px' }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => setShowScheduleModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 1.25rem' }}>
                        <Plus size={20} /> Schedule Match
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                {filteredMatches.length > 0 ? filteredMatches.map(match => {
                    const group = groups.find(g => g.id === match.groupId);
                    const teamA = teams.find(t => t.id === match.teamAId);
                    const teamB = teams.find(t => t.id === match.teamBId);
                    const isFinished = match.status === 'finished' || match.status === 'locked';
                    const locked = isLocked(match);

                    const statsA = matchStats.filter(s => s.matchId === match.id && s.teamId === match.teamAId).reduce((sum, s) => sum + (s.goals || 0), 0);
                    const statsB = matchStats.filter(s => s.matchId === match.id && s.teamId === match.teamBId).reduce((sum, s) => sum + (s.goals || 0), 0);
                    const scoreMismatch = isFinished && (statsA !== match.scoreA || statsB !== match.scoreB);

                    const getStatusColor = () => {
                        if (locked) return '#2D3748'; // Dark gray for locked
                        if (match.status === 'finished') return '#10B981';
                        if (match.status === 'pending') return '#f97316';
                        return '#3B82F6'; // Blue for scheduled
                    };

                    return (
                        <div key={match.id} className="card match-card-admin" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', opacity: locked ? 0.8 : 1 }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getStatusColor() }}></div>

                            <div style={{ minWidth: '140px', padding: '1.25rem 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    <Calendar size={14} /> {match.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    <Clock size={14} /> {match.startTime}
                                </div>
                                <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '0.75rem', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Group {group?.name} • {match.status}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, padding: '0 1rem' }}>
                                <div style={{ textAlign: 'right', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{teamA?.name}</span>
                                    <img src={teamA?.logo || '/teamlogo.png'} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        value={match.scoreA}
                                        disabled={locked}
                                        onChange={(e) => handleUpdateScore(match.id, 'scoreA', e.target.value)}
                                        style={{ width: '45px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: locked ? '#f9fafb' : 'white' }}
                                    />
                                    <span style={{ color: '#ccc', fontWeight: 'bold' }}>:</span>
                                    <input
                                        type="number"
                                        value={match.scoreB}
                                        disabled={locked}
                                        onChange={(e) => handleUpdateScore(match.id, 'scoreB', e.target.value)}
                                        style={{ width: '45px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontWeight: 'bold', backgroundColor: locked ? '#f9fafb' : 'white' }}
                                    />
                                </div>

                                <div style={{ textAlign: 'left', flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <img src={teamB?.logo || '/teamlogo.png'} style={{ width: '32px', height: '32px', objectFit: 'contain' }} alt="" />
                                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{teamB?.name}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem 0' }}>
                                {scoreMismatch && (
                                    <div title="Score summary mismatch with player goals!" style={{ display: 'flex', alignItems: 'center', color: '#EF4444' }}>
                                        <AlertCircle size={20} />
                                    </div>
                                )}
                                {locked && (
                                    <div title="Match Repository LOCKED" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', padding: '0.5rem' }}>
                                        <Trophy size={20} />
                                    </div>
                                )}

                                {locked && isSuperAdmin && (
                                    <button
                                        className="btn-icon danger"
                                        onClick={() => handleDeleteMatch(match.id)}
                                        title="SUPER ADMIN: Delete Locked Match"
                                        style={{
                                            color: '#EF4444',
                                            border: '1px solid #EF4444',
                                            backgroundColor: '#fef2f2',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            padding: '0.25rem 0.5rem',
                                            width: 'auto',
                                            height: 'auto',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Trash2 size={14} /> Remove Locked
                                    </button>
                                )}
                                {!locked && (
                                    <>
                                        <button
                                            className="btn-icon success"
                                            onClick={() => toggleMatchStatus(match)}
                                            title="Advance Status"
                                            style={{ color: getStatusColor() }}
                                        >
                                            <CheckCircle size={22} />
                                        </button>
                                        <button
                                            className="btn-icon primary"
                                            onClick={() => handleLockMatch(match)}
                                            title="LOCK Match (Finalize)"
                                            style={{ color: '#2D3748' }}
                                        >
                                            <Trophy size={22} />
                                        </button>
                                        <button className="btn-icon primary" onClick={() => openStatsModal(match)} title="Match Statistics">
                                            <BarChart size={22} />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => handleDeleteMatch(match.id)} title="Delete Match">
                                            <Trash2 size={22} />
                                        </button>
                                    </>
                                )}
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

            {/* Schedule Modal */}
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
                                <label>Time</label>
                                <input type="time" required value={matchForm.startTime} onChange={e => setMatchForm({ ...matchForm, startTime: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', width: '100%', padding: '0.8rem' }}>Create Match Schedule</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {showStatsModal && selectedMatch && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0 }}>Game Statistics</h3>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {teams.find(t => t.id === selectedMatch.teamAId)?.name} vs {teams.find(t => t.id === selectedMatch.teamBId)?.name}
                                </p>
                            </div>
                            <button onClick={() => setShowStatsModal(false)}><XCircle size={24} /></button>
                        </div>

                        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
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
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>G</label>
                                    <input type="number" min="0" value={statForm.goals} onChange={e => setStatForm({ ...statForm, goals: parseInt(e.target.value) || 0 })} style={{ padding: '0.5rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>A</label>
                                    <input type="number" min="0" value={statForm.assists} onChange={e => setStatForm({ ...statForm, assists: parseInt(e.target.value) || 0 })} style={{ padding: '0.5rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>YC</label>
                                    <input type="number" min="0" value={statForm.yellowCards} onChange={e => setStatForm({ ...statForm, yellowCards: parseInt(e.target.value) || 0 })} style={{ padding: '0.5rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>RC</label>
                                    <input type="number" min="0" value={statForm.redCards} onChange={e => setStatForm({ ...statForm, redCards: parseInt(e.target.value) || 0 })} style={{ padding: '0.5rem' }} />
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '0.6rem' }}><Plus size={22} /></button>
                            </form>

                            <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Player</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Goals</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Assists</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Cards</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matchStats.map(s => {
                                            const player = players.find(p => p.id === s.playerId);
                                            const team = teams.find(t => t.id === player?.teamId);
                                            return (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{player?.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{team?.name}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{s.goals}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{s.assists}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            {s.yellowCards > 0 && <span style={{ backgroundColor: '#FFD700', padding: '1px 5px', borderRadius: '2px', fontSize: '0.7rem' }}>{s.yellowCards}</span>}
                                                            {s.redCards > 0 && <span style={{ backgroundColor: '#FF4136', padding: '1px 5px', borderRadius: '2px', fontSize: '0.7rem', color: 'white' }}>{s.redCards}</span>}
                                                            {s.yellowCards === 0 && s.redCards === 0 && <span style={{ color: '#eee' }}>-</span>}
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
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No statistics recorded for this match yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                .match-card-admin {
                    transition: all 0.2s ease;
                }
                .match-card-admin:hover {
                    transform: translateX(4px);
                    box-shadow: var(--shadow);
                }
                .btn-icon {
                    background: #f9fafb;
                    border: 1px solid #eee;
                    padding: 0.5rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon:hover {
                    background: #f3f4f6;
                    transform: translateY(-2px);
                }
                .btn-icon.success:hover { color: #10B981; border-color: #10B981; background: #ecfdf5; }
                .btn-icon.primary:hover { color: var(--primary); border-color: var(--primary); background: rgba(6, 78, 59, 0.05); }
                .btn-icon.danger:hover { color: #EF4444; border-color: #EF4444; background: #fef2f2; }
                
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    z-index: 2000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 1rem;
                }
                .modal-content {
                    background: white;
                    width: 100%;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #f3f4f6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-form {
                    padding: 1.5rem;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                    marginBottom: 1rem;
                }
                .form-group label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--primary);
                }
                .form-group input, .form-group select {
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                `}
            </style>
            {/* Delete Locked Match Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px', borderTop: '6px solid #EF4444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Trash2 size={24} /> Are you sure you want to permanently delete this locked match?
                            </h3>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fee2e2' }}>
                            <p style={{ color: '#991b1b', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                WARNING: This action is permanent and will be audited.
                            </p>
                            <p style={{ color: '#991b1b', fontSize: '0.85rem' }}>
                                This action is permanent and will remove all associated player goals and statistics from the system for this game.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                                To confirm deletion of this finalized match, please type <strong>DELETE</strong> below:
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="TYPE DELETE HERE"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #EF4444', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-secondary"
                                style={{ flex: 1, padding: '0.8rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteLockedMatch}
                                className="btn-primary"
                                style={{ flex: 1, padding: '0.8rem', backgroundColor: '#EF4444', border: 'none' }}
                                disabled={deleteConfirmText !== 'DELETE'}
                            >
                                Confirm Permanent Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchesCRUD;
