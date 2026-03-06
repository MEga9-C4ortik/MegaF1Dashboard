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

// Drivers and stints don't change during a session - fetch once
const STATIC_ENDPOINTS_INTERVAL = 60000; // 1 min
const DYNAMIC_ENDPOINTS_INTERVAL = 15000; // 15 sec (was 5s → 3x less 429s)

function useLiveData(sessionKey) {
    const [positions, setPositions] = useState([]);
    const [intervals, setIntervals] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [stints, setStints] = useState([]);
    const [pits, setPits] = useState([]);
    const [fiaMessages, setFiaMessages] = useState([]);
    const [radio, setRadio] = useState([]);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        setPositions([]);
        setIntervals([]);
        setDrivers([]);
        setStints([]);
        setPits([]);
        setFiaMessages([]);
        setRadio([]);
        setWeather(null);
        setLoading(true);
        return () => { isMounted.current = false; };
    }, [sessionKey]);

    // Dynamic data: positions, intervals, weather — poll often
    const loadDynamic = useCallback(async () => {
        if (!sessionKey) return;
        try {
            const [pos, int, wth] = await Promise.allSettled([
                fetchPositions(sessionKey),
                fetchIntervals(sessionKey),
                fetchWeather(sessionKey),
            ]);
            if (!isMounted.current) return;
            if (pos.status === 'fulfilled') setPositions(pos.value);
            if (int.status === 'fulfilled') setIntervals(int.value);
            if (wth.status === 'fulfilled') setWeather(wth.value?.at(-1) ?? null);
        } catch (error) {
            console.error('Dynamic data fetch failed:', error);
        }
    }, [sessionKey]);

    // Static-ish data: drivers, stints, pits, FIA, radio — poll rarely
    const loadStatic = useCallback(async () => {
        if (!sessionKey) return;
        try {
            const [drv, stn, pit, fms, trd] = await Promise.allSettled([
                fetchDrivers(sessionKey),
                fetchStints(sessionKey),
                fetchPits(sessionKey),
                fetchFiaMessages(sessionKey),
                fetchTeamRadio(sessionKey),
            ]);
            if (!isMounted.current) return;
            if (drv.status === 'fulfilled') setDrivers(drv.value);
            if (stn.status === 'fulfilled') setStints(stn.value);
            if (pit.status === 'fulfilled') setPits(pit.value);
            if (fms.status === 'fulfilled') setFiaMessages(fms.value);
            if (trd.status === 'fulfilled') setRadio(trd.value);
        } catch (error) {
            console.error('Static data fetch failed:', error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [sessionKey]);

    useEffect(() => {
        if (!sessionKey) return;

        // Initial load: both in parallel
        Promise.all([loadDynamic(), loadStatic()]);

        const dynamicInterval = setInterval(loadDynamic, DYNAMIC_ENDPOINTS_INTERVAL);
        const staticInterval = setInterval(loadStatic, STATIC_ENDPOINTS_INTERVAL);

        return () => {
            clearInterval(dynamicInterval);
            clearInterval(staticInterval);
        };
    }, [loadDynamic, loadStatic, sessionKey]);

    return { positions, intervals, drivers, stints, pits, fiaMessages, radio, weather, loading };
}

export default useLiveData;