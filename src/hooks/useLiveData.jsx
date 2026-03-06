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

const DYNAMIC_INTERVAL = 15000;  // 15 сек — позиции и интервалы
const STATIC_INTERVAL  = 60000;  // 60 сек — стинты, питы, радио
const INCREMENTAL_WINDOW_SEC = 35; // окно для инкрементальных запросов

// Задержка между запросами чтобы не словить 429
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function useLiveData(sessionKey) {
    const [positions, setPositions]     = useState([]);
    const [intervals, setIntervals]     = useState([]);
    const [weather, setWeather]         = useState(null);
    const [drivers, setDrivers]         = useState([]);
    const [stints, setStints]           = useState([]);
    const [pits, setPits]               = useState([]);
    const [fiaMessages, setFiaMessages] = useState([]);
    const [radio, setRadio]             = useState([]);
    const [loading, setLoading]         = useState(true);

    const initialDynamicDone = useRef(false);
    const isMounted = useRef(true);

    // Сброс при смене сессии — сразу читаем кеш
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
            // Если есть кеш статики — помечаем что первая загрузка уже была
            if (cached.drivers?.length) initialDynamicDone.current = true;
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

    // Динамика: позиции + интервалы + погода
    // Первый раз — полная загрузка, потом — только последние INCREMENTAL_WINDOW_SEC сек
    const loadDynamic = useCallback(async () => {
        if (!sessionKey) return;

        const sinceDate = initialDynamicDone.current
            ? new Date(Date.now() - INCREMENTAL_WINDOW_SEC * 1000).toISOString()
            : null;

        try {
            // Грузим последовательно с задержкой — избегаем 429
            let posData = null, intData = null, wthData = null;

            try {
                posData = await fetchPositions(sessionKey, sinceDate);
            } catch (e) {
                if (!e.message?.includes('429')) console.error('Positions failed:', e);
            }

            await delay(200);
            if (!isMounted.current) return;

            try {
                intData = await fetchIntervals(sessionKey, sinceDate);
            } catch (e) {
                if (!e.message?.includes('429')) console.error('Intervals failed:', e);
            }

            await delay(200);
            if (!isMounted.current) return;

            try {
                wthData = await fetchWeather(sessionKey);
            } catch (e) {
                if (!e.message?.includes('429')) console.error('Weather failed:', e);
            }

            if (!isMounted.current) return;

            if (posData && posData.length > 0) {
                if (initialDynamicDone.current) {
                    setPositions(prev => {
                        const merged = [...prev, ...posData];
                        const seen = new Set();
                        return merged.filter(p => {
                            const key = `${p.driver_number}_${p.date}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    });
                } else {
                    setPositions(posData);
                }
                setCached(sessionKey, { positions: posData });
            }

            if (intData && intData.length > 0) {
                if (initialDynamicDone.current) {
                    setIntervals(prev => {
                        const merged = [...prev, ...intData];
                        const seen = new Set();
                        return merged.filter(i => {
                            const key = `${i.driver_number}_${i.date}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    });
                } else {
                    setIntervals(intData);
                }
                setCached(sessionKey, { intervals: intData });
            }

            if (wthData) {
                const latest = wthData.at(-1) ?? null;
                setWeather(latest);
                setCached(sessionKey, { weather: latest });
            }

            if (!initialDynamicDone.current) {
                initialDynamicDone.current = true;
            }

        } catch (err) {
            console.error('Dynamic fetch error:', err);
        }
    }, [sessionKey]);

    // Статика: drivers, stints, pits, fia, radio
    // Грузим только если нет кеша
    const loadStatic = useCallback(async () => {
        if (!sessionKey) return;

        if (hasStaticCache(sessionKey)) {
            setLoading(false);
            return;
        }

        try {
            // Последовательная загрузка с задержками — не бомбим API одновременно
            const toCache = {};

            const tryFetch = async (fn, setter, key, delayMs = 300) => {
                await delay(delayMs);
                if (!isMounted.current) return;
                try {
                    const data = await fn(sessionKey);
                    if (isMounted.current) setter(data);
                    toCache[key] = data;
                } catch (e) {
                    if (!e.message?.includes('429')) console.error(`${key} failed:`, e);
                }
            };

            await tryFetch(fetchDrivers,    setDrivers,     'drivers',     0);
            await tryFetch(fetchStints,     setStints,      'stints',      300);
            await tryFetch(fetchPits,       setPits,        'pits',        300);
            await tryFetch(fetchFiaMessages,setFiaMessages, 'fiaMessages', 300);
            await tryFetch(fetchTeamRadio,  setRadio,       'radio',       300);

            if (Object.keys(toCache).length > 0) {
                setCached(sessionKey, toCache);
            }
        } catch (err) {
            console.error('Static fetch error:', err);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [sessionKey]);

    useEffect(() => {
        if (!sessionKey) return;

        loadDynamic();
        loadStatic();

        const dynamicTimer = setInterval(loadDynamic, DYNAMIC_INTERVAL);
        const staticTimer  = setInterval(loadStatic,  STATIC_INTERVAL);

        return () => {
            clearInterval(dynamicTimer);
            clearInterval(staticTimer);
        };
    }, [loadDynamic, loadStatic, sessionKey]);

    // hasData: есть реальные данные (не просто загрузились, а непустые)
    const hasData = drivers.length > 0 || positions.length > 0;

    return { positions, intervals, drivers, stints, pits, fiaMessages, radio, weather, loading, hasData };
}

export default useLiveData;