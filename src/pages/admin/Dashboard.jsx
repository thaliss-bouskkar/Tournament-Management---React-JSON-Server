import React, { useState, useEffect } from 'react';
import { teamService, matchService, groupService, playerService } from '../../services/api';
import { cascadeService } from '../../services/cascadeService';
import { useAuth } from '../../context/AuthContext';
import imgfoot from "../../components/foot.png";

import {
    Users,
    Calendar,
    CheckCircle,
    Loader2,
    Timer,
    Trash2,
    Trophy,
    AlertCircle,
    ChevronRight,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import footImg from '../../components/foot.png';


const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState({
        teams: [],
        matches: [],
        groups: [],
        players: []
    });
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const fetchData = async () => {
        try {
            const [teamsRes, matchesRes, groupsRes, playersRes] = await Promise.all([
                teamService.getAll(),
                matchService.getAll(),
                groupService.getAll(),
                playerService.getAll()
            ]);

            setData({
                teams: teamsRes.data,
                matches: matchesRes.data,
                groups: groupsRes.data,
                players: playersRes.data
            });
        } catch {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteMatch = async (matchId, status) => {
        const isLocked = status === 'locked';

        if (isLocked && user?.role !== 'super_admin') {
            return toast.error('Only Super Admins can delete locked matches');
        }

        if (isLocked) {
            const verification = prompt('WARNING: Deleting a LOCKED match permanently affects standings and statistics.\n\nPlease type "DELETE" to confirm:');
            if (verification !== 'DELETE') return;
        } else {
            if (!window.confirm('Are you sure you want to delete this match?')) return;
        }

        setDeletingId(matchId);
        try {
            await cascadeService.deleteMatch(matchId);
            toast.success('Match and related statistics deleted');
            fetchData();
        } catch {
            toast.error('Error deleting match');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <Loader2 className="spinner" size={40} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading Overview...</p>
        </div>
    );

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's Matches: Not finished/locked, sorted by time
    const todayMatches = data.matches
        .filter(m => m.date === todayStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Summary Stats
    const stats = {
        totalTeams: data.teams.length,
        totalMatches: data.matches.length,
        finishedMatches: data.matches.filter(m => m.status === 'finished' || m.status === 'locked').length,
        pendingMatches: data.matches.filter(m => m.status === 'scheduled' || m.status === 'pending').length
    };

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ borderLeft: '5px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent)' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Teams</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalTeams}</p>
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '5px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(6, 78, 59, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Total Matches</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalMatches}</p>
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '5px solid #10B981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: '#10B981' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Finished</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.finishedMatches}</p>
                    </div>
                </div>

                <div className="card" style={{ borderLeft: '5px solid #3B82F6', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: '#3B82F6' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Upcoming</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.pendingMatches}</p>
                    </div>
                </div>
            </div>

            {/* Today's Matches Section */}
            <section style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Timer size={22} color="var(--accent)" /> Today's Matches
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {todayMatches.length > 0 ? todayMatches.map(match => {
                        const teamA = data.teams.find(t => t.id === match.teamAId);
                        const teamB = data.teams.find(t => t.id === match.teamBId);

                        return (
                            <div key={match.id} className="card" style={{ position: 'relative', borderTop: '4px solid var(--accent)' }}>
                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                                    <button
                                        onClick={() => handleDeleteMatch(match.id, match.status)}
                                        disabled={deletingId === match.id}
                                        style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }}
                                        title="Delete Match"
                                    >
                                        {deletingId === match.id ? <Loader2 size={16} className="spinner" /> : <Trash2 size={18} />}
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                                            <img src={teamA?.logo || '/teamlogo.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{teamA?.name}</div>
                                    </div>

                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            backgroundColor: match.status === 'locked' || match.status === 'finished' ? 'var(--primary)' : 'rgba(212, 175, 55, 0.1)',
                                            color: match.status === 'locked' || match.status === 'finished' ? 'white' : 'var(--accent)',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            display: 'inline-block'
                                        }}>
                                            {match.status === 'locked' || match.status === 'finished' ? (
                                                <span style={{ fontSize: '1.2rem' }}>{match.scoreA} - {match.scoreB}</span>
                                            ) : (
                                                match.startTime
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            color: match.status === 'locked' || match.status === 'finished' ? '#10B981' : 'var(--accent)',
                                            marginTop: '0.5rem'
                                        }}>
                                            {match.status === 'locked' ? 'Locked' : (match.status === 'finished' ? 'Finished' : 'Upcoming')}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Group {data.groups.find(g => g.id === match.groupId)?.name}</div>
                                    </div>

                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                                            <img src={teamB?.logo || '/teamlogo.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{teamB?.name}</div>
                                    </div>
                                </div>

                                {/* Players in Match */}
                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                        {/* Team A Players */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                                                {data.players.filter(p => p.teamId === match.teamAId).slice(0, 5).map(p => (
                                                    <div key={p.id} title={p.name} style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee' }}>
                                                        <img src={p.imageUrl || footImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
                                                {data.players.filter(p => p.teamId === match.teamBId).slice(0, 5).map(p => (
                                                    <div key={p.id} title={p.name} style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee' }}>
                                                        <img src={p.imageUrl || footImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: 'var(--radius)', border: '1px dashed #ddd' }}>
                            <AlertCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>No matches scheduled for today.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Groups & Upcoming Matches Section */}
            <section>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={22} color="var(--primary)" /> Upcoming by Group
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                    {data.groups.map(group => {
                        const groupMatches = data.matches
                            .filter(m => m.groupId === group.id && m.status !== 'finished' && m.status !== 'locked' && m.date >= todayStr)
                            .sort((a, b) => {
                                const dateComp = a.date.localeCompare(b.date);
                                if (dateComp !== 0) return dateComp;
                                return a.startTime.localeCompare(b.startTime);
                            });

                        return (
                            <div key={group.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>Group {group.name}</h4>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{groupMatches.length} matches upcoming</span>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {groupMatches.length > 0 ? groupMatches.map(match => {
                                        const teamA = data.teams.find(t => t.id === match.teamAId);
                                        const teamB = data.teams.find(t => t.id === match.teamBId);
                                        return (
                                            <div key={match.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                                                <div style={{ width: '100px', fontSize: '0.85rem' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{match.date === todayStr ? 'Today' : match.date}</div>
                                                    <div style={{ color: 'var(--text-muted)' }}>{match.startTime}</div>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <span style={{ fontWeight: '600' }}>{teamA?.name}</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>vs</span>
                                                        <span style={{ fontWeight: '600' }}>{teamB?.name}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.3rem' }}>
                                                        {data.players.filter(p => p.teamId === match.teamAId || p.teamId === match.teamBId).slice(0, 7).map(p => (
                                                            <div key={p.id} style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #eee' }}>
                                                                <img src={p.imageUrl || imgfoot} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', marginBottom: '14px' }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteMatch(match.id, match.status)}
                                                    disabled={deletingId === match.id}
                                                    style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    }) : (
                                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No upcoming matches for this group.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
