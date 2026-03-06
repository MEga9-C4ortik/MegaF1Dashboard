import styles from './LiveTower.module.css'

function getLatestPositions(positions) {
    const map = {};
    positions.forEach(p => {
        if (!map[p.driver_number] || p.date > map[p.driver_number].date) {
            map[p.driver_number] = p
        }
    })
    return Object.values(map).sort((a, b) => a.position - b.position);
}

function getCurrentStint(stints, driverNumber) {
    const driverStints = stints
        .filter(s => s.driver_number === driverNumber)
        .sort((a, b) => b.stint_number - a.stint_number);
    return driverStints[0] ?? null;
}

const tyreColors = {
    'SOFT':     '#e10600',
    'MEDIUM':   '#ffc800',
    'HARD':     '#ffffff',
    'INTERMEDIATE': '#39b54a',
    'WET':      '#0067ff',
};

function TyreIcon({ compound }) {
    const color = tyreColors[compound] ?? '#888';
    return (
        <span className={styles.tyre} style={{ borderColor: color, color }}>
      {compound?.[0] ?? '?'}
    </span>
    );
}

function LiveTower({ positions, drivers, stints, intervals, pits }) {
    const latest = getLatestPositions(positions);

    const driversMap = {};
    drivers.forEach(d => { driversMap[d.driver_number] = d });

    const intervalsMap = {};
    intervals.forEach(i => { intervalsMap[i.driver_number] = i });

    const inPitNow = new Set(
        pits
            .filter(p => !p.pit_out_time)
            .map(p => p.driver_number)
    );

    if (latest.length === 0) {
        return <p className={styles.empty}>Waiting for data...</p>;
    }

    return (
        <div className={styles.tower}>
            <div className={styles.towerHeader}>
                <span>POS</span>
                <span>DRIVER</span>
                <span>TYRE</span>
                <span>GAP</span>
                <span>INTERVAL</span>
            </div>

            {latest.map((pos, index) => {
                const driver = driversMap[pos.driver_number]
                const stint = getCurrentStint(stints, pos.driver_number)
                const interval = intervalsMap[pos.driver_number]
                const isInPit = inPitNow.has(pos.driver_number)
                const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666'

                return (
                    <div
                        key={pos.driver_number}
                        className={`${styles.row} ${isInPit ? styles.rowPit : ''}`}
                        style={{ borderLeftColor: teamColor }}
                    >
                        <span className={styles.pos}>{pos.position}</span>

                        <span className={styles.driver}>
              <span className={styles.acronym}>{driver?.name_acronym ?? pos.driver_number}</span>
              <span className={styles.team} style={{ color: teamColor }}>
                {driver?.team_name ?? ''}
              </span>
            </span>

                        <span className={styles.tyreCell}> {isInPit ?
                            <span className={styles.pitBadge}>PIT</span>
                                : <TyreIcon compound={stint?.compound} />
              }
                            {!isInPit && stint && (
                                <span className={styles.tyreAge}>{stint.tyre_age_at_start ?? 0}L</span>
                            )}
            </span>

                        <span className={styles.gap}>
                            {index === 0 ? 'LEADER' : (interval?.gap_to_leader ?? '—')}
                        </span>

                        <span className={styles.interval}>
                            {index === 0 ? '—' : (interval?.interval ?? '—')}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export default LiveTower;