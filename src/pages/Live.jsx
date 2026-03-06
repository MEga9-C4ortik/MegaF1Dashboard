import { useState } from "react";
import useLiveSession from '../hooks/useLiveSession'
import useLiveData from '../hooks/useLiveData'
import useReplay from '../hooks/useReplay'
import NoSessionScreen from '../components/live/NoSessionScreen'
import LiveTower from '../components/live/LiveTower'
import FiaMessages from '../components/live/FiaMessages'
import Weather from '../components/live/Weather'
import RadioMessages from '../components/live/RadioMessages'
import Map from '../components/live/Map'
import ReplayControls from '../components/live/ReplayControls'
import styles from './Live.module.css'

function Live() {
    const { session, sessions, isLive, loading: sessionLoading } = useLiveSession();
    const [selectedSessionKey, setSelectedSessionKey] = useState(null);

    // activeSessionKey: если пользователь выбрал таб — используем его,
    // иначе берём текущую сессию
    const activeSessionKey = selectedSessionKey ?? session?.session_key ?? null;

    // isReplayMode: true когда смотрим не живую сессию
    const isReplayMode = !!selectedSessionKey || !isLive;

    const {
        positions, intervals, drivers,
        stints, pits, fiaMessages, radio,
        weather, loading: dataLoading, hasData
    } = useLiveData(activeSessionKey);

    const replay = useReplay(positions);

    const displayPositions = isReplayMode ? replay.replayPositions : positions;

    // --- Состояния загрузки ---
    if (sessionLoading) return <p className={styles.loading}>Connecting...</p>;

    // --- Нет активной сессии и пользователь ничего не выбрал ---
    // Показываем NoSessionScreen с табами поверх для выбора прошлых сессий
    if (!isLive && !selectedSessionKey) {
        return (
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
    }

    // --- Выбрана сессия (таб), но данные ещё грузятся ---
    if (dataLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.live}>
                        <span className={styles.liveDot} />
                        {isLive && !selectedSessionKey ? 'LIVE' : 'REPLAY'}
                    </div>
                    {sessions.length > 0 && (
                        <div className={styles.sessionTabs}>
                            {sessions.map(s => (
                                <button
                                    key={s.session_key}
                                    className={`${styles.sessionTab} ${activeSessionKey === s.session_key ? styles.sessionTabActive : ''}`}
                                    onClick={() => {
                                        if (isLive && s.session_key === session?.session_key) {
                                            setSelectedSessionKey(null);
                                        } else {
                                            setSelectedSessionKey(s.session_key);
                                        }
                                    }}
                                >
                                    {s.session_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <span className={styles.loading}>Loading data...</span>
            </div>
        );
    }

    // --- Данные загрузились, но их нет (сессия ещё не начиналась или API пустой) ---
    // Показываем NoSessionScreen вместо "NO DATA FOR THIS SESSION"
    if (!hasData) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.live}>
                        <span className={styles.liveDot} />
                        {isLive && !selectedSessionKey ? 'LIVE' : 'REPLAY'}
                    </div>
                    {sessions.length > 0 && (
                        <div className={styles.sessionTabs}>
                            {sessions.map(s => (
                                <button
                                    key={s.session_key}
                                    className={`${styles.sessionTab} ${activeSessionKey === s.session_key ? styles.sessionTabActive : ''}`}
                                    onClick={() => {
                                        if (isLive && s.session_key === session?.session_key) {
                                            setSelectedSessionKey(null);
                                        } else {
                                            setSelectedSessionKey(s.session_key);
                                        }
                                    }}
                                >
                                    {s.session_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Нет данных для выбранной сессии — показываем нормальный экран */}
                <NoSessionScreen session={session} />
            </div>
        );
    }

    // --- Нормальный рендер с данными ---
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
                                onClick={() => {
                                    if (isLive && s.session_key === session?.session_key) {
                                        setSelectedSessionKey(null);
                                    } else {
                                        setSelectedSessionKey(s.session_key);
                                    }
                                }}
                            >
                                {s.session_name}
                            </button>
                        ))}
                    </div>
                )}

                <Weather weather={weather} />
            </div>

            {isReplayMode && positions.length > 0 && (
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

            <div className={styles.content}>
                <div className={styles.left}>
                    {displayPositions.length > 0 && drivers.length > 0
                        ? <LiveTower
                            positions={displayPositions}
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
        </div>
    );
}

export default Live;