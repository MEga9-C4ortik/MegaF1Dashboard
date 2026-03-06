import { useState, useEffect, useRef, useMemo } from 'react'

// Скорость реплея: во сколько раз быстрее реального времени
const PLAYBACK_SPEEDS = [1, 2, 5, 10, 30];

// Как часто тикает таймер реплея (мс)
// При скорости x30 и тике 500мс → прыгаем на 15 секунд за тик
const TICK_MS = 500;

/**
 * useReplay — управляет воспроизведением исторических данных сессии.
 *
 * Принимает все positions (полная история за сессию).
 * Возвращает positions отфильтрованные по текущему времени реплея.
 *
 * Идея:
 * - positions содержат поле `date` — это ISO строка когда была записана позиция
 * - Мы берём min/max date из всех позиций → это диапазон сессии
 * - currentTime — текущий момент реплея (двигается при play)
 * - Фильтруем: берём записи где date <= currentTime,
 *   для каждого водителя берём самую последнюю → это их позиция "сейчас"
 */
function useReplay(allPositions) {
    const [isPlaying, setIsPlaying]   = useState(false);
    const [speedIndex, setSpeedIndex] = useState(0); // индекс в PLAYBACK_SPEEDS, дефолт x1
    const [currentTime, setCurrentTime] = useState(null); // Date объект

    // useMemo пересчитывается только когда изменится allPositions.
    // Не пересчитываем диапазон каждый рендер — это дорого если позиций много.
    const { minTime, maxTime } = useMemo(() => {
        if (!allPositions || allPositions.length === 0) {
            return { minTime: null, maxTime: null };
        }
        // Преобразуем строки в числа (ms) для сравнения
        const times = allPositions.map(p => new Date(p.date).getTime()).filter(Boolean);
        return {
            minTime: new Date(Math.min(...times)),
            maxTime: new Date(Math.max(...times)),
        };
    }, [allPositions]);

    // Когда появляются данные — ставим currentTime на начало сессии
    useEffect(() => {
        if (minTime && !currentTime) {
            setCurrentTime(minTime);
        }
    }, [minTime]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Тик реплея ──────────────────────────────────────────────────────────
    // useRef для скорости — не хотим пересоздавать интервал при каждой смене скорости.
    // Вместо этого интервал всегда читает актуальное значение через ref.
    const speedRef = useRef(PLAYBACK_SPEEDS[speedIndex]);
    useEffect(() => {
        speedRef.current = PLAYBACK_SPEEDS[speedIndex];
    }, [speedIndex]);

    useEffect(() => {
        if (!isPlaying || !maxTime) return;

        const timer = setInterval(() => {
            setCurrentTime(prev => {
                if (!prev) return prev;

                // Сдвигаем время вперёд: tick * скорость = сколько реального времени прошло
                const next = new Date(prev.getTime() + TICK_MS * speedRef.current);

                // Дошли до конца — останавливаем
                if (next >= maxTime) {
                    setIsPlaying(false);
                    return maxTime;
                }
                return next;
            });
        }, TICK_MS);

        return () => clearInterval(timer);
        // isPlaying и maxTime в deps: перезапускаем интервал только при play/pause
        // или когда узнали maxTime (данные загрузились)
    }, [isPlaying, maxTime]);

    // ─── Фильтрация позиций по currentTime ───────────────────────────────────
    // useMemo: не пересчитываем при каждом рендере — только когда изменились данные или время
    const replayPositions = useMemo(() => {
        if (!currentTime || !allPositions || allPositions.length === 0) return [];

        const cutoff = currentTime.getTime();

        // Шаг 1: оставляем только записи до текущего момента
        const filtered = allPositions.filter(p => new Date(p.date).getTime() <= cutoff);

        // Шаг 2: для каждого водителя берём самую свежую запись
        // (т.е. его позицию именно на момент currentTime)
        const latestByDriver = {};
        filtered.forEach(p => {
            const existing = latestByDriver[p.driver_number];
            if (!existing || p.date > existing.date) {
                latestByDriver[p.driver_number] = p;
            }
        });

        return Object.values(latestByDriver);
    }, [allPositions, currentTime]);

    // ─── Хелперы ─────────────────────────────────────────────────────────────
    const play  = () => setIsPlaying(true);
    const pause = () => setIsPlaying(false);

    // Перемотка по слайдеру: значение 0..1 → конвертируем в Date
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
        PLAYBACK_SPEEDS,
    };
}

export default useReplay;