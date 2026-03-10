import { useSearchParams } from 'react-router-dom'
import useSessionBrowser from '../hooks/useSessionBrowser'
import useLiveData from '../hooks/useLiveData'
import useReplay from '../hooks/useReplay'
import LiveTower from '../components/pitWall/LiveTower'
import FiaMessages from '../components/pitWall/FiaMessages'
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
    const following = replay.isFollowing;

    // В live-режиме (following=true) — показываем сырые последние данные без фильтрации по времени.
    // В replay-режиме (following=false) — фильтруем всё по currentTime.
    const displayPositions   = following ? positions : replay.replayPositions;
    const displayIntervals   = following ? intervals : replay.replayIntervals;
    const displayStints      = stints;
    const displayPits        = (ct && !following)
        ? pits.filter(p => p.pit_in_time && new Date(p.pit_in_time) <= ct)
        : pits;
    const displayFiaMessages = (ct && !following)
        ? fiaMessages.filter(m => new Date(m.date) <= ct)
        : fiaMessages;
    const displayRadio = (ct && !following)
        ? radio.filter(m => new Date(m.date) <= ct)
        : radio;

    const activeSession = sessions.find(s => s.session_key === activeSessionKey);


    function windDir(deg) {
        if (deg == null) return '';
        const dirs = ['N','NE','E','SE','S','SW','W','NW'];
        return ' ' + dirs[Math.round(deg / 45) % 8];
    }

    return (
        <div className={styles.page}>
            {/* ── GP selector ── */}
            <div className={styles.selectorBar}>
                <span className={styles.pitwallLabel}>PIT WALL</span>
                <select
                    className={styles.select}
                    value={selectedMeetingKey ?? ''}
                    onChange={e => setSelectedMeetingKey(Number(e.target.value))}
                    disabled={loadingMeetings}
                >
                    <option value=''>{loadingMeetings ? 'Loading...' : '— Select GP —'}</option>
                    {meetings.map(m => (
                        <option key={m.meeting_key} value={m.meeting_key}>{m.meeting_name}</option>
                    ))}
                </select>
            </div>

            {/* ── Session tabs ── */}
            {(sessions.length > 0 || loadingSessions) && (
                <div className={styles.header}>
                    <div className={styles.sessionTabs}>
                        {loadingSessions
                            ? <span className={styles.loadingSmall}>Loading sessions...</span>
                            : sessions.map(s => (
                                <button
                                    key={s.session_key}
                                    className={`${styles.sessionTab} ${s.session_key === activeSessionKey ? styles.sessionTabActive : ''}`}
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
                </div>
            )}

            {weather && (
                <div className={styles.weatherBar}>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Air</span>
                        <span className={styles.weatherValue}>{weather.air_temperature ?? '—'}°C</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Track</span>
                        <span className={styles.weatherValue}>{weather.track_temperature ?? '—'}°C</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Humidity</span>
                        <span className={styles.weatherValue}>{weather.humidity ?? '—'}%</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Wind</span>
                        <span className={styles.weatherValue}>
                            {weather.wind_speed ?? '—'} m/s{windDir(weather.wind_direction)}
                        </span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Pressure</span>
                        <span className={styles.weatherValue}>{weather.pressure != null ? `${weather.pressure} hPa` : '—'}</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Rain</span>
                        <span className={`${styles.weatherValue} ${weather.rainfall ? styles.weatherValueRain : styles.weatherDim}`}>
                            {weather.rainfall ? '⛆ YES' : 'NO'}
                        </span>
                    </div>
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

            {activeSessionKey && !dataLoading && (
                <div className={styles.mapSection}>
                    <Map sessionKey={activeSessionKey} drivers={drivers} replayTime={ct} />
                </div>
            )}

            {!activeSessionKey && !loadingMeetings && (
                <div className={styles.empty}>
                    <span className={styles.emptyText}>Select a session to watch.</span>
                    <span className={styles.emptyText}>Replays are available 30 minutes after the session ends.</span>
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
                                currentTime={following ? null : ct}
                            />
                            : <p className={styles.noData}>NO DATA FOR THIS SESSION</p>
                        }
                    </div>
                    <div className={styles.right}>
                        <FiaMessages messages={displayFiaMessages} />
                        <RadioMessages messages={displayRadio} drivers={drivers} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PitWall;