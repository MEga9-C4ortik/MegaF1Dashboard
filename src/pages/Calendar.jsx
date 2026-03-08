import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import useRaces from '../hooks/useRaces';
import styles from './Calendar.module.css';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();

function NextRaceCard({ race, year }) {
    const navigate = useNavigate();

    return (
        <div className={styles.nextCard}>
            <div className={styles.nextCardHeader}>
                <div className={styles.nextCardLeft}>
                    <span className={styles.nextBadge}>NEXT</span>
                    <span className={styles.nextRound}>ROUND {String(race.round).padStart(2, '0')}</span>
                    <span className={styles.nextCountry}>{race.Circuit.Location.country}</span>
                    <h2 className={styles.nextRaceName}>{race.raceName}</h2>
                    <span className={styles.nextCircuit}>{race.Circuit.circuitName}</span>
                    <span className={styles.nextDate}>{formatDate(race.date)}</span>
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
        </div>
    );
}

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

            {nextRoundIndex !== -1 && (
                <NextRaceCard race={races[nextRoundIndex]} year={year} />
            )}

            <div className={styles.grid}>
                {races.map((race, index) => {
                    if (index === nextRoundIndex) return null;
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