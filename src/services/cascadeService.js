import { matchService, statService, playerService, teamService, groupService } from './api';
import { getAggregatedPlayerStats, calculateStandings } from '../utils/tournamentEngine';

/**
 * Service to handle cascading deletions across the tournament system.
 * This ensures data integrity by removing dependent records before the parent record.
 */
export const cascadeService = {
    /**
     * Delete a match and all related statistics.
     */
    deleteMatch: async (matchId) => {
        try {
            // 1. Get info about the match before deleting
            const { data: match } = await matchService.getById(matchId);
            const groupId = match.groupId;

            // 2. Get all stats for this match (to know which players are affected)
            const { data: stats } = await statService.getByMatch(matchId);
            const affectedPlayerIds = [...new Set(stats.map(s => s.playerId))];

            // 3. Delete all match-specific statistics
            if (stats && stats.length > 0) {
                await Promise.all(stats.map(s => statService.delete(s.id)));
            }

            // 4. Delete the match itself
            await matchService.delete(matchId);

            // 5. Recalculate Global Statistics (matchId: null) for affected players
            // This ensures "Total Goals", "Total Yellow Cards" etc. stay accurate
            if (affectedPlayerIds.length > 0) {
                const [allPlayersRes, allStatsRes, allMatchesRes] = await Promise.all([
                    playerService.getAll(),
                    statService.getAll(),
                    matchService.getAll()
                ]);

                const allPlayers = allPlayersRes.data;
                const allStats = allStatsRes.data;
                const allMatches = allMatchesRes.data;

                // Use the tournament engine to get fresh totals
                const updatedStats = getAggregatedPlayerStats(
                    allPlayers.filter(p => affectedPlayerIds.includes(p.id)),
                    allStats,
                    allMatches
                );

                // Update the "Global" records in db.json (where matchId is null)
                await Promise.all(updatedStats.map(async (ps) => {
                    const globalStat = allStats.find(s => s.playerId === ps.id && s.matchId === null);
                    if (globalStat) {
                        await statService.update(globalStat.id, {
                            goals: ps.goals,
                            assists: ps.assists,
                            yellowCards: ps.yellowCards,
                            redCards: ps.redCards
                        });
                    }
                }));
            }

            // 6. Recalculate Team Standings for the affected group
            const [allTeamsRes, allGroupMatchesRes] = await Promise.all([
                teamService.getAll(),
                matchService.getAll() // Re-fetch to get state after deletion
            ]);

            const groupTeams = allTeamsRes.data.filter(t => t.groupId === groupId);
            const groupMatches = allGroupMatchesRes.data.filter(m => m.groupId === groupId);

            // Use engine to calculate fresh standings
            const updatedStandings = calculateStandings(groupTeams, groupMatches);

            // Update each team in the group with new standings data
            await Promise.all(updatedStandings.map(ts =>
                teamService.update(ts.id, {
                    played: ts.played,
                    wins: ts.wins,
                    draws: ts.draws,
                    losses: ts.losses,
                    gf: ts.gf,
                    ga: ts.ga,
                    gd: ts.gd,
                    pts: ts.pts
                })
            ));

            return true;
        } catch (error) {
            console.error(`Cascade delete match ${matchId} failed:`, error);
            throw error;
        }
    },

    /**
     * Delete a player and all related statistics across all matches.
     */
    deletePlayer: async (playerId) => {
        try {
            // 1. Get all stats for this player (including global and match-specific)
            const { data: allStats } = await statService.getAll();
            const playerStats = allStats.filter(s => s.playerId === playerId);

            // 2. Delete all statistics
            if (playerStats.length > 0) {
                await Promise.all(playerStats.map(s => statService.delete(s.id)));
            }

            // 3. Delete the player
            await playerService.delete(playerId);
            return true;
        } catch (error) {
            console.error(`Cascade delete player ${playerId} failed:`, error);
            throw error;
        }
    },

    /**
     * Delete a team, its players, and all matches it participated in.
     */
    deleteTeam: async (teamId) => {
        try {
            // 1. Find all players in this team
            const { data: allPlayers } = await playerService.getAll();
            const teamPlayers = allPlayers.filter(p => p.teamId === teamId);

            // 2. Delete players (triggers Player -> Stats cascade)
            if (teamPlayers.length > 0) {
                await Promise.all(teamPlayers.map(p => cascadeService.deletePlayer(p.id)));
            }

            // 3. Find all matches involving this team
            const { data: allMatches } = await matchService.getAll();
            const teamMatches = allMatches.filter(m => m.teamAId === teamId || m.teamBId === teamId);

            // 4. Delete matches (triggers Match -> Stats cascade)
            if (teamMatches.length > 0) {
                await Promise.all(teamMatches.map(m => cascadeService.deleteMatch(m.id)));
            }

            // 5. Delete the team
            await teamService.delete(teamId);
            return true;
        } catch (error) {
            console.error(`Cascade delete team ${teamId} failed:`, error);
            throw error;
        }
    },

    /**
     * Delete a group and all matches/teams within it.
     */
    deleteGroup: async (groupId) => {
        try {
            // 1. Find all matches in this group
            const { data: allMatches } = await matchService.getAll();
            const groupMatches = allMatches.filter(m => m.groupId === groupId);

            // 2. Delete matches (triggers Match -> Stats cascade)
            if (groupMatches.length > 0) {
                await Promise.all(groupMatches.map(m => cascadeService.deleteMatch(m.id)));
            }

            // 3. Find and delete all teams in this group
            const { data: allTeams } = await teamService.getAll();
            const groupTeams = allTeams.filter(t => t.groupId === groupId);

            // 4. Delete teams (triggers Team -> Player -> Match -> Stats cascade)
            if (groupTeams.length > 0) {
                await Promise.all(groupTeams.map(t => cascadeService.deleteTeam(t.id)));
            }

            // 5. Delete the group
            await groupService.delete(groupId);
            return true;
        } catch (error) {
            console.error(`Cascade delete group ${groupId} failed:`, error);
            throw error;
        }
    }
};
