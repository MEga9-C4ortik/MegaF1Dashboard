import useLiveSession from '../hooks/useLiveSession'
import useLiveData from '../hooks/useLiveData'
import NoSessionScreen from '../components/live/NoSessionScreen'
import LiveTower from '../components/live/LiveTower'
import FiaMessages from '../components/live/FiaMessages'
import Weather from '../components/live/Weather'
import RadioMessages from '../components/live/RadioMessages'
import styles from './Live.module.css'

function Live() {
    const { session, isLive, loading: sessionLoading } = useLiveSession();
    const [selectedSessionKey, setSelectedSessionKey] = useState(null);
    const activeSessionKey = selectedSessionKey ?? session?.session_key;

    const {
        positions, intervals, drivers,
        stints, pits, fiaMessages, radio,
        weather, loading: dataLoading
    } = useLiveData(activeSessionKey);

    if (sessionLoading) return <p className={styles.loading}>Connecting...</p>;

    if (!isLive) return (
        <div className={styles.page}>
            <NoSessionScreen session={session} />
        </div>
    );

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
                <Weather weather={weather} />
            </div>

            {dataLoading ? (
                <span className={styles.loading}>Loading live data...</span>
            ) : (
                <div className={styles.content}>
                    <div className={styles.left}>
                        <LiveTower
                            positions={positions}
                            drivers={drivers}
                            stints={stints}
                            intervals={intervals}
                            pits={pits}
                        />
                    </div>

                    <div className={styles.right}>
                        <FiaMessages messages={fiaMessages} />
                        <RadioMessages messages={radio} drivers={drivers} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Live;