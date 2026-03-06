import useTrackMap from '../../hooks/useMap'
import styles from './Map.module.css'

function Map({ sessionKey, drivers }) {
    const { trackPath, driverDots, loading, W, H } = useTrackMap(sessionKey, drivers)

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Track Map</h3>
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
                            <path d={trackPath} fill="none" stroke="#1a1a1a" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={trackPath} fill="none" stroke="#2a2a2a" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={trackPath} fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 8" />
                        </>}

                        {driverDots.map(dot => (
                            <g key={dot.driver_number}>
                                <circle cx={dot.px} cy={dot.py} r={10} fill={dot.color} opacity={0.15} />
                                <circle cx={dot.px} cy={dot.py} r={6} fill={dot.color} stroke="#0a0a0a" strokeWidth={1.5} />
                                <text x={dot.px} y={dot.py - 10} textAnchor="middle" fontSize="8" fill={dot.color} fontFamily="JetBrains Mono, monospace" fontWeight="700">
                                    {dot.acronym}
                                </text>
                            </g>
                        ))}
                    </svg>
                )}
            </div>
        </div>
    );
}

export default Map;