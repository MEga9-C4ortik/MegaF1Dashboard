import { useState, useEffect, useCallback, useRef } from 'react'
import {
    fetchPositions,
    fetchIntervalsGaps,
    fetchLaps,
    fetchDrivers,
    fetchStints,
    fetchPits,
    fetchFiaMessages,
    fetchWeather,
    fetchTeamRadio,
} from '../services/openf1Api'
import { getCached, setCached, hasStaticCache } from '../services/SessionCache'

const DYNAMIC_INTERVAL = 15000;
const STATIC_INTERVAL  = 60000;
const INCREMENTAL_WINDOW_SEC = 35;

const delay = (ms) => new Promise(r => setTimeout(r, ms));

function useLiveData(sessionKey) {
    const [positions, setPositions]     = useState([]);
    const [intervals, setIntervals]     = useState([]);
    const [laps, setLaps]               = useState([]);
    const [weather, setWeather]         = useState(null);
    const [drivers, setDrivers]         = useState([]);
    const [stints, setStints]           = useState([]);
    const [pits, setPits]               = useState([]);
    const [fiaMessages, setFiaMessages] = useState([]);
    const [radio, setRadio]             = useState([]);
    const [loading, setLoading]         = useState(false);

    const initialDynamicDone = useRef(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        initialDynamicDone.current = false;

        if (!sessionKey) {
            setPositions([]);
            setIntervals([]);
            setLaps([]);
            setDrivers([]);
            setStints([]);
            setPits([]);
            setFiaMessages([]);
            setRadio([]);
            setWeather(null);
            setLoading(false);
            return () => { isMounted.current = false; };
        }

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
            if (cached.laps)        setLaps(cached.laps);
            if (cached.weather)     setWeather(cached.weather);
            setLoading(false);
            if (cached.drivers?.length) initialDynamicDone.current = true;
        } else {
            setPositions([]);
            setIntervals([]);
            setLaps([]);
            setDrivers([]);
            setStints([]);
            setPits([]);
            setFiaMessages([]);
            setRadio([]);
            setWeather(null);
        }

        return () => { isMounted.current = false; };
    }, [sessionKey]);

    const loadDynamic = useCallback(async () => {
        if (!sessionKey) return;

        const sinceDate = initialDynamicDone.current
            ? new Date(Date.now() - INCREMENTAL_WINDOW_SEC * 1000).toISOString()
            : null;

        try {
            let posData = null;
            try { posData = await fetchPositions(sessionKey, sinceDate); }
            catch (e) { if (!e.message?.includes('429')) console.error('Positions failed:', e); }

            await delay(200);
            if (!isMounted.current) return;

            // Один запрос — оба поля: interval + gap_to_leader
            let intData = null;
            try { intData = await fetchIntervalsGaps(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Intervals failed:', e); }

            await delay(200);
            if (!isMounted.current) return;

            let lapsData = null;
            try { lapsData = await fetchLaps(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Laps failed:', e); }

            await delay(200);
            if (!isMounted.current) return;

            let wthData = null;
            try { wthData = await fetchWeather(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Weather failed:', e); }

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
                    setCached(sessionKey, { positions: posData });
                }
            }

            if (intData && intData.length > 0) {
                setIntervals(intData);
                setCached(sessionKey, { intervals: intData });
            }

            if (lapsData && lapsData.length > 0) {
                setLaps(lapsData);
                setCached(sessionKey, { laps: lapsData });
            }

            if (wthData && wthData.length > 0) {
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

    const loadStatic = useCallback(async () => {
        if (!sessionKey) return;

        if (hasStaticCache(sessionKey)) {
            setLoading(false);
            return;
        }

        try {
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

            await tryFetch(fetchDrivers,     setDrivers,     'drivers',     0);
            await tryFetch(fetchStints,      setStints,      'stints',      300);
            await tryFetch(fetchPits,        setPits,        'pits',        300);
            await tryFetch(fetchFiaMessages, setFiaMessages, 'fiaMessages', 300);
            await tryFetch(fetchTeamRadio,   setRadio,       'radio',       300);

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

    const hasData = drivers.length > 0 || positions.length > 0;

    return { positions, intervals, laps, drivers, stints, pits, fiaMessages, radio, weather, loading, hasData };
}

export default useLiveData;