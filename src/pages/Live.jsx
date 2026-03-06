import useLiveSession from '../hooks/useLiveSession'
import useLiveData from '../hooks/useLiveData'
import NoSessionScreen from '../components/live/NoSessionScreen'
import LiveTower from '../components/live/LiveTower'
import styles from './Live.module.css'

function Live() {
    const { session, isLive, loading: sessionLoading } = useLiveSession();
    const { positions, intervals, drivers, stints, pits, loading: dataLoading } = useLiveData(session?.session_key);

    if (sessionLoading) return <p className={styles.loading}>Connecting...</p>

    if (!isLive) return (
        <div className={styles.page}>
            <NoSessionScreen session={session} />
        </div>
    )

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.live}>
                    <span className={styles.liveDot} />
                    LIVE
                </div>
                <span className={styles.sessionName}>
                    {session?.session_name} — {session?.circuit_short_name}
                </span>
            </div>

            {dataLoading
                ? <p className={styles.loading}>Loading live data...</p>
                : <LiveTower
                    positions={positions}
                    drivers={drivers}
                    stints={stints}
                    intervals={intervals}
                    pits={pits}
                />
            }
        </div>
    )
}

export default Live;