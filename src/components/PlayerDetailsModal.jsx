import { X, User, Trophy, BarChart, Hash, MapPin, Award, Shield } from 'lucide-react';
import footImg from './foot.png';

const PlayerDetailsModal = ({ player, team, stats, onClose }) => {
    if (!player) return null;

    const playerStats = stats || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '480px', padding: 0, overflow: 'hidden', animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Header/Profile Header */}
                <div style={{ position: 'relative', height: '160px', backgroundColor: 'var(--primary)' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))' }}></div>
                    <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' }}>
                        <X size={20} />
                    </button>

                    {/* Team Badge in background */}
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, color: 'white' }}>
                        <Shield size={180} />
                    </div>
                </div>

                {/* Profile Photo - Overlapping Header */}
                <div style={{ marginTop: '-60px', padding: '0 2rem', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '24px', backgroundColor: 'white', padding: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)', flexShrink: 0 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                            <img
                                src={player.imageUrl || footImg}
                                alt={player.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.src = footImg; }}
                            />
                        </div>
                    </div>
    
                    <div style={{ paddingBottom: '0.5rem' ,marginTop:'60px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--primary)', fontWeight: '800', lineHeight: 1.2 }}>{player.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                            <img 
                                    src={team?.logo || '/teamlogo.png'}
                                    alt="Team Logo"
                                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                                />{team?.name || 'Free Agent'}
                        </div>
                    </div>
                </div>

                {/* Info Pills */}
                <div style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '12px' }}>
                                <Hash size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Number</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>#{player.number || '00'}</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: 'rgba(6, 78, 59, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '12px' }}>
                                <MapPin size={18} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Position</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{player.position || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <h4 style={{ marginBottom: '1.25rem', color: 'var(--primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                        <BarChart size={20} color="var(--accent)" /> Tournament Performance
                    </h4>

                    {/* Rich Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem 0.5rem', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--primary)' }}>{playerStats.goals}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Goals</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem 0.5rem', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--primary)' }}>{playerStats.assists}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Assists</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem 0.5rem', border: '1px solid #f1f5f9', borderRadius: '16px', backgroundColor: 'rgba(254, 243, 199, 0.3)' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#B45309' }}>{playerStats.yellowCards}</div>
                            <div style={{ fontSize: '0.65rem', color: '#B45309', fontWeight: 'bold', textTransform: 'uppercase' }}>YC</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem 0.5rem', border: '1px solid #f1f5f9', borderRadius: '16px', backgroundColor: 'rgba(254, 226, 226, 0.3)' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#B91C1C' }}>{playerStats.redCards}</div>
                            <div style={{ fontSize: '0.65rem', color: '#B91C1C', fontWeight: 'bold', textTransform: 'uppercase' }}>RC</div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
                    <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '0.8rem', borderRadius: '14px', fontWeight: 'bold', fontSize: '1rem' }}>
                        Done Viewing
                    </button>
                </div>
            </div>

            <style>
                {`
                @keyframes modalEntry {
                    0% { transform: scale(0.9) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                `}
            </style>
        </div>
    );
};

export default PlayerDetailsModal;
