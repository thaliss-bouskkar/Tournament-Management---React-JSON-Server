import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, Trophy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { matchService, teamService } from '../services/api';

const CalendarStatusBadge = ({ status }) => {
  const badges = {
    live: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-600 border border-red-200">
        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
        LIVE
      </span>
    ),
    finished: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle size={10} /> Finished
      </span>
    ),
    locked: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600 border border-gray-200">
        <Trophy size={10} /> Locked
      </span>
    ),
    upcoming: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent/10 text-accent-dark border border-accent/20">
        <Clock size={10} /> Upcoming
      </span>
    )
  };
  return badges[status] || badges.upcoming;
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
          teamService.getAll()
        ]);

        const sortedMatches = (mRes.data || []).sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return (a.startTime || '').localeCompare(b.startTime || '');
        });

        setMatches(sortedMatches);
        setTeams(tRes.data || []);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = [];
    acc[match.date].push(match);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-gray-500 font-medium tracking-wide">Loading tournament schedule...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-primary border-l-8 border-accent pl-4">
          Match Calendar
        </h2>
        <p className="text-gray-500 text-lg">Never miss a moment of the action.</p>
      </div>

      {Object.keys(groupedMatches).length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
            <CalendarIcon size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary mb-2">No Matches Scheduled</h3>
            <p className="text-gray-500">The tournament schedule is being finalized. Check back soon!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.keys(groupedMatches).map(date => {
            const isValidDate = !isNaN(new Date(date).getTime());
            const dateDisplay = isValidDate
              ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : 'Date Pending';

            return (
              <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6 sticky top-24 z-30 bg-bg-light/80 backdrop-blur-md py-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <CalendarIcon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-primary tracking-tight">{dateDisplay}</h3>
                  <div className="flex-1 h-px bg-gray-200 hidden md:block"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedMatches[date].map(match => {
                    const teamA = teams.find(t => t.id === match.teamAId);
                    const teamB = teams.find(t => t.id === match.teamBId);
                    const isLive = match.status === 'live';
                    const isFinished = match.status === 'finished' || match.status === 'locked';
                    const showScore = isLive || isFinished;

                    return (
                      <div key={match.id} className={`group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border-l-4 ${isLive ? 'border-red-500 shadow-red-500/10' : isFinished ? 'border-emerald-500' : 'border-gray-200 hover:border-accent'}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                              <img src={teamA?.logo || '/teamlogo.png'} alt="" className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-xs font-bold text-primary line-clamp-1">{teamA?.name || 'TBD'}</span>
                          </div>

                          <div className="flex-1 flex flex-col items-center space-y-3">
                            {showScore ? (
                              <div className={`px-3 py-1.5 rounded-lg font-black text-lg ${isLive ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-primary'}`}>
                                {match.scoreA} — {match.scoreB}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-black text-primary bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Clock size={12} className="text-accent" />
                                {match.startTime || 'TBD'}
                              </div>
                            )}
                            <CalendarStatusBadge status={match.status} />
                          </div>

                          <div className="flex-1 flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                              <img src={teamB?.logo || '/teamlogo.png'} alt="" className="max-w-full max-h-full object-contain" />
                            </div>
                            <span className="text-xs font-bold text-primary line-clamp-1">{teamB?.name || 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;