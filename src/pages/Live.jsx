import { useState } from "react";
import useLiveSession from '../hooks/useLiveSession'
import useLiveData from '../hooks/useLiveData'
import NoSessionScreen from '../components/live/NoSessionScreen'
import LiveTower from '../components/live/LiveTower'
import FiaMessages from '../components/live/FiaMessages'
import Weather from '../components/live/Weather'
import RadioMessages from '../components/live/RadioMessages'
import Map from '../components/live/Map'
import styles from './Live.module.css'

function Live() {
    const { session, sessions, isLive, loading: sessionLoading } = useLiveSession();
    const [selectedSessionKey, setSelectedSessionKey] = useState(null);
    const activeSessionKey = selectedSessionKey ?? session?.session_key;

    const {
        positions, intervals, drivers,
        stints, pits, fiaMessages, radio,
        weather, loading: dataLoading
    } = useLiveData(activeSessionKey);

    if (sessionLoading) return <p className={styles.loading}>Connecting...</p>;

    if (!isLive && !selectedSessionKey) return (
        <div className={styles.page}>
            <div className={styles.header}>
                {sessions.length > 0 && (
                    <div className={styles.sessionTabs}>
                        {sessions.map(s => (
                            <button
                                key={s.session_key}
                                className={`${styles.sessionTab} ${activeSessionKey === s.session_key ? styles.sessionTabActive : ''}`}
                                onClick={() => setSelectedSessionKey(s.session_key)}
                            >
                                {s.session_name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <NoSessionScreen session={session} />
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.live}>
                    <span className={styles.liveDot} />
                    {isLive && !selectedSessionKey ? 'LIVE' : 'REPLAY'}
                </div>
                <span className={styles.sessionName}>
                    {session?.session_name} — {session?.circuit_short_name}
                </span>

                {sessions.length > 0 && (
                    <div className={styles.sessionTabs}>
                        {sessions.map(s => (
                            <button
                                key={s.session_key}
                                className={`${styles.sessionTab} ${activeSessionKey === s.session_key ? styles.sessionTabActive : ''}`}
                                onClick={() => setSelectedSessionKey(s.session_key)}
                            >
                                {s.session_name}
                            </button>
                        ))}
                    </div>
                )}

                <Weather weather={weather} />
            </div>

            {dataLoading ? (
                <span className={styles.loading}>Loading live data...</span>
            ) : (
                <div className={styles.content}>
                    <div className={styles.left}>
                        {positions.length > 0 && drivers.length > 0
                            ? <LiveTower
                                positions={positions}
                                drivers={drivers}
                                stints={stints}
                                intervals={intervals}
                                pits={pits}
                            />
                            : <p style={{color:'#333', padding:'40px', fontFamily:'JetBrains Mono', fontSize:12, letterSpacing:2}}>
                                NO DATA FOR THIS SESSION
                            </p>
                        }
                    </div>

                    <div className={styles.right}>
                        <Map sessionKey={activeSessionKey} drivers={drivers} />
                        <FiaMessages messages={fiaMessages} />
                        <RadioMessages messages={radio} drivers={drivers} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Live;