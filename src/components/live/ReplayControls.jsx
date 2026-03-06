import styles from './ReplayControls.module.css'

function ReplayControls({ isPlaying, currentTime, minTime, maxTime, progress, speed, play, pause, seek, cycleSpeed }) {
    const formatTime = (date) => {
        if (!date) return '--:--:--';
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC',
        });
    };

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
                    // Иконка плея: треугольник
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <polygon points="2,1 12,7 2,13"/>
                    </svg>
                )}
            </button>

            <span className={styles.time}>{formatTime(currentTime)}</span>

            <input
                type="range"
                className={styles.slider}
                min={0}
                max={100}
                value={Math.round(progress * 100)}
                onChange={handleSlider}
            />

            <span className={styles.time}>{formatTime(maxTime)}</span>

            <button className={styles.speedBtn} onClick={cycleSpeed} title="Change playback speed">
                x{speed}
            </button>
        </div>
    );
}

export default ReplayControls;