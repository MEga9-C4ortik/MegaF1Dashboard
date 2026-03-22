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

const addTs = (items) => items.map(p => p._ts != null ? p : { ...p, _ts: Date.parse(p.date) });

function useLiveData(sessionKey) {
    const [positions, setPositions]     = useState([]);
    const [intervals, setIntervals]     = useState([]);
    const [laps, setLaps]               = useState([]);
    const [weather, setWeather]         = useState([]);
    const [drivers, setDrivers]         = useState([]);
    const [stints, setStints]           = useState([]);
    const [pits, setPits]               = useState([]);
    const [fiaMessages, setFiaMessages] = useState([]);
    const [radio, setRadio]             = useState([]);
    const [loading, setLoading]         = useState(false);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        if (!sessionKey) {
            setPositions([]); setIntervals([]); setLaps([]);
            setDrivers([]); setStints([]); setPits([]);
            setFiaMessages([]); setRadio([]); setWeather([]);
            setLoading(false);
            return () => { isMounted.current = false; };
        }

        setLoading(true);

        const cached = getCached(sessionKey);
        if (cached) {
            if (cached.positions)   setPositions(addTs(cached.positions));
            if (cached.intervals)   setIntervals(addTs(cached.intervals));
            if (cached.laps)        setLaps(cached.laps);
            if (cached.weather)     setWeather(cached.weather);
            if (cached.drivers)     setDrivers(cached.drivers);
            if (cached.stints)      setStints(cached.stints);
            if (cached.pits)        setPits(cached.pits);
            if (cached.fiaMessages) setFiaMessages(cached.fiaMessages);
            if (cached.radio)       setRadio(cached.radio);
            setLoading(false);
        } else {
            setPositions([]); setIntervals([]); setLaps([]);
            setDrivers([]); setStints([]); setPits([]);
            setFiaMessages([]); setRadio([]); setWeather([]);
        }

        return () => { isMounted.current = false; };
    }, [sessionKey]);

    // Dynamic data: positions, intervals, weather, laps
    const loadDynamic = useCallback(async () => {
        if (!sessionKey) return;
        try {
            let posData = null;
            try { posData = await fetchPositions(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Positions failed:', e); }
            if (!isMounted.current) return;

            let intData = null;
            try { intData = await fetchIntervalsGaps(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Intervals failed:', e); }
            if (!isMounted.current) return;

            let weatherData = null;
            try { weatherData = await fetchWeather(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Weather failed:', e); }
            if (!isMounted.current) return;

            let lapsData = null;
            try { lapsData = await fetchLaps(sessionKey); }
            catch (e) { if (!e.message?.includes('429')) console.error('Laps failed:', e); }
            if (!isMounted.current) return;

            if (posData?.length) {
                const withTs = addTs(posData);
                setPositions(withTs);
                setCached(sessionKey, { positions: withTs });
            }
            if (intData?.length) {
                const withTs = addTs(intData);
                setIntervals(withTs);
                setCached(sessionKey, { intervals: withTs });
            }
            if (weatherData?.length) {
                setWeather(weatherData);
                setCached(sessionKey, { weather: weatherData });
            }
            if (lapsData?.length) {
                setLaps(lapsData);
                setCached(sessionKey, { laps: lapsData });
            }
        } catch (err) {
            console.error('Dynamic fetch error:', err);
        }
    }, [sessionKey]);

    // Static data: drivers, stints, pits, fia, radio
    const loadStatic = useCallback(async () => {
        if (!sessionKey) return;

        if (hasStaticCache(sessionKey)) {
            setLoading(false);
            return;
        }

        try {
            const toCache = {};
            const tryFetch = async (fn, setter, key) => {
                if (!isMounted.current) return;
                try {
                    const data = await fn(sessionKey);
                    if (isMounted.current) setter(data);
                    toCache[key] = data;
                } catch (e) {
                    if (!e.message?.includes('429')) console.error(`${key} failed:`, e);
                }
            };

            await tryFetch(fetchDrivers,     setDrivers,     'drivers');
            await tryFetch(fetchStints,      setStints,      'stints');
            await tryFetch(fetchPits,        setPits,        'pits');
            await tryFetch(fetchFiaMessages, setFiaMessages, 'fiaMessages');
            await tryFetch(fetchTeamRadio,   setRadio,       'radio');

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
        const init = async () => {
            await loadDynamic();
            await loadStatic();
        };
        init();
    }, [loadDynamic, loadStatic, sessionKey]);

    const hasData = drivers.length > 0 || positions.length > 0;

    return { positions, intervals, laps, drivers, stints, pits, fiaMessages, radio, weather, loading, hasData };
}

export default useLiveData;