import React, { useState, useEffect } from 'react';
import { playerService, statService, matchService, teamService } from '../services/api';
import { Trophy, Star, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
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
                setStats(statRes.data || []);
                setPlayers(playerRes.data || []);
                setTeams(teamRes.data || []);
                setMatches(matchRes.data || []);
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

    const activePlayers = getAggregatedPlayerStats(players, stats, matches, true);

    const handlePlayerClick = (p) => {
        const { player, team } = getPlayerData(p.id);
        const aggregatedStats = activePlayers.find(ap => ap.id === p.id);
        setSelectedPlayer({ player, team, stats: aggregatedStats });
    };

    const topScorers = activePlayers.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10);
    const topAssists = activePlayers.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 10);
    const disciplined = activePlayers
        .filter(p => p.yellowCards > 0 || p.redCards > 0)
        .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards))
        .slice(0, 10);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-gray-500 font-medium tracking-wide">Calculating tournament records...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-12">
            <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-primary border-l-8 border-accent pl-4">
                    Tournament Statistics
                </h2>
                <p className="text-gray-500 text-lg">Leading performers and historical milestones.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Top Scorers */}
                <section className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300">
                    <div className="p-6 bg-accent/5 border-b border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                            <Trophy size={24} />
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight">Golden Boot</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4 text-left">Player</th>
                                    <th className="px-6 py-4 text-right">Goals</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topScorers.map((p, idx) => {
                                    const { team } = getPlayerData(p.id);
                                    return (
                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} className="cursor-pointer group hover:bg-accent/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${idx < 3 ? 'bg-accent text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                        <img src={p.imageUrl || imgfoot} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-primary text-sm group-hover:text-accent-dark transition-colors">{p.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{team?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-block px-3 py-1 bg-primary text-white rounded-lg text-sm font-black shadow-sm group-hover:bg-accent transition-colors">
                                                    {p.goals}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {topScorers.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="py-20 text-center flex flex-col items-center space-y-3 opacity-30">
                                            <AlertCircle size={48} />
                                            <p className="font-bold uppercase tracking-widest text-xs">No goals yet</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top Assists */}
                <section className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300">
                    <div className="p-6 bg-primary/5 border-b border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Star size={24} />
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight">Playmakers</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4 text-left">Player</th>
                                    <th className="px-6 py-4 text-right">Assists</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topAssists.map((p, idx) => {
                                    const { team } = getPlayerData(p.id);
                                    return (
                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} className="cursor-pointer group hover:bg-primary/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs font-black text-gray-300 w-6 h-6 flex items-center justify-center">{idx + 1}</span>
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                        <img src={p.imageUrl || imgfoot} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-primary text-sm group-hover:text-primary-dark transition-colors">{p.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{team?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-block px-3 py-1 bg-accent/20 text-accent-dark rounded-lg text-sm font-black transition-colors group-hover:bg-accent group-hover:text-white">
                                                    {p.assists}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {topAssists.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="py-20 text-center flex flex-col items-center space-y-3 opacity-30">
                                            <Star size={48} />
                                            <p className="font-bold uppercase tracking-widest text-xs">No assists yet</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Discipline */}
                <section className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300">
                    <div className="p-6 bg-red-50 border-b border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight">Fair Play</h3>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-4 text-left">Player</th>
                                    <th className="px-4 py-4 text-center">YC</th>
                                    <th className="px-4 py-4 text-center">RC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {disciplined.map((p) => {
                                    const { team } = getPlayerData(p.id);
                                    return (
                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} className="cursor-pointer group hover:bg-red-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                        <img src={p.imageUrl || imgfoot} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-primary text-sm line-clamp-1">{p.name}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{team?.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-md text-[10px] font-black shadow-sm">{p.yellowCards}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-black shadow-sm">{p.redCards}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {disciplined.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-20 text-center flex flex-col items-center space-y-3 opacity-30">
                                            <ShieldAlert size={48} />
                                            <p className="font-bold uppercase tracking-widest text-xs">Clean sheet records</p>
                                        </td>
                                    </tr>
                                )}
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
        </div>
    );
};

export default Stats;
