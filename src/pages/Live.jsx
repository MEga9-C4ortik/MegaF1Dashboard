import useLiveSession from '../hooks/useLiveSession'
import useLiveData from '../hooks/useLiveData'
import NoSessionScreen from '../components/live/NoSessionScreen'
import LiveTower from '../components/live/LiveTower'
import styles from './Live.module.css'

function Live() {
    const { session, isLive, loading } = useLiveSession();

    if (loading) return <p className={styles.loading}>Connecting...</p>

    return (
        <div className={styles.page}>
            {isLive
                ? <LiveTower session={session} />
                : <NoSessionScreen session={session} />
            }
        </div>
    );
}

export default Live;