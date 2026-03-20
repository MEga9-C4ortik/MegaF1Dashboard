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
            setWeather([]);
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
            setWeather([]);
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
            try {
                posData = await fetchPositions(sessionKey, sinceDate);
            } catch (e) {
                if (!e.message?.includes('429')) console.error('Positions failed:', e);
            }
            if (!isMounted.current) return;

            let intData = null;
            try {
                intData = await fetchIntervalsGaps(sessionKey, sinceDate);
            } catch(e) {
                if (!e.message?.includes('429')) console.error('Intervals failed:', e);
            }
            if (!isMounted.current) return;

            let weatherData = null;
            try {
                weatherData = await fetchWeather(sessionKey, sinceDate);
            } catch (e) {
                if (!e.message?.includes('429')) console.error('Weather failed:', e);
            }
            if (!isMounted.current) return;

            let lapsData = null;
            try {
                lapsData = await fetchLaps(sessionKey, initialDynamicDone.current
                    ? sinceDate : null);
            }
            catch (e) {
                if (!e.message?.includes('429')) console.error('Laps failed:', e);
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
                    setCached(sessionKey, { positions: posData });
                }
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
                    setCached(sessionKey, { intervals: intData });
                }
            }

            if (weatherData && weatherData.length > 0) {
                if (initialDynamicDone.current) {
                    setWeather(prev => {
                        const merged = [...prev, ...weatherData];
                        const seen = new Set();
                        return merged.filter(i => {
                            const key = `${i.date}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    });
                } else {
                    setWeather(weatherData);
                    setCached(sessionKey, { weather: weatherData });
                }
            }

            if (lapsData && lapsData.length > 0) {
                if (initialDynamicDone.current) {
                    setLaps(prev => {
                        const merged = [...prev, ...lapsData];
                        const seen = new Set();
                        return merged.filter(l => {
                            const key = `${l.driver_number}_${l.lap_number}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                        });
                    });
                } else {
                    setLaps(lapsData);
                    setCached(sessionKey, { laps: lapsData });
                }
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