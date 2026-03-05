import useRaces from '../hooks/useRaces'
import styles from './Calendar.module.css'

function Calendar({ year }) {
    const { races, loading, error } = useRaces(year);

    if (loading) return <p className={styles.loading}>Loading...</p>;
    if (error) return <p className={styles.error}>Error: {error}</p>;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Calendar {year}</h1>

            <div className={styles.main}>
                {races.map(race => (
                    <div key={race.round} className={styles.card}>
                        <p className={styles.round}>Round {race.round}</p>
                        <h3 className={styles.raceName}>{race.raceName}</h3>
                        <p className={styles.circuit}>{race.Circuit.circuitName} ({race.Circuit.Location.country})</p>
                        <p className={styles.date}>{race.date}</p>
                        <button className={styles.btn}>View details</button>
                    </div>
                ))};
            </div>
        </div>
    );
}

export default Calendar;