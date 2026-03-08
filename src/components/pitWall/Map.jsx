import useTrackMap from '../../hooks/useMap'
import styles from './Map.module.css'

function DriverDot({ dot }) {
    const hasColor = dot.color != null;
    const color    = hasColor ? dot.color : '#666';
    const label    = dot.acronym ?? String(dot.number);
    const fontSize = dot.acronym ? 9 : 8;

    return (
        <g key={dot.driver_number}>
            <circle cx={dot.px} cy={dot.py} r={16} fill={color} opacity={hasColor ? 0.12 : 0.06} />
            <circle cx={dot.px} cy={dot.py} r={8} fill={color} stroke="#050505" strokeWidth={2} />
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
    const { trackPath, driverDots, loading, W, H } = useTrackMap(sessionKey, drivers, replayTime)

    return (
        <div className={styles.container}>
            <div className={styles.mapWrapper}>
                {loading ? (
                    <p className={styles.loading}>Loading track...</p>
                ) : (
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
                )}
            </div>
        </div>
    );
}

export default Map;