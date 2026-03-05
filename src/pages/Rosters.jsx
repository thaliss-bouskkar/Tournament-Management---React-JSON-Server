import React, { useState, useEffect } from 'react';
import { teamService, playerService, groupService, statService } from '../services/api';
import { Users, Trophy, Loader2 } from 'lucide-react';
import PlayerDetailsModal from '../components/PlayerDetailsModal';
import { ASSETS } from '../constants/assets';

const Rosters = () => {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, pRes, gRes, sRes] = await Promise.all([
                    teamService.getAll(),
                    playerService.getAll(),
                    groupService.getAll(),
                    statService.getAll()
                ]);
                setTeams(tRes.data);
                setPlayers(pRes.data);
                setGroups(gRes.data);
                setStats(sRes.data);
            } catch (error) {
                console.error("Error fetching rosters:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <Loader2 className="spinner" size={40} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading league rosters...</p>
        </div>
    );

    // Group teams by group
    const groupsWithTeams = groups.map(g => ({
        ...g,
        teams: teams.filter(t => t.groupId === g.id)
    }));

    const handlePlayerClick = (player) => {
        const team = teams.find(t => t.id === player.teamId);
        // Find existing global stats for the player (matchId is null)
        const playerStats = stats.find(s => s.playerId === player.id && s.matchId === null);
        setSelectedPlayer({ player, team, stats: playerStats });
    };

    return (
        <div>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', borderLeft: '5px solid var(--accent)', paddingLeft: '1rem' }}>Teams & Rosters</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Select a player to view their detailed performance statistics.</p>

            {groupsWithTeams.map(group => (
                <div key={group.id} style={{ marginBottom: '3rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                        <Trophy size={20} /> Group {group.name}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {group.teams.map(team => {
                            const teamPlayers = players.filter(p => p.teamId === team.id);
                            return (
                                <div key={team.id} className="card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            <img
                                                src={team.logo || 'https://via.placeholder.com/40'}
                                                alt=""
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>{team.name}</h4>
                                    </div>

                                    <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #f3f4f6', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '0.75rem 0.5rem' }}>#</th>
                                                <th style={{ padding: '0.75rem 0.5rem' }}>Player</th>
                                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Pos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teamPlayers.sort((a, b) => parseInt(a.number || 0) - parseInt(b.number || 0)).map(p => (
                                                <tr
                                                    key={p.id}
                                                    onClick={() => handlePlayerClick(p)}
                                                    style={{ cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid #f9fafb' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>{p.number || '-'}</td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                                <img
                                                                    src={p.imageUrl || ASSETS.DEFAULT_PLAYER_IMAGE}
                                                                    alt=""
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    onError={(e) => { e.target.src = ASSETS.DEFAULT_PLAYER_IMAGE; }}
                                                                />
                                                            </div>
                                                            <span style={{ fontWeight: '500' }}>{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{p.position || '-'}</td>
                                                </tr>
                                            ))}
                                            {teamPlayers.length === 0 && (
                                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No players listed.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {selectedPlayer && (
                <PlayerDetailsModal
                    player={selectedPlayer.player}
                    team={selectedPlayer.team}
                    stats={selectedPlayer.stats}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
};

export default Rosters;
