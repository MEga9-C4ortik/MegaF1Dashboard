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

    if (!currentTime) {
        return driverStints[driverStints.length - 1];
    }

    const driverLaps = laps
        .filter(l => l.driver_number === driverNumber && l.date_start != null)
        .filter(l => new Date(l.date_start) <= currentTime)
        .sort((a, b) => b.lap_number - a.lap_number);

    const currentLapNumber = driverLaps[0]?.lap_number ?? 1;

    let activeStint = driverStints[0];
    for (const stint of driverStints) {
        if (stint.lap_start <= currentLapNumber) {
            activeStint = stint;
        }
    }
    return activeStint;
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
    if (currentTime) {
        driverLaps = driverLaps.filter(l => l.date_start && new Date(l.date_start) <= currentTime);
    }
    if (!driverLaps.length) return null;
    return driverLaps.reduce((a, b) => b.lap_number > a.lap_number ? b : a);
}

function getBestLap(laps, driverNumber, currentTime) {
    let driverLaps = laps.filter(
        l => l.driver_number === driverNumber && l.lap_duration != null
    );
    if (currentTime) {
        driverLaps = driverLaps.filter(l => l.date_start && new Date(l.date_start) <= currentTime);
    }
    if (!driverLaps.length) return null;
    return driverLaps.reduce((best, cur) =>
        cur.lap_duration < best.lap_duration ? cur : best
    );
}

function getSessionBestLapTime(laps, currentTime) {
    let validLaps = laps.filter(l => l.lap_duration != null);
    if (currentTime) {
        validLaps = validLaps.filter(l => l.date_start && new Date(l.date_start) <= currentTime);
    }
    if (!validLaps.length) return null;
    return Math.min(...validLaps.map(l => l.lap_duration));
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

// currentTime передаётся только в replay режиме
function LiveTower({ positions, drivers, stints, intervals, laps, pits, currentTime }) {
    if (!positions || !drivers) return null;
    const latest = getLatestPositions(positions);

    const driversMap = {};
    drivers.forEach(d => { driversMap[d.driver_number] = d; });

    // В replay: пит-стопы только те что уже случились
    const relevantPits = currentTime
        ? pits.filter(p => p.pit_in_time && new Date(p.pit_in_time) <= currentTime)
        : pits;

    // Кто сейчас в пите: пит без pit_out_time ИЛИ pit_out_time после currentTime
    const inPitNow = new Set(
        relevantPits
            .filter(p => !p.pit_out_time || (currentTime && new Date(p.pit_out_time) > currentTime))
            .map(p => p.driver_number)
    );

    const sessionBestTime = getSessionBestLapTime(laps, currentTime);

    if (latest.length === 0) {
        return <p className={styles.empty}>Waiting for data...</p>;
    }

    return (
        <div className={styles.tower}>
            <div className={styles.towerHeader}>
                <span>POS</span>
                <span>DRIVER</span>
                <span>TYRE</span>
                <span>LAST LAP</span>
                <span>BEST LAP</span>
                <span>GAP</span>
                <span>INTERVAL</span>
            </div>

            {latest.map((pos, index) => {
                const driver    = driversMap[pos.driver_number];
                const stint     = getCurrentStint(stints, laps, pos.driver_number, currentTime);
                const interval  = getLatestInterval(intervals, pos.driver_number);
                const lastLap   = getLastLap(laps, pos.driver_number, currentTime);
                const bestLap   = getBestLap(laps, pos.driver_number, currentTime);
                const isInPit   = inPitNow.has(pos.driver_number);
                const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666';

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
                            <span className={styles.acronym}>{driver?.name_acronym ?? pos.driver_number}</span>
                            <span className={styles.team} style={{ color: teamColor }}>{driver?.team_name ?? ''}</span>
                        </span>

                        <span className={styles.tyreCell}>
                            {isInPit
                                ? <span className={styles.pitBadge}>PIT</span>
                                : <TyreIcon compound={stint?.compound} />
                            }
                            {!isInPit && stint && (
                                <span className={styles.tyreAge}>{stint.tyre_age_at_start ?? 0}L</span>
                            )}
                        </span>

                        <span className={styles.lapTime} style={{ color: lastLapColor }}>
                            {formatLapTime(lastLap?.lap_duration)}
                        </span>

                        <span className={styles.bestLap} style={{ color: isPurple ? '#c084fc' : undefined }}>
                            {formatLapTime(bestLap?.lap_duration)}
                        </span>

                        <span className={styles.gap}>
                            {index === 0 ? 'LEADER' : formatGap(interval?.gap_to_leader)}
                        </span>

                        <span className={styles.interval}>
                            {index === 0 ? 'LEADER' : formatGap(interval?.interval)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default LiveTower;