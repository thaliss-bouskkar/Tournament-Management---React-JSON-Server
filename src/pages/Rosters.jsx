import React, { useState, useEffect } from 'react';
import { teamService, playerService, groupService, statService } from '../services/api';
import { Users, Trophy, Loader2, Star, Shield } from 'lucide-react';
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
                setTeams(tRes.data || []);
                setPlayers(pRes.data || []);
                setGroups(gRes.data || []);
                setStats(sRes.data || []);
            } catch (error) {
                console.error("Error fetching rosters:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-gray-500 font-medium tracking-wide">Loading league rosters...</p>
        </div>
    );

    const groupsWithTeams = groups.map(g => ({
        ...g,
        teams: teams.filter(t => t.groupId === g.id)
    }));

    const handlePlayerClick = (player) => {
        const team = teams.find(t => t.id === player.teamId);
        const playerStats = stats.find(s => s.playerId === player.id && s.matchId === null);
        setSelectedPlayer({ player, team, stats: playerStats });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-16 pb-20">
            <div className="space-y-4 text-center md:text-left">
                <h2 className="text-4xl font-black text-primary border-l-8 border-accent pl-6 inline-block">
                    Teams & Rosters
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl">
                    Explore the complete roster of every team in the tournament. Select a player to view their season analytics.
                </p>
            </div>

            {groupsWithTeams.map(group => (
                <div key={group.id} className="space-y-8">
                    <div className="flex items-center gap-4 bg-accent/5 p-4 rounded-2xl border border-accent/10">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shadow-lg shadow-accent/20">
                            <Trophy size={20} />
                        </div>
                        <h3 className="text-2xl font-black text-primary tracking-tight uppercase">Group {group.name}</h3>
                        <div className="flex-1 h-px bg-accent/20"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {group.teams.map(team => {
                            const teamPlayers = players.filter(p => p.teamId === team.id);
                            return (
                                <div key={team.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden group">
                                    <div className="p-8 pb-4 flex items-center gap-6">
                                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center p-4 ring-1 ring-gray-100 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                            <img src={team.logo || ASSETS.DEFAULT_TEAM_LOGO} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-primary tracking-tight line-clamp-1 group-hover:text-accent transition-colors">{team.name}</h4>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Users size={12} className="text-accent" /> {teamPlayers.length} Players Registered
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-2">
                                        <div className="overflow-x-auto scrollbar-hide">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                        <th className="px-6 py-4 text-left">#</th>
                                                        <th className="px-6 py-4 text-left">Player</th>
                                                        <th className="px-6 py-4 text-right">Position</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50/50">
                                                    {teamPlayers.sort((a, b) => parseInt(a.number || 0) - parseInt(b.number || 0)).map(p => (
                                                        <tr key={p.id} onClick={() => handlePlayerClick(p)} className="cursor-pointer hover:bg-bg-light group/row transition-all duration-300">
                                                            <td className="px-6 py-4 font-black text-accent text-xs group-hover/row:scale-125 transition-transform">{p.number || '-'}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                                        <img src={p.imageUrl || ASSETS.DEFAULT_PLAYER_IMAGE} alt="" className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="font-bold text-primary text-xs group-hover/row:text-accent-dark transition-colors">{p.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase tracking-tighter group-hover/row:bg-primary group-hover/row:text-white transition-all">
                                                                    {p.position || '-'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {teamPlayers.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="py-12 text-center opacity-30 select-none">
                                                                <Shield size={32} className="mx-auto mb-2" />
                                                                <p className="text-[10px] uppercase font-black tracking-widest">No players registered</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
