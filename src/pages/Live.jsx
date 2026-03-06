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

function SessionTabs({ sessions, activeSessionKey, isLive, currentSessionKey, onSelect }) {
    if (!sessions.length) return null;
    return (
        <div className={styles.sessionTabs}>
            {sessions.map(s => (
                <button
                    key={s.session_key}
                    className={`${styles.sessionTab} ${activeSessionKey === s.session_key ? styles.sessionTabActive : ''}`}
                    onClick={() => {
                        if (isLive && s.session_key === currentSessionKey) {
                            onSelect(null);
                        } else {
                            onSelect(s.session_key);
                        }
                    }}
                >
                    {s.session_name}
                </button>
            ))}
        </div>
    );
}

function Live() {
    const { session, sessions, isLive, loading: sessionLoading } = useLiveSession();
    const [selectedSessionKey, setSelectedSessionKey] = useState(null);

    const activeSessionKey = selectedSessionKey ?? session?.session_key ?? null;
    const isReplayMode = !!selectedSessionKey || !isLive;

    const {
        positions, intervals, laps, drivers,
        stints, pits, fiaMessages, radio,
        weather, loading: dataLoading, hasData
    } = useLiveData(activeSessionKey);

    const replay = useReplay(positions);
    const displayPositions = isReplayMode ? replay.replayPositions : positions;

    const tabsProps = {
        sessions,
        activeSessionKey,
        isLive,
        currentSessionKey: session?.session_key,
        onSelect: setSelectedSessionKey,
    };

    // Шаг 1: сессии ещё грузятся
    if (sessionLoading) {
        return <p className={styles.loading}>Connecting...</p>;
    }

    // Шаг 2: нет живой сессии И пользователь ничего не выбрал
    // selectedSessionKey = null означает "юзер не нажимал на табы"
    if (!isLive && !selectedSessionKey) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <SessionTabs {...tabsProps} />
                </div>
                <NoSessionScreen session={session} />
            </div>
        );
    }

    // Шаг 3: есть sessionKey — данные грузятся
    // Показываем loading, но табы всегда видны
    if (dataLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.live}>
                        <span className={styles.liveDot} />
                        {isLive && !selectedSessionKey ? 'LIVE' : 'REPLAY'}
                    </div>
                    <SessionTabs {...tabsProps} />
                </div>
                <span className={styles.loading}>Loading data...</span>
            </div>
        );
    }

    // Шаг 4: загрузка завершена, данных нет (сессия не началась)
    // ВАЖНО: проверяем !hasData только ПОСЛЕ того как loading = false
    if (!hasData) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.live}>
                        <span className={styles.liveDot} />
                        {isLive && !selectedSessionKey ? 'LIVE' : 'REPLAY'}
                    </div>
                    <SessionTabs {...tabsProps} />
                </div>
                <NoSessionScreen session={session} />
            </div>
        );
    }

    // Шаг 5: всё норм, рендерим данные
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
                <SessionTabs {...tabsProps} />
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
                            laps={laps}
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