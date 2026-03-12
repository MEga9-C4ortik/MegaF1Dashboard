import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import useRaces from '../hooks/useRaces';
import { fetchRaceResult } from '../services/JolpiApi';
import styles from './Calendar.module.css';

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase();

const formatSessionDate = (date, time) => {
    if (!date) return '—';
    const dt = new Date(`${date}T${time ?? '00:00:00Z'}`);
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()
        + '  '
        + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

function buildSchedule(race) {
    if (!race) return [];
    const sessions = [];
    if (race.FirstPractice?.date)
        sessions.push({ key: 'fp1', label: 'Practice 1', date: race.FirstPractice.date, time: race.FirstPractice.time });
    if (race.ThirdPractice?.date) {
        sessions.push({ key: 'fp2', label: 'Practice 2', date: race.SecondPractice?.date, time: race.SecondPractice?.time });
        sessions.push({ key: 'fp3', label: 'Practice 3', date: race.ThirdPractice.date, time: race.ThirdPractice.time });
    } else if (!race.SecondPractice?.date) {
        sessions.push({ key: 'sprintQuali', label: 'Sprint Qualifying', date: race.SprintQualifying?.date, time: race.SprintQualifying.time });
    }
    if (race.Sprint?.date)
        sessions.push({ key: 'sprint', label: 'Sprint', date: race.Sprint.date, time: race.Sprint.time });
    if (race.Qualifying?.date)
        sessions.push({ key: 'quali', label: 'Qualifying', date: race.Qualifying.date, time: race.Qualifying.time });
    sessions.push({ key: 'race', label: 'Race', date: race.date, time: race.time });
    return sessions.sort((a, b) =>
        new Date(`${a.date}T${a.time ?? '00:00:00Z'}`) - new Date(`${b.date}T${b.time ?? '00:00:00Z'}`)
    );
}

function useCountdown(targetDate, targetTime) {
    const [left, setLeft] = useState(null);
    useEffect(() => {
        if (!targetDate) { setLeft(null); return; }
        const target = new Date(`${targetDate}T${targetTime ?? '00:00:00Z'}`);
        const tick = () => {
            const diff = target - Date.now();
            if (diff <= 0) { setLeft(null); return; }
            setLeft({
                days:  Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                mins:  Math.floor((diff % 3600000) / 60000),
                secs:  Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [targetDate, targetTime]);
    return left;
}

function NextRaceHero({ race, year }) {
    const navigate = useNavigate();
    const today = Date.now();
    const schedule = buildSchedule(race);
    const nextSession = schedule.find(s => new Date(`${s.date}T${s.time ?? '00:00:00Z'}`) > today);
    const countdown = useCountdown(nextSession?.date, nextSession?.time);

    return (
        <div className={styles.hero}>
            <div className={styles.heroTop}>
                <div className={styles.heroMeta}>
                    <span className={styles.heroBadge}>NEXT</span>
                    <span className={styles.heroRound}>ROUND {String(race.round).padStart(2, '0')}</span>
                </div>
                <button
                    className={styles.heroDetailsBtn}
                    onClick={() => navigate(`/race/${year}-${race.round}`)}
                >
                    Full Details →
                </button>
            </div>

            <div className={styles.heroInfo}>
                <span className={styles.heroCountry}>{race.Circuit.Location.country}</span>
                <h2 className={styles.heroRaceName}>{race.raceName}</h2>
                <span className={styles.heroCircuit}>{race.Circuit.circuitName}</span>
            </div>

            {countdown && nextSession && (
                <div className={styles.heroCountdown}>
                    <span className={styles.heroCountdownLabel}>{nextSession.label} starts in</span>
                    <span className={styles.heroCountdownTime}>
                        {countdown.days > 0 && <><b>{countdown.days}</b>d </>}
                        <b>{String(countdown.hours).padStart(2, '0')}</b>h{' '}
                        <b>{String(countdown.mins).padStart(2, '0')}</b>m{' '}
                        <b>{String(countdown.secs).padStart(2, '0')}</b>s
                    </span>
                </div>
            )}

            <div className={styles.heroSchedule}>
                {schedule.map(s => {
                    const isDone = new Date(`${s.date}T${s.time ?? '00:00:00Z'}`) < today;
                    const isNext = s.key === nextSession?.key;
                    return (
                        <div key={s.key} className={clsx(
                            styles.heroSchedRow,
                            isDone && styles.heroSchedDone,
                            isNext && styles.heroSchedNext,
                        )}>
                            <span className={styles.heroSchedLabel}>{s.label}</span>
                            <span className={styles.heroSchedDate}>{formatSessionDate(s.date, s.time)}</span>
                            <span className={clsx(
                                styles.heroSchedBadge,
                                isDone ? styles.badgeDone : isNext ? styles.badgeNext : styles.badgeUpcoming
                            )}>
                                {isDone ? 'Done' : isNext ? 'Next' : 'Upcoming'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MiniSchedule({ race }) {
    const schedule = buildSchedule(race);
    const today = Date.now();
    return (
        <div className={styles.miniSchedule}>
            {schedule.map(s => {
                const isDone = new Date(`${s.date}T${s.time ?? '00:00:00Z'}`) < today;
                return (
                    <div key={s.key} className={clsx(styles.miniRow, isDone && styles.miniRowDone)}>
                        <span className={styles.miniLabel}>{s.label}</span>
                        <span className={styles.miniDate}>
                            {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

async function resolveNextRoundIndex(races, year) {
    const today = new Date();
    const firstUpcoming = races.findIndex(r => new Date(r.date) >= today);
    if (firstUpcoming === -1) return -1;
    const lastPassed = firstUpcoming - 1;
    if (lastPassed < 0) return firstUpcoming;
    try {
        const result = await fetchRaceResult(year, races[lastPassed].round);
        if (!result) return lastPassed;
    } catch {
        return lastPassed;
    }
    return firstUpcoming;
}

function Calendar({ year }) {
    const { races, loading, error } = useRaces(year);
    const navigate = useNavigate();
    const [nextRoundIndex, setNextRoundIndex] = useState(-1);
    const [resolving, setResolving] = useState(true);

    useEffect(() => {
        if (loading || !races.length) return;
        setResolving(true);
        resolveNextRoundIndex(races, year)
            .then(setNextRoundIndex)
            .finally(() => setResolving(false));
    }, [races, loading, year]);

    if (loading || resolving) return <p className={styles.loading}>Loading...</p>;
    if (error) return <p className={styles.error}>Error: {error}</p>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Season {year}</h1>
                <span className={styles.subtitle}>{races.length} ROUNDS</span>
            </div>

            {nextRoundIndex !== -1 && (
                <NextRaceHero race={races[nextRoundIndex]} year={year} />
            )}

            <div className={styles.grid}>
                {races.map((race, index) => {
                    const isNext     = index === nextRoundIndex;
                    const isPast     = nextRoundIndex === -1 ? true : index < nextRoundIndex;
                    const isUpcoming = !isPast && !isNext;

                    return (
                        <div
                            key={race.round}
                            className={clsx(
                                styles.card,
                                isPast     && styles.cardPast,
                                isNext     && styles.cardNext,
                                isUpcoming && styles.cardUpcoming,
                            )}
                            onClick={() => navigate(`/race/${year}-${race.round}`)}
                        >
                            <div className={styles.cardTop}>
                                <span className={styles.round}>
                                    ROUND {String(race.round).padStart(2, '0')}
                                </span>
                                <span className={clsx(
                                    styles.badge,
                                    isPast ? styles.badgeDone :
                                        isNext ? styles.badgeNext : styles.badgeUpcoming
                                )}>
                                    {isPast ? 'Done' : isNext ? 'Next' : 'Upcoming'}
                                </span>
                            </div>

                            <span className={styles.country}>{race.Circuit.Location.country}</span>
                            <h3 className={styles.raceName}>{race.raceName}</h3>
                            <p className={styles.circuit}>{race.Circuit.circuitName}</p>

                            {!isPast ? (
                                <div className={styles.cardBottom}>
                                    <MiniSchedule race={race} />
                                    <button
                                        className={styles.detailsBtn}
                                        onClick={e => {
                                            e.stopPropagation();
                                            navigate(`/race/${year}-${race.round}`);
                                        }}
                                    >
                                        Details →
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.dateRow}>
                                    <span className={styles.date}>{formatDate(race.date)}</span>
                                    <button
                                        className={styles.detailsBtn}
                                        onClick={e => {
                                            e.stopPropagation();
                                            navigate(`/race/${year}-${race.round}`);
                                        }}
                                    >
                                        Details →
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Calendar;