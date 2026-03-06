import styles from './Weather.module.css'

function Weather({ weather }) {
    if (!weather) return null;

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>Weather</h3>

            <div className={styles.grid}>
                <div className={styles.item}>
                    <span className={styles.label}>Air</span>
                    <span className={styles.value}>{weather.air_temperature ?? '—'}°C</span>
                </div>
                <div className={styles.item}>
                    <span className={styles.label}>Track</span>
                    <span className={styles.value}>{weather.track_temperature ?? '—'}°C</span>
                </div>
                <div className={styles.item}>
                    <span className={styles.label}>Humidity</span>
                    <span className={styles.value}>{weather.humidity ?? '—'}%</span>
                </div>
                <div className={styles.item}>
                    <span className={styles.label}>Wind</span>
                    <span className={styles.value}>{weather.wind_speed ?? '—'} m/s</span>
                </div>
                <div className={styles.item}>
                    <span className={styles.label}>Rain</span>
                    <span className={`${styles.value} ${weather.rainfall ? styles.rain : ''}`}>
            {weather.rainfall ? 'YES' : 'NO'}
          </span>
                </div>
            </div>
        </div>
    )
}

export default Weather;