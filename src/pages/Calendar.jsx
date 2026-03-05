import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { playerService, matchService, teamService } from '../services/api';
import { useEffect, useState } from 'react';

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
        <div
          className="card"
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <CalendarIcon size={48} opacity={0.3} />
          <p>No matches scheduled yet. Check back soon!</p>
        </div>
      ) : (
        Object.keys(groupedMatches).map(date => {
          const isValidDate = !isNaN(new Date(date).getTime());
          const dateDisplay = isValidDate
            ? new Date(date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Date Pending';

          return (
            <div key={date} style={{ marginBottom: '2.5rem' }}>
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1.1rem',
                  color: 'var(--primary)',
                  marginBottom: '1rem',
                  backgroundColor: 'rgba(6, 78, 59, 0.05)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)'
                }}
              >
                <CalendarIcon size={18} /> {dateDisplay}
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '1rem'
                }}
              >
                {groupedMatches[date].map(match => {
                  const teamA = teams.find(t => t.id === match.teamAId);
                  const teamB = teams.find(t => t.id === match.teamBId);
                  const isFinished = match.status === 'finished' || match.status === 'locked';

                  return (
                    <div
                      key={match.id}
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        borderLeft: isFinished ? '4px solid var(--primary)' : '1px solid #eee'
                      }}
                    >
                      {/* Team A */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <img
                          src={teamA?.logo || '/teamlogo.png'}
                          alt={teamA?.name || 'TBD'}
                          style={{ width: '32px', height: '32px', marginBottom: '0.25rem', objectFit: 'contain' }}
                        />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {teamA?.name || 'TBD'}
                        </div>
                        
                      </div>

                      {/* Score / VS */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        {isFinished ? (
                          <div
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 'bold',
                              color: 'var(--primary)',
                              backgroundColor: 'rgba(6, 78, 59, 0.05)',
                              padding: '0.4rem',
                              borderRadius: '8px'
                            }}
                          >
                            {match.scoreA} - {match.scoreB}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              VS
                            </span>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Clock size={12} /> {match.startTime || 'TBD'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Team B */}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <img
                          src={teamB?.logo || '/teamlogo.png'}
                          alt={teamB?.name || 'TBD'}
                          style={{ width: '32px', height: '32px', marginBottom: '0.25rem', objectFit: 'contain' }}
                        />
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