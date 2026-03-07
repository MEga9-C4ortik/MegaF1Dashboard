import { useState, useEffect, useRef, useMemo } from 'react'

const PLAYBACK_SPEEDS = [1, 2, 5, 10, 30];
const TICK_MS = 500;

function useReplay(allPositions, allIntervals = [], sessionKey = null) {
    const [isPlaying, setIsPlaying]     = useState(false);
    const [speedIndex, setSpeedIndex]   = useState(0);
    const [currentTime, setCurrentTime] = useState(null);

    const { minTime, maxTime } = useMemo(() => {
        if (!allPositions || allPositions.length === 0) {
            return { minTime: null, maxTime: null };
        }
        const times = allPositions.map(p => new Date(p.date).getTime()).filter(Boolean);
        return {
            minTime: new Date(Math.min(...times)),
            maxTime: new Date(Math.max(...times)),
        };
    }, [allPositions]);

    // Когда появляются данные — ставим на начало
    useEffect(() => {
        if (minTime && !currentTime) {
            setCurrentTime(minTime);
        }
    }, [minTime]); // eslint-disable-line react-hooks/exhaustive-deps

    // Сброс при смене сессии — зависим от sessionKey, НЕ от allPositions!
    // Если зависеть от allPositions, то каждый инкрементальный fetch (каждые 15 сек)
    // создаёт новую ссылку на массив и сбрасывает replay на начало — это был главный баг.
    useEffect(() => {
        setCurrentTime(null);
        setIsPlaying(false);
        setSpeedIndex(0);
    }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const speedRef = useRef(PLAYBACK_SPEEDS[speedIndex]);
    useEffect(() => {
        speedRef.current = PLAYBACK_SPEEDS[speedIndex];
    }, [speedIndex]);

    useEffect(() => {
        if (!isPlaying || !maxTime) return;
        const timer = setInterval(() => {
            setCurrentTime(prev => {
                if (!prev) return prev;
                const next = new Date(prev.getTime() + TICK_MS * speedRef.current);
                if (next >= maxTime) {
                    setIsPlaying(false);
                    return maxTime;
                }
                return next;
            });
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [isPlaying, maxTime]);

    const replayPositions = useMemo(() => {
        if (!currentTime || !allPositions || allPositions.length === 0) return [];
        const cutoff = currentTime.getTime();
        const filtered = allPositions.filter(p => new Date(p.date).getTime() <= cutoff);
        const latestByDriver = {};
        filtered.forEach(p => {
            const ex = latestByDriver[p.driver_number];
            if (!ex || p.date > ex.date) latestByDriver[p.driver_number] = p;
        });
        return Object.values(latestByDriver);
    }, [allPositions, currentTime]);

    const replayIntervals = useMemo(() => {
        if (!currentTime || !allIntervals || allIntervals.length === 0) return [];
        const cutoff = currentTime.getTime();
        const filtered = allIntervals.filter(i => new Date(i.date).getTime() <= cutoff);
        const latestByDriver = {};
        filtered.forEach(i => {
            const ex = latestByDriver[i.driver_number];
            if (!ex || i.date > ex.date) latestByDriver[i.driver_number] = i;
        });
        return Object.values(latestByDriver);
    }, [allIntervals, currentTime]);

    const play  = () => setIsPlaying(true);
    const pause = () => setIsPlaying(false);

    const seek = (fraction) => {
        if (!minTime || !maxTime) return;
        const range = maxTime.getTime() - minTime.getTime();
        setCurrentTime(new Date(minTime.getTime() + range * fraction));
        setIsPlaying(false);
    };

    const progress = useMemo(() => {
        if (!minTime || !maxTime || !currentTime) return 0;
        const range = maxTime.getTime() - minTime.getTime();
        if (range === 0) return 0;
        return (currentTime.getTime() - minTime.getTime()) / range;
    }, [minTime, maxTime, currentTime]);

    const cycleSpeed = () => {
        setSpeedIndex(i => (i + 1) % PLAYBACK_SPEEDS.length);
    };

    return {
        replayPositions,
        replayIntervals,
        isPlaying,
        currentTime,
        minTime,
        maxTime,
        progress,
        speed: PLAYBACK_SPEEDS[speedIndex],
        play,
        pause,
        seek,
        cycleSpeed,
    };
}

export default useReplay;