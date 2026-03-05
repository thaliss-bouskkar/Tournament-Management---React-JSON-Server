import React, { useState, useEffect } from 'react';
import { playerService, statService, matchService, teamService } from '../services/api';
import { Trophy, Star, AlertCircle, Loader2 } from 'lucide-react';
import PlayerDetailsModal from '../components/PlayerDetailsModal';
import { getAggregatedPlayerStats } from '../utils/tournamentEngine';
import imgfoot from "../components/foot.png";
const Stats = () => {
    const [stats, setStats] = useState([]);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statRes, playerRes, teamRes, matchRes] = await Promise.all([
                    statService.getAll(),
                    playerService.getAll(),
                    teamService.getAll(),
                    matchService.getAll()
                ]);
                setStats(statRes.data);
                setPlayers(playerRes.data);
                setTeams(teamRes.data);
                setMatches(matchRes.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getPlayerData = (playerId) => {
        const player = players.find(p => p.id === playerId);
        const team = teams.find(t => t.id === player?.teamId);
        return { player, team };
    };

    const handlePlayerClick = (p) => {
                                        const { player, team } = getPlayerData(p.id);

                                        // 👇 نجيبو aggregated stats لي محسوبين
                                        const aggregatedStats = activePlayers.find(ap => ap.id === p.id);

                                        setSelectedPlayer({
                                            player,
                                            team,
                                            stats: aggregatedStats
                                        });
                                    };

    // Aggregation logic using deterministic engine
    const activePlayers = getAggregatedPlayerStats(players, stats, matches, true);

    const topScorers = activePlayers
        .filter(p => p.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10);

    const topAssists = activePlayers
        .filter(p => p.assists > 0)
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 10);

    const disciplined = activePlayers
        .filter(p => p.yellowCards > 0 || p.redCards > 0)
        .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards))
        .slice(0, 10);

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <Loader2 className="spinner" size={40} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Calculating tournament records...</p>
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', borderLeft: '5px solid var(--accent)', paddingLeft: '1rem' }}>Tournament Statistics</h2>
                <p style={{ color: 'var(--text-muted)' }}>Top individual performers on the leaderboard.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* Top Scorers */}
                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: 'rgba(212, 175, 55, 0.05)', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Trophy color="var(--accent)" size={24} />
                        <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>Golden Boot</h3>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>PLAYER</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>GOALS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topScorers.map((p, idx) => {
                                    const { team } = getPlayerData(p.id);
                                    return (
                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer', borderBottom: '1px solid #f9fafb' }} className="row-hover">
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: idx < 3 ? 'var(--accent)' : 'var(--text-muted)', width: '20px' }}>{idx + 1}</span>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                        <img
                                                            src={p.imageUrl || imgfoot}
                                                            alt=""
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.src = imgfoot; }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{p.goals}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {topScorers.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No goals recorded yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top Assists */}
                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: 'rgba(6, 78, 59, 0.05)', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Star color="var(--primary)" size={24} />
                        <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>Playmakers</h3>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>PLAYER</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>ASSISTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topAssists.map((p, idx) => {
                                    const { team } = getPlayerData(p.id);
                                    return (
                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer', borderBottom: '1px solid #f9fafb' }} className="row-hover">
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', opacity: 0.6, width: '20px' }}>{idx + 1}</span>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                        <img
                                                            src={p.imageUrl || imgfoot}
                                                            alt=""
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.src = imgfoot; }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                <span style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{p.assists}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {topAssists.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No assists recorded yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Discipline */}
                <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle color="#EF4444" size={24} />
                        <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.2rem' }}>Fair Play & Cards</h3>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    <th style={{ padding: '0.75rem 0.5rem' }}>PLAYER</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>YC</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>RC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {disciplined.map((p) => {
                                    const { team } = getPlayerData(p.id);
                                    return (
                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} style={{ cursor: 'pointer', borderBottom: '1px solid #f9fafb' }} className="row-hover">
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                        <img
                                                            src={p.imageUrl || imgfoot}
                                                            alt=""
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.src = imgfoot; }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: '#FFD700', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>{p.yellowCards}</span>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: '#FF4136', padding: '2px 8px', borderRadius: '4px', color: 'white', fontSize: '0.85rem', fontWeight: 'bold' }}>{p.redCards}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {disciplined.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Clean tournament so far!</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {selectedPlayer && (
                <PlayerDetailsModal
                player={selectedPlayer?.player}
                team={selectedPlayer?.team}
                stats={selectedPlayer?.stats}
                onClose={() => setSelectedPlayer(null)}
            />
            )}

            <style>
                {`
                .row-hover:hover {
                    background-color: #f8fafc !important;
                }
                `}
            </style>
        </div>
    );
};

export default Stats;
