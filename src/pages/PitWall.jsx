import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from "react";
import useSessionBrowser from '../hooks/useSessionBrowser'
import useLiveData from '../hooks/useLiveData'
import useReplay from '../hooks/useReplay'
import LiveTower from '../components/pitWall/LiveTower'
import FiaMessages from '../components/pitWall/FiaMessages'
import RadioMessages from '../components/pitWall/RadioMessages'
import Map from '../components/pitWall/Map'
import ReplayControls from '../components/pitWall/ReplayControls'
import Weather from "../components/pitWall/Weather.jsx";
import styles from './PitWall.module.css'

function PitWall({ year }) {
    const [searchParams] = useSearchParams();
    const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'tower'
    const navigate = useNavigate();
    const urlSessionKey = searchParams.get('sessionKey')
        ? Number(searchParams.get('sessionKey'))
        : null;

    const {
        meetings, selectedMeetingKey, setSelectedMeetingKey,
        sessions, selectedSessionKey, setSelectedSessionKey,
        loadingMeetings, loadingSessions,
    } = useSessionBrowser(year, urlSessionKey);

    const activeSessionKey = selectedSessionKey ?? urlSessionKey;

    const {
        positions, intervals, laps, drivers,
        stints, pits, fiaMessages, radio,
        weather, loading: dataLoading,
    } = useLiveData(activeSessionKey);

    const replayMinTime = useMemo(() => {
        if (!positions.length) return null;
        const minTs = positions.reduce((min, p) => p._ts < min ? p._ts : min, Infinity);
        return minTs === Infinity ? null : new Date(minTs);
    }, [positions]);

    const replay = useReplay(positions, replayMinTime, intervals, activeSessionKey);
    const ct = replay.currentTime;

    const displayPositions = (positions.length > 0) ? replay.replayPositions : [];
    const displayIntervals = (intervals.length > 0) ? replay.replayIntervals : [];
    const displayStints = stints;
    const displayPits = useMemo(() => {
        return ct
            ? pits.filter(p => p.date && new Date(p.date) <= ct)
            : pits;
    }, [ct, pits]);
    const displayFiaMessages = useMemo(() => {
        return ct
            ? fiaMessages.filter(m => new Date(m.date) <= ct)
            : fiaMessages;
    },[ct, fiaMessages]);
    const displayRadio = useMemo(() => {
        return ct
            ? radio.filter(m => new Date(m.date) <= ct)
            : radio;
    }, [ct, radio]);
    const currentWeather = useMemo(() => {
        if (!weather.length) return null;
        if (!ct) return weather.at(-1);
        return weather.filter(w => new Date(w.date) <= ct).at(-1);
    }, [ct, weather]);

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
                    <option value=''>{loadingMeetings ? 'Loading...' : '— Select GP —'}</option>
                    {meetings.map(m => (
                        <option key={m.meeting_key} value={m.meeting_key}>{m.meeting_name}</option>
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
                                    className={`${styles.sessionTab} ${s.session_key === activeSessionKey ? styles.sessionTabActive : ''}`}
                                    onClick={() => {
                                        setSelectedSessionKey(s.session_key);
                                        if (urlSessionKey) navigate('/pitwall', { replace: true });
                                    }}
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

            <Weather weather={currentWeather} />

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
                    <span className={styles.emptyText}>Select a session to watch.</span>
                    <span className={styles.emptyText}>Replays are available 30 minutes after the session ends.</span>
                </div>
            )}

            {activeSessionKey && dataLoading && (
                <p className={styles.loading}>Loading session data...</p>
            )}

            {activeSessionKey && !dataLoading && (
                <div className={styles.content}>
                    <div className={styles.mobileTabs}>
                        <button
                            className={`${styles.mobileTab} ${mobileTab === 'map' ? styles.mobileTabActive : ''}`}
                            onClick={() => setMobileTab('map')}
                        >MAP</button>
                        <button
                            className={`${styles.mobileTab} ${mobileTab === 'tower' ? styles.mobileTabActive : ''}`}
                            onClick={() => setMobileTab('tower')}
                        >TOWER</button>
                    </div>

                    <div className={styles.mapAndTower}>
                        <div className={`${styles.mapColumn} ${mobileTab !== 'map' ? styles.mobileHidden : ''}`}>
                            <Map sessionKey={activeSessionKey} drivers={drivers} replayTime={ct} isPlaying={replay.isPlaying} />
                        </div>

                        <div className={`${styles.rightPanel} ${mobileTab !== 'tower' ? styles.mobileHidden : ''}`}>
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
                    </div>

                    <div className={styles.messagesAccordion}>
                        <span>RACE CONTROL & RADIO</span>
                        <div className={styles.messagesContent}>
                            <FiaMessages messages={displayFiaMessages} />
                            <RadioMessages messages={displayRadio} drivers={drivers} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PitWall;