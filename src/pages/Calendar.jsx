import { Calendar as CalendarIcon, Clock, Trophy, CheckCircle } from 'lucide-react';
import { playerService, matchService, teamService } from '../services/api';
import { useEffect, useState } from 'react';

/* ─── Status badge (mirrors the admin panel badge) ─── */
const CalendarStatusBadge = ({ status }) => {
  if (status === 'live') return (
    <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>
      <span className="live-dot" />
      LIVE
    </span>
  );
  if (status === 'finished') return (
    <span className="badge badge-finished" style={{ fontSize: '0.62rem' }}>
      <CheckCircle size={10} /> Finished
    </span>
  );
  if (status === 'locked') return (
    <span className="badge badge-locked" style={{ fontSize: '0.62rem' }}>
      <Trophy size={10} /> Locked
    </span>
  );
  return (
    <span className="badge badge-upcoming" style={{ fontSize: '0.62rem' }}>
      <Clock size={10} /> Upcoming
    </span>
  );
};

const CalendarPage = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          matchService.getAll(),
          teamService.getAll(),
          playerService.getAll()
        ]);

        const sortedMatches = mRes.data.sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (a.startTime || '').localeCompare(b.startTime || '');
        });

        setMatches(sortedMatches);
        setTeams(tRes.data);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = [];
    acc[match.date].push(match);
    return acc;
  }, {});

  if (loading) return <div>Loading calendar...</div>;

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', borderLeft: '5px solid var(--accent)', paddingLeft: '1rem' }}>
        Match Calendar
      </h2>

      {Object.keys(groupedMatches).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <CalendarIcon size={48} opacity={0.3} />
          <p>No matches scheduled yet. Check back soon!</p>
        </div>
      ) : (
        Object.keys(groupedMatches).map(date => {
          const isValidDate = !isNaN(new Date(date).getTime());
          const dateDisplay = isValidDate
            ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Date Pending';

          return (
            <div key={date} style={{ marginBottom: '2.5rem' }}>
              <h3 style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '1rem',
                backgroundColor: 'rgba(6, 78, 59, 0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)'
              }}>
                <CalendarIcon size={18} /> {dateDisplay}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {groupedMatches[date].map(match => {
                  const teamA = teams.find(t => t.id === match.teamAId);
                  const teamB = teams.find(t => t.id === match.teamBId);
                  const isLive = match.status === 'live';
                  const isFinished = match.status === 'finished' || match.status === 'locked';
                  const showScore = isLive || isFinished;

                  // Card left-border colour by status
                  const stripColor = isLive ? '#EF4444' : isFinished ? '#10B981' : match.status === 'locked' ? '#6B7280' : '#e5e7eb';

                  return (
                    <div key={match.id} className="card" style={{
                      display: 'flex', alignItems: 'center', padding: '1rem',
                      borderLeft: `4px solid ${stripColor}`,
                      boxShadow: isLive ? '0 0 16px rgba(239,68,68,0.14)' : 'var(--shadow)',
                      gap: '0.5rem',
                    }}>

                      {/* Team A */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <img src={teamA?.logo || '/teamlogo.png'} alt={teamA?.name || 'TBD'}
                          style={{ width: '32px', height: '32px', marginBottom: '0.25rem', objectFit: 'contain' }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {teamA?.name || 'TBD'}
                        </div>
                      </div>

                      {/* Centre: Score / VS + status badge */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {showScore ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{
                              fontSize: '1.3rem', fontWeight: 'bold',
                              color: isLive ? '#DC2626' : 'var(--primary)',
                              backgroundColor: isLive ? 'rgba(239,68,68,0.06)' : 'rgba(6,78,59,0.05)',
                              padding: '0.3rem 0.8rem', borderRadius: '8px',
                              border: isLive ? '1px solid rgba(239,68,68,0.25)' : 'none',
                            }}>
                              {match.scoreA} — {match.scoreB}
                            </div>
                            <CalendarStatusBadge status={match.status} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                              <Clock size={13} /> {match.startTime || 'TBD'}
                            </div>
                            <CalendarStatusBadge status={match.status} />
                          </div>
                        )}
                      </div>

                      {/* Team B */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <img src={teamB?.logo || '/teamlogo.png'} alt={teamB?.name || 'TBD'}
                          style={{ width: '32px', height: '32px', marginBottom: '0.25rem', objectFit: 'contain' }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {teamB?.name || 'TBD'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CalendarPage;