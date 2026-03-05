/**
 * Tournament Engine - Deterministic Logic for Futsal Management System
 * Matches are the single source of truth.
 */

/**
 * Calculates standings dynamically from finished or locked matches.
 * @param {Array} teams - All teams in the group
 * @param {Array} matches - All matches in the group
 * @returns {Array} Sorted standings
 */
export const calculateStandings = (teams, matches) => {
    // Include both finished and locked matches
    const activeMatches = matches.filter(m => m.status === 'finished' || m.status === 'locked');

    const standings = teams.map(team => {
        const teamStats = {
            ...team,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            pts: 0
        };

        activeMatches.forEach(match => {
            if (match.teamAId === team.id) {
                teamStats.played++;
                teamStats.gf += Number(match.scoreA || 0);
                teamStats.ga += Number(match.scoreB || 0);
                if (match.scoreA > match.scoreB) {
                    teamStats.wins++;
                    teamStats.pts += 3;
                } else if (match.scoreA === match.scoreB) {
                    teamStats.draws++;
                    teamStats.pts += 1;
                } else {
                    teamStats.losses++;
                }
            } else if (match.teamBId === team.id) {
                teamStats.played++;
                teamStats.gf += Number(match.scoreB || 0);
                teamStats.ga += Number(match.scoreA || 0);
                if (match.scoreB > match.scoreA) {
                    teamStats.wins++;
                    teamStats.pts += 3;
                } else if (match.scoreB === match.scoreA) {
                    teamStats.draws++;
                    teamStats.pts += 1;
                } else {
                    teamStats.losses++;
                }
            }
        });

        teamStats.gd = teamStats.gf - teamStats.ga;
        return teamStats;
    });

    // Sorting: Points > GD > GF
    return standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
};

/**
 * Aggregates player statistics from finished or locked matches only.
 * @param {Array} players - All players
 * @param {Array} statistics - All statistics entries
 * @param {Array} matches - All matches
 * @param {Boolean} filterEmpty - If true, only return players with at least one stat
 */
export const getAggregatedPlayerStats = (players, statistics, matches, filterEmpty = false) => {
    const activeMatchIds = new Set(
        matches.filter(m => m.status === 'finished' || m.status === 'locked').map(m => m.id)
    );

    const results = players.map(player => {
        const playerTotals = statistics
            .filter(s => s.playerId === player.id && activeMatchIds.has(s.matchId))
            .reduce((acc, s) => {
                acc.goals += Number(s.goals || 0);
                acc.assists += Number(s.assists || 0);
                acc.yellowCards += Number(s.yellowCards || 0);
                acc.redCards += Number(s.redCards || 0);
                return acc;
            }, { goals: 0, assists: 0, yellowCards: 0, redCards: 0 });

        return {
            ...player,
            ...playerTotals
        };
    });

    if (filterEmpty) {
        return results.filter(p =>
            p.goals > 0 ||
            p.assists > 0 ||
            p.yellowCards > 0 ||
            p.redCards > 0
        );
    }

    return results;
};

/**
 * Validates if a match can be scheduled without conflicts.
 */
export const validateScheduling = (matches, newMatch) => {
    const errors = [];

    // 1. Basic check
    if (newMatch.teamAId === newMatch.teamBId) {
        errors.push("A team cannot play against itself.");
    }

    // 2. Conflict check (Same team playing at same date/time)
    const conflict = matches.find(m => {
        if (m.id === newMatch.id) return false;
        if (m.date === newMatch.date && m.startTime === newMatch.startTime) {
            const teamsInMatch = [m.teamAId, m.teamBId];
            if (teamsInMatch.includes(newMatch.teamAId)) return true;
            if (teamsInMatch.includes(newMatch.teamBId)) return true;
        }
        return false;
    });

    if (conflict) {
        errors.push(`Conflict: One of these teams is already playing on ${newMatch.date} at ${newMatch.startTime}.`);
    }

    return { isValid: errors.length === 0, errors };
};

/**
 * Helper to check if a match is locked.
 */
export const isLocked = (match) => match?.status === 'locked';
