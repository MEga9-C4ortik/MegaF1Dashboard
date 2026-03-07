import styles from './ReplayControls.module.css'

// Показываем время как +MM:SS от начала сессии — понятнее чем абсолютный UTC
function formatElapsed(current, min) {
    if (!current || !min) return '+00:00';
    const diffSec = Math.floor((current.getTime() - min.getTime()) / 1000);
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(min, max) {
    if (!min || !max) return '00:00';
    const diffSec = Math.floor((max.getTime() - min.getTime()) / 1000);
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ReplayControls({ isPlaying, currentTime, minTime, maxTime, progress, speed, play, pause, seek, cycleSpeed }) {
    const handleSlider = (e) => {
        seek(Number(e.target.value) / 100);
    };

    const isFinished = progress >= 1;

    return (
        <div className={styles.controls}>
            <button
                className={styles.playBtn}
                onClick={isPlaying ? pause : play}
                disabled={isFinished && !isPlaying}
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="2" y="1" width="4" height="12" rx="1"/>
                        <rect x="8" y="1" width="4" height="12" rx="1"/>
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <polygon points="2,1 12,7 2,13"/>
                    </svg>
                )}
            </button>

            <span className={styles.time}>{formatElapsed(currentTime, minTime)}</span>

            <input
                type="range"
                className={styles.slider}
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={handleSlider}
            />

            <span className={styles.time}>{formatDuration(minTime, maxTime)}</span>

            <button className={styles.speedBtn} onClick={cycleSpeed} title="Change playback speed">
                x{speed}
            </button>
        </div>
    );
}

export default ReplayControls;