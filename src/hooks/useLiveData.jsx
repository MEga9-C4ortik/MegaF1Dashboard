import { useState, useEffect, useCallback, useRef } from 'react'
import {
    fetchPositions,
    fetchIntervals,
    fetchDrivers,
    fetchStints,
    fetchPits,
    fetchFiaMessages,
    fetchWeather,
    fetchTeamRadio,
} from '../services/openf1Api'
import { getCached, setCached, hasStaticCache } from '../services/SessionCache'

// Live: refreshing dynamic info every 15 сек
const DYNAMIC_INTERVAL = 15000;
// static info interval
const STATIC_INTERVAL = 60000;
const INCREMENTAL_WINDOW_SEC = 35;

function useLiveData(sessionKey) {
    const [positions, setPositions]       = useState([]);
    const [intervals, setIntervals]       = useState([]);
    const [weather, setWeather]           = useState(null);
    const [drivers, setDrivers]           = useState([]);
    const [stints, setStints]             = useState([]);
    const [pits, setPits]                 = useState([]);
    const [fiaMessages, setFiaMessages]   = useState([]);
    const [radio, setRadio]               = useState([]);
    const [loading, setLoading]           = useState(true);

    // //Flag: is there loaded dynamic data
    const initialDynamicDone = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        initialDynamicDone.current = false;
        setLoading(true);

        const cached = getCached(sessionKey);
        if (cached) {
            if (cached.drivers)     setDrivers(cached.drivers);
            if (cached.stints)      setStints(cached.stints);
            if (cached.pits)        setPits(cached.pits);
            if (cached.fiaMessages) setFiaMessages(cached.fiaMessages);
            if (cached.radio)       setRadio(cached.radio);
            if (cached.positions)   setPositions(cached.positions);
            if (cached.intervals)   setIntervals(cached.intervals);
            if (cached.weather)     setWeather(cached.weather);
            setLoading(false);
        } else {
            setPositions([]);
            setIntervals([]);
            setDrivers([]);
            setStints([]);
            setPits([]);
            setFiaMessages([]);
            setRadio([]);
            setWeather(null);
        }

        return () => { isMounted.current = false; };
    }, [sessionKey]);

    // --- Динамика ---
    // Первый вызов: грузим всё (нет sinceDate)
    // Последующие: только за последние INCREMENTAL_WINDOW_SEC секунд
    const loadDynamic = useCallback(async () => {
        if (!sessionKey) return;

        // Для инкрементальных обновлений берём окно в прошлое
        const sinceDate = initialDynamicDone.current
            ? new Date(Date.now() - INCREMENTAL_WINDOW_SEC * 1000).toISOString()
            : null; // null = полная загрузка

        try {
            const [pos, int, wth] = await Promise.allSettled([
                fetchPositions(sessionKey, sinceDate),
                fetchIntervals(sessionKey, sinceDate),
                fetchWeather(sessionKey), // погода маленькая — всегда грузим всё
            ]);

            if (!isMounted.current) return;

            if (pos.status === 'fulfilled' && pos.value.length > 0) {
                if (initialDynamicDone.current) {
                    // Инкрементальное обновление: мёрджим новые данные со старыми
                    // positions — массив всех position-записей для каждого driver_number
                    // LiveTower сам берёт последнюю для каждого водителя — просто appending
                    setPositions(prev => {
                        const merged = [...prev, ...pos.value];
                        // Дедуплицируем по дате+номеру чтобы не раздувать массив
                        // (на случай если окна перекрываются)
                        const seen = new Set();
                        return merged.filter(p => {
                            const key = `${p.driver_number}_${p.date}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    });
                } else {
                    setPositions(pos.value);
                }
                setCached(sessionKey, { positions: pos.value });
            }

            if (int.status === 'fulfilled' && int.value.length > 0) {
                if (initialDynamicDone.current) {
                    setIntervals(prev => {
                        const merged = [...prev, ...int.value];
                        const seen = new Set();
                        return merged.filter(i => {
                            const key = `${i.driver_number}_${i.date}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    });
                } else {
                    setIntervals(int.value);
                }
                setCached(sessionKey, { intervals: int.value });
            }

            if (wth.status === 'fulfilled') {
                const latest = wth.value?.at(-1) ?? null;
                setWeather(latest);
                setCached(sessionKey, { weather: latest });
            }

            // После первой успешной загрузки переключаемся на инкрементальный режим
            if (!initialDynamicDone.current) {
                initialDynamicDone.current = true;
            }

        } catch (err) {
            console.error('Dynamic fetch error:', err);
        }
    }, [sessionKey]);

    // --- Статика ---
    const loadStatic = useCallback(async () => {
        if (!sessionKey) return;

        if (hasStaticCache(sessionKey)) {
            setLoading(false);
            return;
        }

        try {
            const [drv, stn, pit, fms, trd] = await Promise.allSettled([
                fetchDrivers(sessionKey),
                fetchStints(sessionKey),
                fetchPits(sessionKey),
                fetchFiaMessages(sessionKey),
                fetchTeamRadio(sessionKey),
            ]);

            if (!isMounted.current) return;

            const toCache = {};

            if (drv.status === 'fulfilled') { setDrivers(drv.value);      toCache.drivers     = drv.value; }
            if (stn.status === 'fulfilled') { setStints(stn.value);        toCache.stints      = stn.value; }
            if (pit.status === 'fulfilled') { setPits(pit.value);          toCache.pits        = pit.value; }
            if (fms.status === 'fulfilled') { setFiaMessages(fms.value);   toCache.fiaMessages = fms.value; }
            if (trd.status === 'fulfilled') { setRadio(trd.value);         toCache.radio       = trd.value; }

            setCached(sessionKey, toCache);
        } catch (err) {
            console.error('Static fetch error:', err);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [sessionKey]);

    // --- Запуск и интервалы ---
    useEffect(() => {
        if (!sessionKey) return;

        // Параллельно стартуем оба
        loadDynamic();
        loadStatic();

        const dynamicTimer = setInterval(loadDynamic, DYNAMIC_INTERVAL);
        const staticTimer  = setInterval(loadStatic, STATIC_INTERVAL);

        return () => {
            clearInterval(dynamicTimer);
            clearInterval(staticTimer);
        };
    }, [loadDynamic, loadStatic, sessionKey]);

    // hasData: есть ли вообще данные для этой сессии
    const hasData = drivers.length > 0 || positions.length > 0;

    return { positions, intervals, drivers, stints, pits, fiaMessages, radio, weather, loading, hasData };
}

export default useLiveData;