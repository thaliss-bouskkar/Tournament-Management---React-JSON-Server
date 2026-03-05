import React, { useState, useEffect, useRef } from 'react';
import { teamService, groupService, playerService, statService, matchService } from '../../services/api';
import { cascadeService } from '../../services/cascadeService';
import {
    Plus, Edit, Trash2, Save, X, Loader2, UserPlus,
    ChevronDown, ChevronUp, User, BarChart, Search, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlayerDetailsModal from '../../components/PlayerDetailsModal';
import { getAggregatedPlayerStats } from '../../utils/tournamentEngine';

const TeamsCRUD = () => {
    const [teams, setTeams] = useState([]);
    const [groups, setGroups] = useState([]);
    const [players, setPlayers] = useState([]);
    const [statistics, setStatistics] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

    // UI State
    const [expandedTeams, setExpandedTeams] = useState({});
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    // Form States
    const [teamForm, setTeamForm] = useState({ name: '', groupId: '', logo: '' });
    const [editTeamData, setEditTeamData] = useState({ name: '', groupId: '', logo: '' });
    const [playerForm, setPlayerForm] = useState({ name: '', number: '', position: '' });
    const [editPlayerData, setEditPlayerData] = useState({ name: '', number: '', position: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tRes, gRes, pRes, sRes, mRes] = await Promise.all([
                teamService.getAll(),
                groupService.getAll(),
                playerService.getAll(),
                statService.getAll(),
                matchService.getAll()
            ]);
            setTeams(tRes.data);
            setGroups(gRes.data);
            setPlayers(pRes.data);
            setStatistics(sRes.data);
            setMatches(mRes.data);
        } catch {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const toggleTeam = (id) => {
        setExpandedTeams(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleFileUpload = (e, target) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) return toast.error('File too large (max 1MB)');

        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'create') setTeamForm({ ...teamForm, logo: reader.result });
            else setEditTeamData({ ...editTeamData, logo: reader.result });
            toast.success('Logo uploaded');
        };
        reader.readAsDataURL(file);
    };

    // --- Team Actions ---
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!teamForm.name || !teamForm.groupId) return toast.error('Name and Group are required');

        // Data Integrity: Check for duplicate team name
        const isDuplicate = teams.some(t => t.name.toLowerCase() === teamForm.name.toLowerCase());
        if (isDuplicate) return toast.error('A team with this name already exists');

        setSubmitting(true);
        try {
            const { data } = await teamService.create(teamForm);
            toast.success('Team created! Now add players.');
            setTeamForm({ name: '', groupId: '', logo: '' });
            setExpandedTeams(prev => ({ ...prev, [data.id]: true }));
            fetchData();
        } catch {
            toast.error('Error creating team');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTeam = async (id) => {
        // Data Integrity: Check for duplicate team name excluding self
        const isDuplicate = teams.some(t => t.id !== id && t.name.toLowerCase() === editTeamData.name.toLowerCase());
        if (isDuplicate) return toast.error('A team with this name already exists');

        try {
            await teamService.update(id, editTeamData);
            toast.success('Team updated');
            setEditingTeamId(null);
            fetchData();
        } catch {
            toast.error('Error updating team');
        }
    };

    const handleDeleteTeam = async (id) => {
        const team = teams.find(t => t.id === id);
        if (!window.confirm(`CRITICAL: Deleting team "${team?.name}" will also delete:\n- ALL players in this team\n- ALL matches involving this team\n- ALL related statistics\n\nThis action cannot be undone. Proceed?`)) return;

        // Optimistic UI Update
        const originalTeams = [...teams];
        setTeams(prev => prev.filter(t => t.id !== id));

        try {
            await cascadeService.deleteTeam(id);
            toast.success('Team and all related data purged');
        } catch (e) {
            console.error(e);
            toast.error('Error during team purge');
            setTeams(originalTeams); // Rollback
        }
    };

    // --- Player Actions ---
    const handleAddPlayer = async (teamId) => {
        if (!playerForm.name) return toast.error('Player name is required');

        // Data Integrity: Check for duplicate player name or number in the same team
        const teamPlayers = players.filter(p => p.teamId === teamId);
        const nameExists = teamPlayers.some(p => p.name.toLowerCase() === playerForm.name.toLowerCase());
        const numberExists = playerForm.number && teamPlayers.some(p => p.number === playerForm.number);

        if (nameExists) return toast.error('A player with this name already exists in this team');
        if (numberExists) return toast.error(`A player with number ${playerForm.number} already exists in this team`);

        try {
            await playerService.create({ ...playerForm, teamId });
            toast.success('Player added successfully');
            setPlayerForm({ name: '', number: '', position: '',imageUrl:null });
            fetchData();
        } catch {
            toast.error('Error adding player');
        }
    };

    const handleUpdatePlayer = async (id) => {
        try {
            await playerService.update(id, editPlayerData);
            toast.success('Player updated');
            setEditingPlayerId(null);
            fetchData();
        } catch {
            toast.error('Error updating player');
        }
    };

    const handleDeletePlayer = async (id) => {
        if (!window.confirm('Delete player and their match statistics?')) return;
        try {
            await playerService.delete(id);
            const playerStats = statistics.filter(s => s.playerId === id);
            await Promise.all(playerStats.map(s => statService.delete(s.id)));
            toast.success('Player and associated stats deleted');
            fetchData();
        } catch {
            toast.error('Error deleting player');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={40} /></div>;

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Aggregated data for all players
    const playersWithStats = getAggregatedPlayerStats(players, statistics, matches);

    return (
        <div>
            {/* ... rest of UI ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary)' }}>Teams & Players</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }}
                        />
                    </div>
                </div>
            </div>

            {/* Create Team Form */}
            <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid var(--accent)' }}>
                <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} className="text-secondary" /> Add New Team
                </h4>
                <form onSubmit={handleCreateTeam} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Team Name</label>
                        <input type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem' }} placeholder="FC Barcelona" />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Group</label>
                        <select value={teamForm.groupId} onChange={e => setTeamForm({ ...teamForm, groupId: e.target.value })} style={{ width: '100%', padding: '0.6rem' }}>
                            <option value="">Select Group</option>
                            {groups.map(g => <option key={g.id} value={g.id}>Group {g.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Logo</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={teamForm.logo?.startsWith('data:image') ? 'Local file uploaded' : teamForm.logo}
                                onChange={e => setTeamForm({ ...teamForm, logo: e.target.value })}
                                style={{ flex: 1, padding: '0.6rem', backgroundColor: teamForm.logo?.startsWith('data:image') ? '#f3f4f6' : 'white' }}
                                placeholder="URL or upload"
                                readOnly={teamForm.logo?.startsWith('data:image')}
                            />
                            <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'create')} accept="image/*" style={{ display: 'none' }} />
                            <button type="button" onClick={() => fileInputRef.current.click()} className="btn-secondary" style={{ padding: '0.6rem' }}><Upload size={18} /></button>
                            {teamForm.logo?.startsWith('data:image') && <button type="button" onClick={() => setTeamForm({ ...teamForm, logo: '' })} className="btn-secondary" style={{ color: '#EF4444' }}><X size={18} /></button>}
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ whiteSpace: 'nowrap' }}>
                        {submitting ? <Loader2 className="spinner" size={18} /> : <Plus size={18} />} Create Team
                    </button>
                </form>
            </div>

            {/* Teams List (Expandable) */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {filteredTeams.length > 0 ? filteredTeams.map(team => {
                    const isExpanded = expandedTeams[team.id];
                    const teamPlayers = players.filter(p => p.teamId === team.id);
                    const group = groups.find(g => g.id === team.groupId);

                    return (
                        <div key={team.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `6px solid ${isExpanded ? 'var(--accent)' : 'transparent'}`, transition: 'all 0.3s ease' }}>
                            {/* Team Header */}
                            <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isExpanded ? 'rgba(212, 175, 55, 0.04)' : 'white' }} onClick={() => toggleTeam(team.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f9fafb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', border: '1px solid #eee' }}>
                                        <img src={team.logo || '/teamlogo.png'} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div>
                                        {editingTeamId === team.id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editTeamData.name}
                                                    onChange={e => setEditTeamData({ ...editTeamData, name: e.target.value })}
                                                    style={{ padding: '0.2rem 0.5rem', fontWeight: 'bold' }}
                                                />
                                                <select value={editTeamData.groupId} onChange={e => setEditTeamData({ ...editTeamData, groupId: e.target.value })} style={{ padding: '0.2rem' }}>
                                                    {groups.map(g => <option key={g.id} value={g.id}>Group {g.name}</option>)}
                                                </select>
                                                <input type="file" ref={editFileInputRef} onChange={e => handleFileUpload(e, 'edit')} accept="image/*" style={{ display: 'none' }} />
                                                <button onClick={() => editFileInputRef.current.click()} size="small" style={{ color: 'var(--text-muted)' }}><Upload size={14} /></button>
                                            </div>
                                        ) : (
                                            <h4 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {team.name}
                                                <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(6, 78, 59, 0.1)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Group {group?.name}</span>
                                            </h4>
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{teamPlayers.length} Players Registered</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }} onClick={e => e.stopPropagation()}>
                                        {editingTeamId === team.id ? (
                                            <>
                                                <button onClick={() => handleUpdateTeam(team.id)} style={{ color: '#10B981' }} title="Save"><Save size={20} /></button>
                                                <button onClick={() => setEditingTeamId(null)} style={{ color: '#EF4444' }} title="Cancel"><X size={20} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditingTeamId(team.id); setEditTeamData(team); }} style={{ color: 'var(--primary)' }} title="Edit Team"><Edit size={20} /></button>
                                                <button onClick={() => handleDeleteTeam(team.id)} style={{ color: '#EF4444' }} title="Delete Team"><Trash2 size={20} /></button>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ color: isExpanded ? 'var(--accent)' : 'var(--text-muted)' }}>
                                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </div>
                            </div>

                            {/* Team Details (Players Table) */}
                            {isExpanded && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid #f3f4f6', backgroundColor: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}><User size={18} color="var(--accent)" /> Roster & Career Stats</h5>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click a player to view full card.</p>
                                    </div>

                                    <div style={{ overflowX: 'auto', marginBottom: '2rem', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', backgroundColor: '#f9fafb', borderBottom: '2px solid #f3f4f6' }}>
                                                    <th style={{ padding: '1rem' }}>#</th>
                                                    <th style={{ padding: '1rem' }}>Player Name</th>
                                                    <th style={{ padding: '1rem' }}>Pos</th>
                                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Goals</th>
                                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Assts</th>
                                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Cards</th>
                                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamPlayers.map(player => {
                                                    const playerStats = playersWithStats.find(p => p.id === player.id) || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
                                                    const isEditingP = editingPlayerId === player.id;

                                                    return (
                                                        <tr key={player.id} className="player-row" style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => setSelectedPlayer({ player, team, stats: playerStats })}>
                                                            <td style={{ padding: '1rem' }} onClick={e => e.stopPropagation()}>
                                                                {isEditingP ? <input type="number" value={editPlayerData.number} onChange={e => setEditPlayerData({ ...editPlayerData, number: e.target.value })} style={{ width: '45px', padding: '0.2rem' }} /> : player.number}
                                                            </td>
                                                            <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }} onClick={e => e.stopPropagation()}>
                                                                {isEditingP ? <input type="text" value={editPlayerData.name} onChange={e => setEditPlayerData({ ...editPlayerData, name: e.target.value })} style={{ padding: '0.2rem' }} /> : player.name}
                                                            </td>
                                                            <td style={{ padding: '1rem' }} onClick={e => e.stopPropagation()}>
                                                                {isEditingP ? <input type="text" value={editPlayerData.position} onChange={e => setEditPlayerData({ ...editPlayerData, position: e.target.value })} style={{ width: '50px', padding: '0.2rem' }} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{player.position}</span>}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <strong>{playerStats.goals}</strong>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                {playerStats.assists}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                    {playerStats.yellowCards > 0 && <span style={{ backgroundColor: '#FFD700', width: '18px', height: '24px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>{playerStats.yellowCards}</span>}
                                                                    {playerStats.redCards > 0 && <span style={{ backgroundColor: '#FF4136', width: '18px', height: '24px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'white' }}>{playerStats.redCards}</span>}
                                                                    {playerStats.yellowCards === 0 && playerStats.redCards === 0 && <span style={{ color: '#eee' }}>-</span>}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                                    {isEditingP ? (
                                                                        <>
                                                                            <button onClick={() => handleUpdatePlayer(player.id)} style={{ color: '#10B981' }}><Save size={18} /></button>
                                                                            <button onClick={() => setEditingPlayerId(null)} style={{ color: '#EF4444' }}><X size={18} /></button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button onClick={() => { setEditingPlayerId(player.id); setEditPlayerData(player); }} style={{ color: 'var(--primary)' }} title="Edit Player Info"><Edit size={18} /></button>
                                                                            <button onClick={() => handleDeletePlayer(player.id)} style={{ color: '#EF4444' }} title="Delete Player"><Trash2 size={18} /></button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {teamPlayers.length === 0 && (
                                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No players in this team. Add some below.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Add Player to Team */}
                                    <div style={{ backgroundColor: 'rgba(6, 78, 59, 0.03)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px dashed rgba(6, 78, 59, 0.2)' }}>
                                    <h6 style={{ marginBottom: '1rem', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <UserPlus size={16} /> Add Registered Player
                                    </h6>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr)) auto', gap: '1rem', alignItems: 'end' }}>
                                        
                                        {/* Player Name */}
                                        <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Player Name</label>
                                        <input type="text" placeholder="e.g. Lionel Messi" value={playerForm.name} onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                        </div>

                                        {/* Player Number */}
                                        <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Number</label>
                                        <input type="number" placeholder="10" value={playerForm.number} onChange={e => setPlayerForm({ ...playerForm, number: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                        </div>

                                        {/* Player Position */}
                                        <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Position</label>
                                        <input type="text" placeholder="FW, MF, DF, GK" value={playerForm.position} onChange={e => setPlayerForm({ ...playerForm, position: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                        </div>

                                        {/* Player Image */}
                                        <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>Player Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setPlayerForm({ ...playerForm, imageUrl: reader.result }); // هذا Base64
                                            };
                                            reader.readAsDataURL(file);
                                            }}
                                            style={{ width: '100%', padding: '0.5rem' }}
                                        />
                                        </div>

                                        {/* Submit Button */}
                                        <button className="btn-primary" style={{ padding: '0.5rem 1.5rem', height: '38px' }} onClick={() => handleAddPlayer(team.id)}>
                                        <Plus size={18} /> Register Player
                                        </button>

                                    </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: '#fff', borderRadius: 'var(--radius)', border: '1px dashed #ddd' }}>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>No teams found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Player Details Modal */}
            <PlayerDetailsModal
                player={selectedPlayer?.player}
                team={selectedPlayer?.team}
                stats={selectedPlayer?.stats}
                onClose={() => setSelectedPlayer(null)}
            />

            <style>
                {`
                .player-row:hover {
                    background-color: #fcfcfc;
                }
                .player-row:hover td {
                    color: var(--accent);
                }
                `}
            </style>
        </div>
    );
};

export default TeamsCRUD;
