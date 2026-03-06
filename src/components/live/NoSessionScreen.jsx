import { useState, useEffect } from 'react'
import useRaces from '../../hooks/useRaces'
import styles from './NoSessionScreen.module.css'

function useCountdown(targetDate) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!targetDate) return;

        const tick = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) {
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            });
        }

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
}

function NoSessionScreen({ session }) {
    const currentYear = new Date().getFullYear();
    const { races, loading } = useRaces(currentYear);

    const today = new Date();
    const nextRace = races.find(r => new Date(r.date) >= today);

    const countdown = useCountdown(nextRace ? `${nextRace.date}T${nextRace.time || '12:00:00'}` : null);

    const lastSessionName = session?.session_name ?? 'Unknown';
    const lastCircuit = session?.circuit_short_name ?? '';

    return (
        <div className={styles.screen}>
            {session && (
                <div className={styles.lastSession}>
                    <span className={styles.label}>Last session</span>
                    <span className={styles.sessionName}>{lastSessionName} — {lastCircuit}</span>
                </div>
            )}

            <div className={styles.status}>
                <div className={styles.dot} />
                <span>No active session</span>
            </div>

            {!loading && nextRace && (
                <div className={styles.nextRace}>
                    <span className={styles.nextLabel}>Next Race</span>
                    <span className={styles.nextName}>{nextRace.raceName}</span>
                    <span className={styles.nextCircuit}>
                        {nextRace.Circuit?.circuitName} · {nextRace.Circuit?.Location?.country}
                    </span>

                    {countdown && (
                        <div className={styles.countdown}>
                            <div className={styles.countdownItem}>
                                <span className={styles.countdownNum}>{String(countdown.days).padStart(2, '0')}</span>
                                <span className={styles.countdownLabel}>Days</span>
                            </div>
                            <div className={styles.countdownSep}>:</div>
                            <div className={styles.countdownItem}>
                                <span className={styles.countdownNum}>{String(countdown.hours).padStart(2, '0')}</span>
                                <span className={styles.countdownLabel}>Hours</span>
                            </div>
                            <div className={styles.countdownSep}>:</div>
                            <div className={styles.countdownItem}>
                                <span className={styles.countdownNum}>{String(countdown.minutes).padStart(2, '0')}</span>
                                <span className={styles.countdownLabel}>Min</span>
                            </div>
                            <div className={styles.countdownSep}>:</div>
                            <div className={styles.countdownItem}>
                                <span className={styles.countdownNum}>{String(countdown.seconds).padStart(2, '0')}</span>
                                <span className={styles.countdownLabel}>Sec</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NoSessionScreen;