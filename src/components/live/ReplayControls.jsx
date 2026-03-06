import styles from './ReplayControls.module.css'

/**
 * ReplayControls — полоса управления реплеем.
 * Отображает: кнопку play/pause, скорость, слайдер времени, текущее время.
 *
 * Получает всё из useReplay через пропсы — сам ничего не знает о данных.
 * Это "тупой" (presentational) компонент — только UI.
 */
function ReplayControls({ isPlaying, currentTime, minTime, maxTime, progress, speed, play, pause, seek, cycleSpeed }) {

    // Форматируем время в HH:MM:SS для отображения
    const formatTime = (date) => {
        if (!date) return '--:--:--';
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            // Используем UTC чтобы не было сдвига по timezone пользователя
            timeZone: 'UTC',
        });
    };

    // Обработчик слайдера: input range возвращает строку 0..100
    // Конвертируем в дробь 0..1 и передаём в seek
    const handleSlider = (e) => {
        seek(Number(e.target.value) / 100);
    };

    const isFinished = progress >= 1;

    return (
        <div className={styles.controls}>

            {/* Кнопка Play/Pause */}
            <button
                className={styles.playBtn}
                onClick={isPlaying ? pause : play}
                disabled={isFinished && !isPlaying}
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    // Иконка паузы: два вертикальных прямоугольника
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

            {/* Текущее время */}
            <span className={styles.time}>{formatTime(currentTime)}</span>

            {/* Слайдер прогресса */}
            <input
                type="range"
                className={styles.slider}
                min={0}
                max={100}
                // Math.round чтобы не дёргался при промежуточных значениях float
                value={Math.round(progress * 100)}
                onChange={handleSlider}
            />

            {/* Конечное время */}
            <span className={styles.time}>{formatTime(maxTime)}</span>

            {/* Кнопка скорости — циклически переключает x1 → x2 → x5 → x10 → x30 → x1 */}
            <button className={styles.speedBtn} onClick={cycleSpeed} title="Change playback speed">
                x{speed}
            </button>
        </div>
    );
}

export default ReplayControls;