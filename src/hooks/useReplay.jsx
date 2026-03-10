import { useState, useEffect, useRef, useMemo } from 'react'

const TICK_MS = 500;

function useReplay(allPositions, allIntervals = [], sessionKey = null) {
    const [isPlaying, setIsPlaying]     = useState(false);
    const [speed, setSpeed]             = useState(1);
    const [currentTime, setCurrentTime] = useState(null);

    const speedRef    = useRef(1);
    const initialized = useRef(false);
    // isFollowing = true: автоматически следуем за последними данными (live режим)
    // false: пользователь вручную перемотал/запустил replay
    const isFollowing = useRef(true);

    useEffect(() => { speedRef.current = speed; }, [speed]);

    const { minTime, maxTime } = useMemo(() => {
        if (!allPositions || allPositions.length === 0) return { minTime: null, maxTime: null };
        const times = allPositions.map(p => new Date(p.date).getTime()).filter(Boolean);
        return {
            minTime: new Date(Math.min(...times)),
            maxTime: new Date(Math.max(...times)),
        };
    }, [allPositions]);

    // При смене сессии — полный сброс
    useEffect(() => {
        setCurrentTime(null);
        setIsPlaying(false);
        setSpeed(1);
        initialized.current = false;
        isFollowing.current = true;
    }, [sessionKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Инициализируем currentTime в maxTime (последние данные), а не в minTime.
    // Если пользователь не трогал replay — автоматически обновляем при новых данных.
    useEffect(() => {
        if (!maxTime) return;
        if (!initialized.current) {
            initialized.current = true;
            setCurrentTime(maxTime);
        } else if (isFollowing.current && !isPlaying) {
            // Автоматически следуем за свежими данными в live режиме
            setCurrentTime(maxTime);
        }
    }, [maxTime]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!isPlaying || !maxTime) return;
        const timer = setInterval(() => {
            setCurrentTime(prev => {
                if (!prev) return prev;
                const next = new Date(prev.getTime() + TICK_MS * speedRef.current);
                if (next >= maxTime) { setIsPlaying(false); return maxTime; }
                return next;
            });
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [isPlaying, maxTime]);

    const replayPositions = useMemo(() => {
        if (!currentTime || !allPositions?.length) return [];
        const cutoff = currentTime.getTime();
        const filtered = allPositions.filter(p => new Date(p.date).getTime() <= cutoff);
        const latest = {};
        filtered.forEach(p => {
            if (!latest[p.driver_number] || p.date > latest[p.driver_number].date)
                latest[p.driver_number] = p;
        });
        return Object.values(latest);
    }, [allPositions, currentTime]);

    const replayIntervals = useMemo(() => {
        if (!currentTime || !allIntervals?.length) return [];
        const cutoff = currentTime.getTime();
        const filtered = allIntervals.filter(i => new Date(i.date).getTime() <= cutoff);
        const latest = {};
        filtered.forEach(i => {
            if (!latest[i.driver_number] || i.date > latest[i.driver_number].date)
                latest[i.driver_number] = i;
        });
        return Object.values(latest);
    }, [allIntervals, currentTime]);

    const play = () => {
        isFollowing.current = false; // Пользователь запустил replay — выходим из live режима
        setIsPlaying(true);
    };
    const pause = () => setIsPlaying(false);

    const seek = (fraction) => {
        if (!minTime || !maxTime) return;
        isFollowing.current = false; // Пользователь перемотал — выходим из live режима
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

    return {
        replayPositions, replayIntervals,
        isPlaying, currentTime, minTime, maxTime, progress,
        speed, play, pause, seek, setSpeed,
        isFollowing: isFollowing.current,
    };
}

export default useReplay;