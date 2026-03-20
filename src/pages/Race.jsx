import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import useRaces from '../hooks/useRaces'
import useRaceResult from '../hooks/useRaceResult'
import useOpenF1Sessions from '../hooks/useOpenF1Sessions'
import styles from './Race.module.css'

const formatLocal = (date, time) => {
    if (!date) return '—';
    const dt = new Date(`${date}T${time ?? '00:00:00Z'}`);
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()
        + '  '
        + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const formatLapTime = (seconds) => {
    if (seconds == null) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, '0');
    return mins > 0 ? `${mins}:${secs}` : `${secs}`;
};

const getPodiumStyle = (position) =>
    (position === '1' || position === '2' || position === '3') ? styles.podium : '';

function buildSchedule(race) {
    if (!race) return [];
    const sessions = [];

    if (race.FirstPractice?.date)
        sessions.push({ key: 'fp1', label: 'Practice 1', date: race.FirstPractice.date, time: race.FirstPractice.time });

    if (race.ThirdPractice?.date) {
        if (race.SecondPractice?.date)
            sessions.push({ key: 'fp2', label: 'Practice 2', date: race.SecondPractice.date, time: race.SecondPractice.time });
        sessions.push({ key: 'fp3', label: 'Practice 3', date: race.ThirdPractice.date, time: race.ThirdPractice.time });
    } else {
        const sqDate = race.SprintQualifying?.date ?? race.SecondPractice?.date;
        const sqTime = race.SprintQualifying?.time ?? race.SecondPractice?.time;
        if (sqDate)
            sessions.push({ key: 'sprintQuali', label: 'Sprint Qualifying', date: sqDate, time: sqTime });
    }

    if (race.Sprint?.date)
        sessions.push({ key: 'sprint', label: 'Sprint', date: race.Sprint.date, time: race.Sprint.time });
    if (race.Qualifying?.date)
        sessions.push({ key: 'quali', label: 'Qualifying', date: race.Qualifying.date, time: race.Qualifying.time });
    sessions.push({ key: 'race', label: 'Race', date: race.date, time: race.time });

    return sessions.sort((a, b) => new Date(`${a.date}T${a.time ?? '00:00:00Z'}`) - new Date(`${b.date}T${b.time ?? '00:00:00Z'}`));
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

function ScheduleBlock({ schedule }) {
    const today = Date.now();
    const nextSession = schedule.find(s => new Date(`${s.date}T${s.time ?? '00:00:00Z'}`) > today);
    const countdown = useCountdown(nextSession?.date, nextSession?.time);

    return (
        <div className={styles.scheduleBlock}>
            <div className={styles.scheduleHeader}>
                <span className={styles.blockTitle}>SCHEDULE</span>
                {countdown && nextSession && (
                    <div className={styles.countdown}>
                        <span className={styles.countdownLabel}>{nextSession.label} in</span>
                        <span className={styles.countdownTime}>
                            {countdown.days > 0 && <><b>{countdown.days}</b>d </>}
                            <b>{String(countdown.hours).padStart(2,'0')}</b>h{' '}
                            <b>{String(countdown.mins).padStart(2,'0')}</b>m{' '}
                            <b>{String(countdown.secs).padStart(2,'0')}</b>s
                        </span>
                    </div>
                )}
            </div>
            <div className={styles.scheduleList}>
                {schedule.map(s => {
                    const isDone = new Date(`${s.date}T${s.time ?? '00:00:00Z'}`) < today;
                    const isNext = s.key === nextSession?.key;
                    return (
                        <div key={s.key} className={clsx(
                            styles.scheduleRow,
                            isDone && styles.scheduleRowDone,
                            isNext && styles.scheduleRowNext,
                        )}>
                            <span className={styles.scheduleLabel}>{s.label}</span>
                            <span className={styles.scheduleDate}>{formatLocal(s.date, s.time)}</span>
                            <span className={clsx(
                                styles.scheduleBadge,
                                isDone ? styles.scheduleDone : isNext ? styles.scheduleNext : styles.scheduleUpcoming
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

const FP_SESSIONS = new Set(['fp1', 'fp2', 'fp3', 'sprintQuali']);

function ResultsTable({ session, data, fpResult }) {
    if (FP_SESSIONS.has(session)) {
        if (!fpResult) return <p className={styles.noData}>No data</p>;
        return (
            <table className={styles.table}>
                <thead><tr><th>POS</th><th>DRIVER</th><th>TEAM</th><th>BEST LAP</th></tr></thead>
                <tbody>
                {fpResult.map(r => (
                    <tr key={r.driver_number}>
                        <td className={styles.pos}>{r.position}</td>
                        <td className={styles.driver}>
                            <span className={styles.driverCode}>{r.nameAcronym}</span>
                            <span className={styles.driverName}>{r.familyName}</span>
                        </td>
                        <td className={styles.team}>{r.teamName}</td>
                        <td className={styles.time}>{formatLapTime(r.bestLap)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }

    if (!data) return <p className={styles.noData}>No data</p>;

    if (session === 'quali' || session === 'sprintQuali') {
        const results = data.QualifyingResults || [];
        return (
            <table className={styles.table}>
                <thead><tr><th>POS</th><th>DRIVER</th><th>TEAM</th><th>Q1</th><th>Q2</th><th>Q3</th></tr></thead>
                <tbody>
                {results.map(r => (
                    <tr key={r.position} className={getPodiumStyle(r.position)}>
                        <td className={styles.pos}>{r.position}</td>
                        <td className={styles.driver}>
                            <span className={styles.driverCode}>{r.Driver.code}</span>
                            <span className={styles.driverName}>{r.Driver.familyName}</span>
                        </td>
                        <td className={styles.team}>{r.Constructor.name}</td>
                        <td className={styles.time}>{r.Q1 || '—'}</td>
                        <td className={styles.time}>{r.Q2 || '—'}</td>
                        <td className={styles.time}>{r.Q3 || '—'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }

    const results = data.Results || data.SprintResults || [];
    return (
        <table className={styles.table}>
            <thead><tr><th>POS</th><th>DRIVER</th><th>TEAM</th><th>TIME</th><th>PTS</th></tr></thead>
            <tbody>
            {results.map(r => (
                <tr key={r.position} className={getPodiumStyle(r.position)}>
                    <td className={styles.pos}>{r.position}</td>
                    <td className={styles.driver}>
                        <span className={styles.driverCode}>{r.Driver.code}</span>
                        <span className={styles.driverName}>{r.Driver.familyName}</span>
                    </td>
                    <td className={styles.team}>{r.Constructor.name}</td>
                    <td className={styles.time}>{r.Time?.time || r.status || '—'}</td>
                    <td className={styles.pts}>{r.points || '—'}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

function Race() {
    const { raceId } = useParams();
    const navigate = useNavigate();
    const parts = raceId?.split("-") ?? [];
    const year = parts[0];
    const round = parts[1];

    const [activeSession, setActiveSession] = useState('race');

    const { races, loading: racesLoading } = useRaces(year);
    const { sessions, loading: resultsLoading } = useRaceResult(year, round);

    const raceInfo = sessions.race ?? races.find(r => String(r.round) === String(round));
    const raceDate = raceInfo?.date;

    const { sessionKeyMap, fpResults, loading: fpLoading } = useOpenF1Sessions(year, raceDate);

    if (!year || !round || isNaN(Number(round))) return <p className={styles.error}>Invalid race URL</p>;

    const loading = racesLoading || resultsLoading;
    if (loading) return <p className={styles.loading}>Loading...</p>;
    if (!raceInfo) return <p className={styles.error}>Race not found</p>;

    const schedule = buildSchedule(raceInfo);
    const today = Date.now();
    const raceDateTime = new Date(`${raceInfo.date}T${raceInfo.time ?? '00:00:00Z'}`);
    const isNextWeekend = raceDateTime > today || schedule.some(s => new Date(`${s.date}T${s.time ?? '00:00:00Z'}`) > today);

    const tabs = [
        { key: 'race',       label: 'Race',               data: sessions.race,   fp: null },
        { key: 'quali',      label: 'Qualification',       data: sessions.quali,  fp: null },
        { key: 'sprint',     label: 'Sprint',              data: sessions.sprint, fp: null },
        { key: 'sprintQuali', label: 'Sprint Qualifying',  data: null, fp: fpResults.sprintQuali },
        { key: 'fp3',         label: 'FP3',                data: null, fp: fpResults.fp3 },
        { key: 'fp2',         label: 'FP2',                data: null, fp: fpResults.fp2 },
        { key: 'fp1',         label: 'FP1',                data: null, fp: fpResults.fp1 },
    ].filter(tab => tab.data || (tab.fp && tab.fp.length > 0));

    const validTab = tabs.find(t => t.key === activeSession) ? activeSession : tabs[0]?.key;
    const currentTab = tabs.find(t => t.key === validTab);
    const watchSessionKey = sessionKeyMap[validTab];

    return (
        <div className={styles.page}>
            <div className={clsx(styles.header, isNextWeekend && styles.headerNext)}>
                <div className={styles.headerTop}>
                    <div>
                        {isNextWeekend && <span className={styles.nextBadge}>NEXT RACE</span>}
                        <span className={styles.round}>Round {String(round).padStart(2, '0')}</span>
                    </div>
                    {watchSessionKey && (
                        <button
                            className={styles.watchBtn}
                            onClick={() => navigate(`/pitWall?sessionKey=${watchSessionKey}`)}
                        >
                            ▶ Watch on Pit Wall
                        </button>
                    )}
                </div>

                <span className={styles.country}>{raceInfo.Circuit?.Location?.country}</span>
                <span className={styles.raceName}>{raceInfo.raceName}</span>
                <span className={styles.circuit}>
                    {raceInfo.Circuit?.circuitName} — {raceInfo.Circuit?.Location?.locality}
                </span>
            </div>

            <ScheduleBlock schedule={schedule} />

            {tabs.length > 0 && (
                <div className={styles.content}>
                    <div className={styles.btnHub}>
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                className={clsx(styles.btn, validTab === tab.key && styles.tabActive)}
                                onClick={() => setActiveSession(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                        {fpLoading && (
                            <span className={styles.fpLoading}>Loading FP data…</span>
                        )}
                    </div>
                    <div className={styles.results}>
                        <ResultsTable
                            session={validTab}
                            data={currentTab?.data}
                            fpResult={currentTab?.fp}
                        />
                    </div>
                </div>
            )}
            {tabs.length === 0 && fpLoading && (
                <p className={styles.loading}>Loading session results…</p>
            )}
        </div>
    );
}

export default Race;