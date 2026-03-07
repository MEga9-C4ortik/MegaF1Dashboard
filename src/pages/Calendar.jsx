import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import useRaces from '../hooks/useRaces';
import useRaceResult from '../hooks/useRaceResult';
import styles from './Calendar.module.css';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();

const formatDateTime = (date, time) => {
    if (!date) return '—';
    const dt = new Date(`${date}T${time ?? '00:00:00Z'}`);
    return dt.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short'
    }).toUpperCase() + '  ' + dt.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short'
    });
};

// Строим массив сессий из объекта гонки Jolpi
function buildSchedule(race) {
    const sessions = [];
    if (race.FirstPractice?.date)  sessions.push({ key: 'fp1',    label: 'Practice 1',    date: race.FirstPractice.date,  time: race.FirstPractice.time });
    if (race.ThirdPractice?.date)  sessions.push({ key: 'fp2',    label: 'Practice 2',    date: race.SecondPractice?.date, time: race.SecondPractice?.time });
    if (race.ThirdPractice?.date)  sessions.push({ key: 'fp3',    label: 'Practice 3',    date: race.ThirdPractice.date,  time: race.ThirdPractice.time });
    if (!race.ThirdPractice?.date && race.SecondPractice?.date)
        sessions.push({ key: 'sq',     label: 'Sprint Shootout', date: race.SecondPractice.date, time: race.SecondPractice.time });
    if (race.Sprint?.date)         sessions.push({ key: 'sprint', label: 'Sprint',         date: race.Sprint.date,         time: race.Sprint.time });
    if (race.Qualifying?.date)     sessions.push({ key: 'quali',  label: 'Qualifying',     date: race.Qualifying.date,     time: race.Qualifying.time });
    sessions.push({ key: 'race',   label: 'Race',           date: race.date,                time: race.time });
    return sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ── Expanded card for next upcoming race ────────────────────────────
function NextRaceCard({ race, year }) {
    const navigate = useNavigate();
    const schedule = buildSchedule(race);
    const today = new Date();
    const { sessions: results } = useRaceResult(year, race.round);

    return (
        <div className={styles.nextCard}>
            <div className={styles.nextCardHeader}>
                <div className={styles.nextCardLeft}>
                    <span className={styles.nextBadge}>NEXT</span>
                    <span className={styles.nextRound}>ROUND {String(race.round).padStart(2, '0')}</span>
                    <span className={styles.nextCountry}>{race.Circuit.Location.country}</span>
                    <h2 className={styles.nextRaceName}>{race.raceName}</h2>
                    <span className={styles.nextCircuit}>{race.Circuit.circuitName}</span>
                </div>

                <div className={styles.nextCardRight}>
                    <button
                        className={styles.detailsBtn}
                        onClick={() => navigate(`/race/${year}-${race.round}`)}
                    >
                        Full Details →
                    </button>
                </div>
            </div>

            <div className={styles.nextCardBody}>
                {/* ── Schedule ── */}
                <div className={styles.scheduleBlock}>
                    <span className={styles.blockTitle}>SCHEDULE</span>
                    <div className={styles.scheduleList}>
                        {schedule.map(s => {
                            const isDone = new Date(s.date) < today;
                            return (
                                <div key={s.key} className={clsx(styles.scheduleRow, isDone && styles.scheduleRowDone)}>
                                    <span className={styles.scheduleLabel}>{s.label}</span>
                                    <span className={styles.scheduleDate}>{formatDateTime(s.date, s.time)}</span>
                                    <span className={clsx(styles.scheduleBadge, isDone ? styles.scheduleDone : styles.scheduleUpcoming)}>
                                        {isDone ? 'Done' : 'Upcoming'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Quali results (if already happened) ── */}
                {results.quali && (
                    <div className={styles.resultsBlock}>
                        <span className={styles.blockTitle}>QUALIFYING</span>
                        <table className={styles.miniTable}>
                            <tbody>
                            {(results.quali.QualifyingResults || []).slice(0, 10).map(r => (
                                <tr key={r.position}>
                                    <td className={styles.miniPos}>{r.position}</td>
                                    <td className={styles.miniDriver}>
                                        <span className={styles.miniCode}>{r.Driver.code}</span>
                                        <span className={styles.miniName}>{r.Driver.familyName}</span>
                                    </td>
                                    <td className={styles.miniTeam}>{r.Constructor.name}</td>
                                    <td className={styles.miniTime}>{r.Q3 || r.Q2 || r.Q1 || '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Sprint results (if happened) ── */}
                {results.sprint && (
                    <div className={styles.resultsBlock}>
                        <span className={styles.blockTitle}>SPRINT</span>
                        <table className={styles.miniTable}>
                            <tbody>
                            {(results.sprint.SprintResults || []).slice(0, 10).map(r => (
                                <tr key={r.position}>
                                    <td className={styles.miniPos}>{r.position}</td>
                                    <td className={styles.miniDriver}>
                                        <span className={styles.miniCode}>{r.Driver.code}</span>
                                        <span className={styles.miniName}>{r.Driver.familyName}</span>
                                    </td>
                                    <td className={styles.miniTeam}>{r.Constructor.name}</td>
                                    <td className={styles.miniTime}>{r.Time?.time || r.status || '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Calendar ────────────────────────────────────────────────────
function Calendar({ year }) {
    const { races, loading, error } = useRaces(year);
    const navigate = useNavigate();

    if (loading) return <p className={styles.loading}>Loading...</p>;
    if (error)   return <p className={styles.error}>Error: {error}</p>;

    const today = new Date();
    const nextRoundIndex = races.findIndex(r => new Date(r.date) >= today);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Season {year}</h1>
                <span className={styles.subtitle}>{races.length} ROUNDS</span>
            </div>

            {/* Next race — featured block */}
            {nextRoundIndex !== -1 && (
                <NextRaceCard race={races[nextRoundIndex]} year={year} />
            )}

            {/* Rest of the grid */}
            <div className={styles.grid}>
                {races.map((race, index) => {
                    if (index === nextRoundIndex) return null; // already shown above
                    const isPast = new Date(race.date) < today;
                    return (
                        <div
                            key={race.round}
                            className={clsx(styles.card, isPast && styles.cardPast)}
                        >
                            <div className={styles.cardTop}>
                                <span className={styles.round}>ROUND {String(race.round).padStart(2, '0')}</span>
                                <span className={clsx(styles.badge, isPast ? styles.badgeDone : styles.badgeUpcoming)}>
                                    {isPast ? 'Done' : 'Upcoming'}
                                </span>
                            </div>
                            <span className={styles.country}>{race.Circuit.Location.country}</span>
                            <h3 className={styles.raceName}>{race.raceName}</h3>
                            <p className={styles.circuit}>{race.Circuit.circuitName}</p>
                            <div className={styles.dateRow}>
                                <span className={styles.date}>{formatDate(race.date)}</span>
                                <button
                                    className={styles.detailsBtn}
                                    onClick={() => navigate(`/race/${year}-${race.round}`)}
                                >
                                    Details →
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Calendar;