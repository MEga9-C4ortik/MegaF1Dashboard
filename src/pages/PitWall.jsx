import { useSearchParams } from 'react-router-dom'
import useSessionBrowser from '../hooks/useSessionBrowser'
import useLiveData from '../hooks/useLiveData'
import useReplay from '../hooks/useReplay'
import LiveTower from '../components/pitWall/LiveTower'
import FiaMessages from '../components/pitWall/FiaMessages'
import Weather from '../components/pitWall/Weather'
import RadioMessages from '../components/pitWall/RadioMessages'
import Map from '../components/pitWall/Map'
import ReplayControls from '../components/pitWall/ReplayControls'
import styles from './PitWall.module.css'

function PitWall({ year }) {
    // Поддержка прямой ссылки из Race page: /pitwall?sessionKey=9149
    const [searchParams] = useSearchParams();
    const urlSessionKey = searchParams.get('sessionKey')
        ? Number(searchParams.get('sessionKey'))
        : null;

    const {
        meetings, selectedMeetingKey, setSelectedMeetingKey,
        sessions, selectedSessionKey, setSelectedSessionKey,
        loadingMeetings, loadingSessions,
    } = useSessionBrowser(year, urlSessionKey);

    const activeSessionKey = urlSessionKey ?? selectedSessionKey;

    const {
        positions, intervals, laps, drivers,
        stints, pits, fiaMessages, radio,
        weather, loading: dataLoading,
    } = useLiveData(activeSessionKey);

    const replay = useReplay(positions, intervals, activeSessionKey);
    const ct = replay.currentTime;

    const displayPositions  = replay.replayPositions;
    const displayIntervals  = replay.replayIntervals;
    const displayStints     = stints;
    const displayPits       = ct
        ? pits.filter(p => p.pit_in_time && new Date(p.pit_in_time) <= ct)
        : pits;
    const displayFiaMessages = ct
        ? fiaMessages.filter(m => new Date(m.date) <= ct)
        : [];
    const displayRadio = ct
        ? radio.filter(m => new Date(m.date) <= ct)
        : [];

    const activeSession = sessions.find(s => s.session_key === activeSessionKey);

    return (
        <div className={styles.page}>
            <div className={styles.selectorBar}>
                <span className={styles.pitwallLabel}>PIT WALL</span>

                <select
                    className={styles.select}
                    value={selectedMeetingKey ?? ''}
                    onChange={e => setSelectedMeetingKey(Number(e.target.value))}
                    disabled={loadingMeetings}
                >
                    <option value=''>
                        {loadingMeetings ? 'Loading...' : '— Select GP —'}
                    </option>
                    {meetings.map(m => (
                        <option key={m.meeting_key} value={m.meeting_key}>
                            {m.meeting_name}
                        </option>
                    ))}
                </select>
            </div>

            {(sessions.length > 0 || loadingSessions) && (
                <div className={styles.header}>
                    <div className={styles.sessionTabs}>
                        {loadingSessions
                            ? <span className={styles.loadingSmall}>Loading sessions...</span>
                            : sessions.map(s => (
                                <button
                                    key={s.session_key}
                                    className={`${styles.sessionTab} ${activeSessionKey === s.session_key ? styles.sessionTabActive : ''}`}
                                    onClick={() => setSelectedSessionKey(s.session_key)}
                                >
                                    {s.session_name}
                                </button>
                            ))
                        }
                    </div>

                    {activeSession && (
                        <span className={styles.sessionName}>
                            {activeSession.session_name} — {activeSession.circuit_short_name}
                        </span>
                    )}

                    <Weather weather={weather} />
                </div>
            )}

            {activeSessionKey && !dataLoading && positions.length > 0 && (
                <ReplayControls
                    isPlaying={replay.isPlaying}
                    currentTime={replay.currentTime}
                    minTime={replay.minTime}
                    maxTime={replay.maxTime}
                    progress={replay.progress}
                    speed={replay.speed}
                    play={replay.play}
                    pause={replay.pause}
                    seek={replay.seek}
                    setSpeed={replay.setSpeed}
                />
            )}

            {!activeSessionKey && !loadingMeetings && (
                <div className={styles.empty}>
                        <span className={styles.emptyText}>
                            Select a session to watch.
                        </span>
                        <span className={styles.emptyText}>
                            Replays are available 30 minutes after the session ends.
                        </span>
                </div>
            )}

            {activeSessionKey && dataLoading && (
                <p className={styles.loading}>Loading session data...</p>
            )}

            {activeSessionKey && !dataLoading && (
                <div className={styles.content}>
                    <div className={styles.left}>
                        {displayPositions.length > 0 && drivers.length > 0
                            ? <LiveTower
                                positions={displayPositions}
                                drivers={drivers}
                                stints={displayStints}
                                intervals={displayIntervals}
                                laps={laps}
                                pits={displayPits}
                                currentTime={ct}
                            />
                            : <p className={styles.noData}>NO DATA FOR THIS SESSION</p>
                        }
                    </div>
                    <div className={styles.right}>
                        <Map sessionKey={activeSessionKey} drivers={drivers} replayTime={ct} />
                        <FiaMessages messages={displayFiaMessages} />
                        <RadioMessages messages={displayRadio} drivers={drivers} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PitWall;