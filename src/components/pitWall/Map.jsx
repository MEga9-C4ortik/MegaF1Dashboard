import useTrackMap from '../../hooks/useMap'
import styles from './Map.module.css'

function DriverDot({ dot }) {
    const hasColor = dot.color != null;
    const color    = hasColor ? dot.color : '#666';
    const label    = dot.acronym ?? String(dot.number);
    const fontSize = dot.acronym ? 9 : 8;

    return (
        <g key={dot.driver_number}>
            <circle cx={dot.px} cy={dot.py} r={16} fill={color} opacity={hasColor ? 0.12 : 0.06}
                style={{ transition: animate ? 'cx 0.5s linear, cy 0.5s linear' : 'none' }
            } />
            <circle cx={dot.px} cy={dot.py} r={8} fill={color} stroke="#050505" strokeWidth={2}
                style={{ transition: animate ? 'cx 0.5s linear, cy 0.5s linear' : 'none' }
            } />
            <text
                x={dot.px}
                y={dot.py - 13}
                textAnchor="middle"
                fontSize={fontSize}
                fill={hasColor ? color : '#555'}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
            >
                {label}
            </text>
        </g>
    );
}

function Map({ sessionKey, drivers, replayTime }) {
    const { trackPath, driverDots, trackLoading, locProgress, W, H } = useTrackMap(sessionKey, drivers, replayTime);

    const locsDone = locProgress.total > 0 && locProgress.done >= locProgress.total;
    const locsPercent = locProgress.total > 0
        ? Math.round((locProgress.done / locProgress.total) * 100)
        : 0;

    return (
        <div className={styles.container}>
            <div className={styles.mapWrapper}>
                {trackLoading ? (
                    <p className={styles.loading}>Loading track...</p>
                ) : (
                    <div className={styles.svgContainer}>
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            className={styles.svg}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {trackPath && <>
                                <path d={trackPath} fill="none" stroke="#0a0a0a"  strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
                                <path d={trackPath} fill="none" stroke="#1c1c1c"  strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
                                <path d={trackPath} fill="none" stroke="#242424"  strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
                                <path d={trackPath} fill="none" stroke="#2e2e2e"  strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 12" />
                            </>}
                            {driverDots.map(dot => (
                                <DriverDot key={dot.driver_number} dot={dot} />
                            ))}
                        </svg>

                        {!locsDone && locProgress.total > 0 && (
                            <div className={styles.locOverlay}>
                                <div className={styles.locProgressBar}>
                                    <div
                                        className={styles.locProgressFill}
                                        style={{ width: `${locsPercent}%` }}
                                    />
                                </div>
                                <span className={styles.locProgressText}>
                                    {locProgress.done}/{locProgress.total} drivers
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Map;