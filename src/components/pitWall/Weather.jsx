import { useMemo } from "react";
import styles from './Weather.module.css'


function Component({ weather, ct }) {
    const currentWeather = useMemo(() => {
        return weather
            .filter(w => new Date(w.date) <= ct)
            .at(-1);
    }, [weather, ct]);

    return <Weather weather={currentWeather} />;
}

function Weather({ weather }) {
    if (!weather) return null;

    function windDir(deg) {
        if (deg == null) return '';
        const dirs = ['N','NE','E','SE','S','SW','W','NW'];
        return ' ' + dirs[Math.round(deg / 45) % 8];
    }

    return (
        (weather) && (
            <div className={styles.weatherBar}>
                <div className={styles.weatherItem}>
                    <span className={styles.weatherLabel}>Air</span>
                    <span className={styles.weatherValue}>{weather.air_temperature ?? '—'}°C</span>
                </div>
                <div className={styles.weatherItem}>
                    <span className={styles.weatherLabel}>Track</span>
                    <span className={styles.weatherValue}>{weather.track_temperature ?? '—'}°C</span>
                </div>
                <div className={styles.weatherItem}>
                    <span className={styles.weatherLabel}>Humidity</span>
                    <span className={styles.weatherValue}>{weather.humidity ?? '—'}%</span>
                </div>
                <div className={styles.weatherItem}>
                    <span className={styles.weatherLabel}>Wind</span>
                    <span className={styles.weatherValue}>
                            {weather.wind_speed ?? '—'} m/s{windDir(weather.wind_direction)}
                        </span>
                </div>
                <div className={styles.weatherItem}>
                    <span className={styles.weatherLabel}>Pressure</span>
                    <span className={styles.weatherValue}>{weather.pressure != null ? `${weather.pressure} hPa` : '—'}</span>
                </div>
                <div className={styles.weatherItem}>
                    <span className={styles.weatherLabel}>Rain</span>
                    <span className={`${styles.weatherValue} ${weather.rainfall ? styles.weatherValueRain : styles.weatherDim}`}>
                            {weather.rainfall ? '⛆ YES' : 'NO'}
                        </span>
                </div>
            </div>
        )
    )
}

export default Weather;