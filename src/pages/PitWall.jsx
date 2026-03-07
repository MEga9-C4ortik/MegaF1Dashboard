import { useSearchParams } from 'react-router-dom'
import useSessionBrowser from '../hooks/useSessionBrowser'
import useLiveData from '../hooks/useLiveData'
import useReplay from '../hooks/useReplay'
// WebStorm мог переименовать папку live -> pitwall, обнови пути если надо
import LiveTower from '../components/pitwall/LiveTower'
import FiaMessages from '../components/pitwall/FiaMessages'
import Weather from '../components/pitwall/Weather'
import RadioMessages from '../components/pitwall/RadioMessages'
import Map from '../components/pitwall/Map'
import ReplayControls from '../components/pitwall/ReplayControls'
import styles from './PitWall.module.css'

// year приходит из App.jsx как prop — там же yearSelect в Navbar
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

    // URL sessionKey имеет приоритет над выбранным вручную
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
                    cycleSpeed={replay.cycleSpeed}
                />
            )}

            {!activeSessionKey && !loadingMeetings && (
                <div className={styles.empty}>
                    <span>
                        Select a GP and session to watch the replay
                    </span>
                    <span>
                        Only GP starting from 2023 are available
                    </span>
                    <span>
                        (Sessions are available only 30 minutes after it ends)
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