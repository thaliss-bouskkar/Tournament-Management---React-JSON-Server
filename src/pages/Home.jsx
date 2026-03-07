import React, { useState, useEffect } from 'react';
import { matchService, teamService, groupService, playerService } from '../services/api';
import { Calendar, Trophy, ChevronRight, Timer, AlertCircle, Loader2, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateStandings } from '../utils/tournamentEngine';
import imgfoot from "../components/foot.png";

const MatchStatusBadge = ({ status }) => {
    const badges = {
        live: (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-600 border border-red-200">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                LIVE
            </span>
        ),
        finished: (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle size={12} /> Finished
            </span>
        ),
        locked: (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600 border border-gray-200">
                <Trophy size={11} /> Locked
            </span>
        ),
        upcoming: (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent-dark border border-accent/20">
                <Clock size={11} /> Upcoming
            </span>
        )
    };
    return badges[status] || badges.upcoming;
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
            setMatches(matchRes.data || []);
            setGroups(groupRes.data || []);
            setTeams(teamRes.data || []);
            setPlayers(playerRes.data || []);
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-gray-500 font-medium animate-pulse">Preparing tournament dashboard...</p>
        </div>
    );

    const todayStr = new Date().toISOString().split('T')[0];
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
        <div className="space-y-12 pb-12">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-primary border-l-8 border-accent pl-4">
                        Tournament Overview
                    </h2>
                    <p className="text-gray-500 text-lg">Real-time standings and statistical highlights.</p>
                </div>
                <div className="flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-2xl text-primary font-bold border border-primary/10 self-start md:self-auto">
                    <Calendar size={20} className="text-accent" />
                    <span className="whitespace-nowrap">
                        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Today's Matches Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-3">
                        <Timer className="text-accent" size={28} /> Today's Highlights
                    </h3>
                    <Link to="/calendar" className="text-accent font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                        View Schedule <ChevronRight size={18} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todayMatches.length > 0 ? todayMatches.map(match => {
                        const teamA = teams.find(t => t.id === match.teamAId);
                        const teamB = teams.find(t => t.id === match.teamBId);
                        const isLive = match.status === 'live';
                        const isFinished = match.status === 'finished' || match.status === 'locked';
                        const showScore = isLive || isFinished;

                        return (
                            <div key={match.id} className={`group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border-t-8 ${isLive ? 'border-red-500 shadow-red-500/10' : isFinished ? 'border-emerald-500' : 'border-accent'}`}>
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex-1 flex flex-col items-center text-center space-y-3">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center p-3 group-hover:scale-110 transition-transform">
                                            <img src={teamA?.logo || '/teamlogo.png'} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <p className="font-bold text-primary text-sm line-clamp-1">{teamA?.name}</p>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center space-y-4">
                                        <div className={`px-4 py-2 rounded-xl font-black text-xl md:text-2xl whitespace-nowrap shadow-sm border ${isLive ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-primary border-gray-100'}`}>
                                            {showScore ? `${match.scoreA} — ${match.scoreB}` : match.startTime}
                                        </div>
                                        <MatchStatusBadge status={match.status} />
                                        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                                            Group {groups.find(g => g.id === match.groupId)?.name}
                                        </span>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center text-center space-y-3">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center p-3 group-hover:scale-110 transition-transform">
                                            <img src={teamB?.logo || '/teamlogo.png'} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <p className="font-bold text-primary text-sm line-clamp-1">{teamB?.name}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center space-y-4">
                            <AlertCircle size={48} className="text-gray-300" />
                            <p className="text-gray-500 font-medium">No live or scheduled matches for today.</p>
                            <Link to="/calendar" className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-primary font-bold hover:shadow-md transition-shadow">
                                Check Full Schedule
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Upcoming + Standings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Upcoming by Group */}
                <div className="lg:col-span-5 space-y-8">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-3">
                        <Clock className="text-primary" size={24} /> Row Grid Schedule
                    </h3>
                    <div className="space-y-6">
                        {groups.map(group => {
                            const groupMatches = matches
                                .filter(m => m.groupId === group.id && m.status !== 'finished' && m.status !== 'locked' && m.date >= todayStr)
                                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                                .slice(0, 3);

                            return (
                                <div key={group.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                                    <div className="bg-primary text-white px-6 py-4 font-bold flex justify-between items-center">
                                        <span>Group {group.name}</span>
                                        <Trophy size={18} className="text-accent" />
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {groupMatches.length > 0 ? groupMatches.map(match => {
                                            const teamA = teams.find(t => t.id === match.teamAId);
                                            const teamB = teams.find(t => t.id === match.teamBId);
                                            return (
                                                <div key={match.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                                    <div className="min-w-[80px]">
                                                        <p className="text-xs font-black text-primary">{match.date === todayStr ? 'TODAY' : match.date}</p>
                                                        <p className="text-xs text-gray-400">{match.startTime}</p>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center gap-3 text-sm font-bold text-primary">
                                                        <span className="truncate max-w-[80px] text-right">{teamA?.name}</span>
                                                        <span className="text-[10px] text-accent uppercase font-black">vs</span>
                                                        <span className="truncate max-w-[80px]">{teamB?.name}</span>
                                                    </div>
                                                    <div className="flex -space-x-2">
                                                        {players.filter(p => p.teamId === match.teamAId || p.teamId === match.teamBId).slice(0, 3).map(p => (
                                                            <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100 shadow-sm">
                                                                <img src={p.imageUrl || imgfoot} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="px-6 py-8 text-center text-gray-400 text-sm">No upcoming matches</div>
                                        )}
                                    </div>
                                    {groupMatches.length > 0 && (
                                        <Link to="/calendar" className="block text-center py-3 text-xs font-bold text-accent uppercase tracking-widest hover:bg-accent/5 transition-colors border-t border-gray-50">
                                            Full Schedule
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tournament Standings */}
                <div className="lg:col-span-7 space-y-8">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-3">
                        <Trophy className="text-accent" size={28} /> Group Standings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-8">
                        {groups.map(group => {
                            const rankings = getRankingsForGroup(group.id);
                            return (
                                <div key={group.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                                        <h4 className="font-black text-primary text-sm uppercase tracking-wider">Group {group.name} Table</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">
                                                    <th className="px-6 py-4">Ranking & Team</th>
                                                    <th className="px-4 py-4 text-center">P</th>
                                                    <th className="px-4 py-4 text-center">GD</th>
                                                    <th className="px-6 py-4 text-center text-primary">PTS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {rankings.map((team, idx) => (
                                                    <tr key={team.id} className="group hover:bg-primary/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${idx < 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {idx + 1}
                                                                </span>
                                                                <img src={team.logo || '/teamlogo.png'} alt="" className="w-8 h-8 object-contain" />
                                                                <span className="font-bold text-primary group-hover:text-primary-dark transition-colors">{team.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-sm font-semibold">{team.played}</td>
                                                        <td className={`px-4 py-4 text-center text-sm font-bold ${team.gd >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                                                            {team.gd > 0 ? `+${team.gd}` : team.gd}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-block min-w-[32px] px-3 py-1 rounded-lg bg-accent/10 text-accent-dark font-black text-sm">
                                                                {team.pts}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
