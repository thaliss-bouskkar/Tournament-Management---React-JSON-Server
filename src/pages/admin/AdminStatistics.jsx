import React, { useState, useEffect } from 'react';
import { statService, playerService, teamService, matchService } from '../../services/api';
import { BarChart2, TrendingUp, Award, AlertCircle, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAggregatedPlayerStats } from '../../utils/tournamentEngine';
import footImg from '../../components/foot.png';
const AdminStatistics = () => {
    const [stats, setStats] = useState([]);
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

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
        } catch {
            toast.error('Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="spinner" size={40} color="var(--primary)" />
        </div>
    );

    // Aggregate stats per player using deterministic engine
    const aggregatedPlayers = getAggregatedPlayerStats(players, stats, matches, true).map(p => ({
        ...p,
        teamName: teams.find(t => t.id === p.teamId)?.name || 'Unknown'
    }));

    const topScorers = [...aggregatedPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);
    const topAssists = [...aggregatedPlayers].sort((a, b) => b.assists - a.assists).slice(0, 10);

    return (
        <div>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Tournament Statistics (Admin)</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Top Scorers */}
                <div className="card">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                        <Award size={20} /> Top Scorers
                    </h4>
                    <table style={{ width: '100%', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '0.5rem' }}>Player</th>
                                <th style={{ padding: '0.5rem' }}>Team</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Goals</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topScorers.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                <img
                                                    src={p.imageUrl || footImg}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = footImg; }}
                                                />
                                            </div>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{p.teamName}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{p.goals}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Top Assists */}
                <div className="card">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                        <TrendingUp size={20} /> Top Assists
                    </h4>
                    <table style={{ width: '100%', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '0.5rem' }}>Player</th>
                                <th style={{ padding: '0.5rem' }}>Team</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Assists</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topAssists.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                <img
                                                    src={p.imageUrl || footImg}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = footImg; }}
                                                />
                                            </div>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{p.teamName}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{p.assists}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Disciplinary Overview */}
            <div className="card">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#EF4444' }}>
                    <AlertCircle size={20} /> Disciplinary Record
                </h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '0.5rem' }}>Player</th>
                                <th style={{ padding: '0.5rem' }}>Team</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Yellow Cards</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>Red Cards</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregatedPlayers.filter(p => p.yellowCards > 0 || p.redCards > 0).map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                <img
                                                    src={p.imageUrl || footImg}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.src = footImg; }}
                                                />
                                            </div>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{p.teamName}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: '#FFD700', padding: '2px 8px', borderRadius: '4px' }}>{p.yellowCards}</span>
                                    </td>
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: '#FF4136', padding: '2px 8px', borderRadius: '4px', color: 'white' }}>{p.redCards}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminStatistics;
