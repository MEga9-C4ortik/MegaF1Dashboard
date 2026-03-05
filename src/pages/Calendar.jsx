import clsx from 'clsx';
import { useNavigate } from "react-router-dom";
import useRaces from '../hooks/useRaces'
import styles from './Calendar.module.css'

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase()
}

function Calendar({ year }) {
    const { races, loading, error } = useRaces(year);
    const navigate = useNavigate();

    if (loading) return <p className={styles.loading}>Loading...</p>;
    if (error) return <p className={styles.error}>Error: {error}</p>;

    const today = new Date();
    const nextRoundIndex = races.findIndex(r => new Date(r.date) >= today);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Season {year}</h1>
                <span className={styles.subtitle}>{races.length} ROUNDS</span>
            </div>

            <div className={styles.grid}>
                {races.map((race, index) => {
                    const isPast = new Date(race.date) < today
                    const isNext = index === nextRoundIndex

                    return (
                        <div
                            key={race.round}
                            className={clsx(
                                styles.card,
                                isPast && styles.cardPast,
                                isNext && styles.cardNext
                            )}
                        >
                            <div className={styles.cardTop}>
                                <span className={styles.round}>ROUND {String(race.round).padStart(2, '0')}</span>
                                <span className={clsx(
                                    styles.badge,
                                    isNext ? styles.badgeNext : isPast ? styles.badgeDone : styles.badgeUpcoming
                                )}>
                  {isNext ? 'Next' : isPast ? 'Done' : 'Upcoming'}
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
                    )
                })}
            </div>
        </div>
    );
}

export default Calendar;