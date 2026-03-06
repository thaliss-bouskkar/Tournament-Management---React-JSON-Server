import React, { useState, useEffect } from 'react';
import { matchService, teamService, groupService, playerService } from '../services/api';
import { Calendar, Trophy, ChevronRight, Timer, AlertCircle, Loader2, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateStandings } from '../utils/tournamentEngine';
import imgfoot from "../components/foot.png";

/* Inline status badge for public-facing pages */
const MatchStatusBadge = ({ status }) => {
    if (status === 'live') return (
        <span className="badge badge-live">
            <span className="live-dot" />
            LIVE
        </span>
    );
    if (status === 'finished') return (
        <span className="badge badge-finished">
            <CheckCircle size={11} /> Finished
        </span>
    );
    if (status === 'locked') return (
        <span className="badge badge-locked">
            <Trophy size={11} /> Locked
        </span>
    );
    return <span className="badge badge-upcoming"><Clock size={11} /> Upcoming</span>;
};
const Home = () => {
    const [matches, setMatches] = useState([]);
    const [groups, setGroups] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [matchRes, groupRes, teamRes, playerRes] = await Promise.all([
                matchService.getAll(),
                groupService.getAll(),
                teamService.getAll(),
                playerService.getAll()
            ]);
            setMatches(matchRes.data);
            setGroups(groupRes.data);
            setTeams(teamRes.data);
            setPlayers(playerRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankingsForGroup = (groupId) => {
        const groupTeams = teams.filter(t => t.groupId === groupId);
        const groupMatches = matches.filter(m => m.groupId === groupId);
        return calculateStandings(groupTeams, groupMatches);
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <Loader2 className="spinner" size={40} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Preparing tournament dashboard...</p>
        </div>
    );

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's Matches: Sorted by Live > Finished > Upcoming
    const todayMatches = matches
        .filter(m => m.date === todayStr)
        .sort((a, b) => {
            const statusOrder = { live: 0, finished: 1, upcoming: 2, locked: 1 };
            const priorityA = statusOrder[a.status] ?? 3;
            const priorityB = statusOrder[b.status] ?? 3;

            if (priorityA !== priorityB) return priorityA - priorityB;
            return a.startTime.localeCompare(b.startTime);
        });

    return (
        <div>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem', borderLeft: '5px solid var(--accent)', paddingLeft: '1rem' }}>Tournament Overview</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Live updates, standings, and match results.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(6, 78, 59, 0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', color: 'var(--primary)', fontWeight: '600' }}>
                    <Calendar size={18} /> {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Today's Matches Section */}
            <section style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Timer size={20} color="var(--accent)" /> Today's Highlights
                    </h3>
                    <Link to="/calendar" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        View Full Schedule <ChevronRight size={16} />
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {todayMatches.length > 0 ? todayMatches.map(match => {
                        const teamA = teams.find(t => t.id === match.teamAId);
                        const teamB = teams.find(t => t.id === match.teamBId);
                        const isLive = match.status === 'live';
                        const isFinished = match.status === 'finished' || match.status === 'locked';
                        const showScore = isLive || isFinished;

                        const topBorder = isLive ? '#EF4444' : isFinished ? '#10B981' : 'var(--accent)';

                        return (
                            <div key={match.id} className="card match-card" style={{
                                padding: '1.5rem',
                                borderTop: `4px solid ${topBorder}`,
                                boxShadow: isLive ? '0 0 24px rgba(239,68,68,0.18)' : 'var(--shadow)'
                            }}>
                                {/* Teams Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {/* Team A */}
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', margin: '0 auto 0.75rem', backgroundColor: '#f9fafb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                                            <img src={teamA?.logo || '/teamlogo.png'} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>{teamA?.name}</div>
                                    </div>

                                    {/* Centre: Score or time + badge */}
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        {/* Score or start time */}
                                        <div style={{
                                            fontSize: showScore ? '1.5rem' : '1rem',
                                            fontWeight: 'bold',
                                            color: isLive ? '#DC2626' : isFinished ? 'var(--primary)' : 'var(--accent)',
                                            backgroundColor: isLive ? 'rgba(239,68,68,0.06)' : isFinished ? 'rgba(6,78,59,0.05)' : 'rgba(212,175,55,0.08)',
                                            padding: '0.35rem 0.9rem',
                                            borderRadius: '10px',
                                            display: 'inline-block',
                                            border: isLive ? '1px solid rgba(239,68,68,0.25)' : 'none',
                                            marginBottom: '0.6rem',
                                        }}>
                                            {showScore ? `${match.scoreA} — ${match.scoreB}` : match.startTime}
                                        </div>

                                        {/* Status Badge */}
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
                                            <MatchStatusBadge status={match.status} />
                                        </div>

                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            Group {groups.find(g => g.id === match.groupId)?.name}
                                        </div>
                                    </div>

                                    {/* Team B */}
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', margin: '0 auto 0.75rem', backgroundColor: '#f9fafb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                                            <img src={teamB?.logo || '/teamlogo.png'} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>{teamB?.name}</div>
                                    </div>
                                </div>

                                {/* Player Images */}
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                    {[match.teamAId, match.teamBId].map(tid => (
                                        <div key={tid} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', flex: 1, justifyContent: 'center' }}>
                                            {players.filter(p => p.teamId === tid).slice(0, 4).map(p => (
                                                <div key={p.id} style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee' }} title={p.name}>
                                                    <img src={p.imageUrl || imgfoot} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = imgfoot; }} />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: 'var(--radius)', border: '1px dashed #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertCircle size={32} color="var(--text-muted)" />
                            <div style={{ color: 'var(--text-muted)' }}>No live or upcoming matches for today.</div>
                            <Link to="/calendar" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', marginTop: '0.5rem' }}>Check Full Schedule</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Upcoming by Group Section */}
            <section style={{ marginBottom: '4rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} color="var(--primary)" /> Upcoming by Group
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {groups.map(group => {
                        const groupMatches = matches
                            .filter(m => m.groupId === group.id && m.status !== 'finished' && m.status !== 'locked' && m.date >= todayStr)
                            .sort((a, b) => {
                                const dateComp = a.date.localeCompare(b.date);
                                if (dateComp !== 0) return dateComp;
                                return a.startTime.localeCompare(b.startTime);
                            }).slice(0, 3);

                        return (
                            <div key={group.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', fontWeight: 'bold' }}>
                                    Group {group.name}
                                </div>
                                <div style={{ padding: '0.5rem' }}>
                                    {groupMatches.length > 0 ? groupMatches.map(match => {
                                        const teamA = teams.find(t => t.id === match.teamAId);
                                        const teamB = teams.find(t => t.id === match.teamBId);
                                        return (
                                            <div key={match.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                                                <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                    {match.date === todayStr ? 'Today' : match.date}
                                                    <div style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>{match.startTime}</div>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.99rem' }}>
                                                    <span>{teamA?.name}</span>
                                                    <span style={{ opacity: 0.5 }}>vs</span>
                                                    <span>{teamB?.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                    {players.filter(p => p.teamId === match.teamAId || p.teamId === match.teamBId).slice(0, 4).map(p => (
                                                        <div key={p.id} style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee' }}>
                                                            <img
                                                                src={p.imageUrl || imgfoot}
                                                                alt=""
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', marginBottom: '8px' }}
                                                                onError={(e) => { e.target.src = imgfoot; }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upcoming matches</div>
                                    )}
                                </div>
                                {groupMatches.length > 0 && (
                                    <div style={{ padding: '0.5rem', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
                                        <Link to="/calendar" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none' }}>Full Group Schedule</Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Standings Section */}
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={20} color="var(--accent)" /> Current Standings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                {groups.map(group => {
                    const rankings = getRankingsForGroup(group.id);
                    return (
                        <div key={group.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid #eee', fontWeight: 'bold', color: 'var(--primary)' }}>
                                Group {group.name} Table
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead style={{ backgroundColor: '#f9fafb' }}>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6' }}>
                                        <th style={{ padding: '0.75rem 1rem' }}>TEAM</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>P</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>GD</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--accent)' }}>PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankings.map((team, idx) => (
                                        <tr key={team.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-muted)', width: '12px' }}>{idx + 1}</span>
                                                <img src={team.logo || '/teamlogo.png'} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                                <span style={{ color: 'var(--primary)' }}>{team.name}</span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{team.played}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{team.pts}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            <style>
                {`
                .match-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .match-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                `}
            </style>
        </div>
    );
};

export default Home;
