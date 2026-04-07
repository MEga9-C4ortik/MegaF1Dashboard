import { useEffect, useState } from 'react';
import styles from './LiveTower.module.css'

function getLatestPositions(positions) {
    const map = {};
    positions.forEach(p => {
        if (!map[p.driver_number] || p.date > map[p.driver_number].date) {
            map[p.driver_number] = p;
        }
    });
    return Object.values(map).sort((a, b) => a.position - b.position);
}

function getCurrentStint(stints, laps, driverNumber, currentTime) {
    const driverStints = stints
        .filter(s => s.driver_number === driverNumber)
        .sort((a, b) => a.stint_number - b.stint_number);

    if (!driverStints.length) return null;
    if (!currentTime) return driverStints[driverStints.length - 1];

    const driverLaps = laps
        .filter(l => l.driver_number === driverNumber && l.lap_duration != null)
        .filter(l => l.date_start && new Date(l.date_start) <= currentTime)
        .sort((a, b) => b.lap_number - a.lap_number);

    const currentLapNumber = driverLaps[0]?.lap_number ?? 0;

    let activeStint = driverStints[0];
    for (const stint of driverStints) {
        if (stint.lap_start <= currentLapNumber) activeStint = stint;
    }
    return activeStint;
}

function getCurrentTyreAge(laps, driverNumber, stint, currentTime) {
    if (!stint) return null;

    let driverLaps = laps.filter(l =>
        l.driver_number === driverNumber && l.lap_duration != null
    );
    driverLaps = driverLaps.filter(l =>
        !currentTime || (l.date_start && new Date(l.date_start) <= currentTime)
    );

    const stintLaps = driverLaps.filter(l => l.lap_number >= stint.lap_start);
    return (stint.tyre_age_at_start ?? 0) + stintLaps.length;
}

function getLatestInterval(intervals, driverNumber) {
    const driverIntervals = intervals.filter(i => i.driver_number === driverNumber);
    if (!driverIntervals.length) return null;
    return driverIntervals.reduce((latest, cur) =>
        cur.date > latest.date ? cur : latest
    );
}

function getLastLap(laps, driverNumber, currentTime) {
    let driverLaps = laps.filter(
        l => l.driver_number === driverNumber && l.lap_duration != null
    );
    driverLaps = driverLaps.filter(l =>
        !currentTime || (l.date_start && new Date(l.date_start) <= currentTime)
    );
    if (!driverLaps.length) return null;
    return driverLaps.reduce((a, b) => b.lap_number > a.lap_number ? b : a);
}

function getBestLap(laps, driverNumber, currentTime) {
    let driverLaps = laps.filter(
        l => l.driver_number === driverNumber && l.lap_duration != null
    );
    driverLaps = driverLaps.filter(l =>
        !currentTime || (l.date_start && new Date(l.date_start) <= currentTime)
    );
    if (!driverLaps.length) return null;
    return driverLaps.reduce((best, cur) =>
        cur.lap_duration < best.lap_duration ? cur : best
    );
}

function getSessionBestLapTime(laps, currentTime) {
    let validLaps = laps.filter(l => l.lap_duration != null);
    validLaps = validLaps.filter(l =>
        !currentTime || (l.date_start && new Date(l.date_start) <= currentTime)
    );
    if (!validLaps.length) return null;
    return validLaps.reduce((min, cur) => cur.lap_duration < min ? cur.lap_duration : min, +Infinity);
}

function getActivePit(pits, driverNumber, currentTime) {
    const ct = currentTime ?? new Date();
    return pits
        .filter(p => p.driver_number === driverNumber && p.date && new Date(p.date) <= ct)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null;
}

function formatLapTime(seconds) {
    if (seconds == null) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, '0');
    return mins > 0 ? `${mins}:${secs}` : `${secs}`;
}

function formatGap(value) {
    if (value == null) return '—';
    if (typeof value === 'string') return value;
    return `+${value.toFixed(3)}`;
}

const tyreColors = {
    'SOFT':         '#e10600',
    'MEDIUM':       '#ffc800',
    'HARD':         '#ffffff',
    'INTERMEDIATE': '#39b54a',
    'WET':          '#0067ff',
};

function TyreIcon({ compound }) {
    const color = tyreColors[compound] ?? '#888';
    return (
        <span className={styles.tyre} style={{ borderColor: color, color }}>
            {compound?.[0] ?? '?'}
        </span>
    );
}

function PitTimer({ pit, currentTime }) {
    const [elapsed, setElapsed] = useState(0);

    const inT    = pit?.date ? new Date(pit.date).getTime() : null;
    const isDone = pit?.pit_duration != null;

    useEffect(() => {
        if (!inT) return;
        if (isDone) {
            setElapsed(pit.pit_duration);
            return;
        }
        if (currentTime) {
            const ct = currentTime instanceof Date ? currentTime.getTime() : new Date(currentTime).getTime();
            setElapsed(Math.max(0, (ct - inT) / 1000));
            return;
        }
        const tick = () => setElapsed(Math.max(0, (Date.now() - inT) / 1000));
        tick();
        const timer = setInterval(tick, 100);
        return () => clearInterval(timer);
    }, [inT, isDone, currentTime, pit]);

    return (
        <span className={isDone ? styles.pitTimeDone : styles.pitTimeLive}>
            {elapsed.toFixed(1)}s
        </span>
    );
}

function LiveTower({ positions, drivers, stints, intervals, laps, pits, currentTime }) {
    if (!positions || !drivers) return null;

    const latest = getLatestPositions(positions);
    const totalRaceLaps = laps.length > 0
        ? laps.reduce((max, l) => l.lap_number > max ? l.lap_number : max, 0)
        : null;
    const currentLap = laps.length > 0
        ? laps.reduce((max, l) => (l.lap_number > max && l.dateStart <= currentTime)
            ? l.lap_number : max, 0)
        : null;

    const driversMap = {};
    drivers.forEach(d => { driversMap[d.driver_number] = d; });

    const inPitNow = new Set();
    pits.forEach(p => {
        if (!p.date || p.pit_duration == null) return;
        const inT = new Date(p.date).getTime();
        const outT = inT + p.pit_duration * 1000;
        const ct = currentTime?.getTime() ?? Date.now();
        if (inT <= ct && outT > ct) inPitNow.add(p.driver_number);
    });

    const sessionBestTime = getSessionBestLapTime(laps, currentTime);

    if (latest.length === 0) {
        return <p className={styles.empty}>Waiting for data...</p>;
    }

    return (
        <div className={styles.tower}>
            <div className={styles.colHeader}>
                <span>POS</span>
                <span>DRIVER</span>
                <span>TYRE</span>
                <span>LAP / BEST</span>
                <span>GAP / LEAD</span>
            </div>

            <div className={styles.lapCounter}>
                LAP {currentLap ?? 0} / {totalRaceLaps ?? '—'}
            </div>

            <div className={styles.towerBody}>
                {latest.map((pos, index) => {
                    const driver    = driversMap[pos.driver_number];
                    const stint     = getCurrentStint(stints, laps, pos.driver_number, currentTime);
                    const tyreAge   = getCurrentTyreAge(laps, pos.driver_number, stint, currentTime);
                    const interval  = getLatestInterval(intervals, pos.driver_number);
                    const lastLap   = getLastLap(laps, pos.driver_number, currentTime);
                    const bestLap   = getBestLap(laps, pos.driver_number, currentTime);
                    const isInPit   = inPitNow.has(pos.driver_number);
                    const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';

                    const activePit = isInPit
                        ? getActivePit(pits, pos.driver_number, currentTime)
                        : null;

                    const isPurple = bestLap && sessionBestTime != null
                        && bestLap.lap_duration === sessionBestTime;
                    const isPersonalBest = lastLap && bestLap
                        && lastLap.lap_number === bestLap.lap_number;
                    const lastLapColor = isPurple ? '#c084fc' : isPersonalBest ? '#4ade80' : undefined;

                    return (
                        <div
                            key={pos.driver_number}
                            className={`${styles.row} ${isInPit ? styles.rowPit : ''}`}
                            style={{ borderLeftColor: teamColor }}
                        >
                            <span className={styles.pos}>{pos.position}</span>

                            <span className={styles.driver}>
                                <span className={styles.acronym}>
                                    {driver?.name_acronym ?? pos.driver_number}
                                </span>
                                <span className={styles.team} style={{ color: teamColor }}>
                                    {driver?.team_name ?? ''}
                                </span>
                            </span>

                            <span className={styles.tyreCol}>
                                {isInPit ? (
                                    <span className={styles.pitBadge}>PIT</span>
                                ) : (
                                    <>
                                        <TyreIcon compound={stint?.compound} />
                                        <span className={styles.tyreAge}>{tyreAge ?? 0}L</span>
                                    </>
                                )}
                            </span>

                            <span className={styles.lapsCol}>
                                {isInPit && activePit ? (
                                    <>
                                        <PitTimer pit={activePit} currentTime={currentTime} />
                                        <span className={styles.bestLap}>
                                            {formatLapTime(bestLap?.lap_duration)}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.lapTime} style={{ color: lastLapColor }}>
                                            {formatLapTime(lastLap?.lap_duration)}
                                        </span>
                                        <span className={styles.bestLap} style={{ color: isPurple ? '#c084fc' : undefined }}>
                                            {formatLapTime(bestLap?.lap_duration)}
                                        </span>
                                    </>
                                )}
                            </span>

                            <span className={styles.gapsCol}>
                                <span className={styles.interval}>
                                    {index === 0 ? 'LEADER' : formatGap(interval?.interval)}
                                </span>
                                <span className={styles.gap}>
                                    {index === 0 ? '' : formatGap(interval?.gap_to_leader)}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default LiveTower;