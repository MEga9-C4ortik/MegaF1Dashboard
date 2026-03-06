import { useState, useEffect, useCallback } from 'react'
import {
    fetchPositions,
    fetchIntervals,
    fetchDrivers,
    fetchStints,
    fetchPits,
    fetchFiaMessages,
    fetchWeather,
} from '../services/openf1Api'

function useLiveData(session) {
    const [positions, setPositions] = useState([]);
    const [intervals, setIntervals] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [stints, setStints] = useState([]);
    const [pits, setPits] = useState([]);
    const [fiaMessages, setFiaMessages] = useState([]);
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback( async () => {
        if(!session) return;

        try {
            const [pos, int, drv, stn, pit, fms, wth] = await Promise.allSettled([
                fetchPositions(session),
                fetchIntervals(session),
                fetchDrivers(session),
                fetchStints(session),
                fetchPits(session),
                fetchFiaMessages(session),
                fetchWeather(session),
            ]);

            if (pos.status === 'fulfilled') setPositions(pos.value)
            if (int.status === 'fulfilled') setIntervals(int.value)
            if (drv.status === 'fulfilled') setDrivers(drv.value)
            if (stn.status === 'fulfilled') setStints(stn.value)
            if (pit.status === 'fulfilled') setPits(pit.value)
            if (fms.status === 'fulfilled') setFiaMessages(fms.value)
            if (wth.status === 'fulfilled') setWeather(wth.value?.at(-1) ?? null)
        } catch(error) {
            console.error('Live data fetch failed:', error);
        } finally {
            setLoading(false);
        }
    } , [session]);

    useEffect(() => {
        loadData();

        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [loadData]);

    return { positions, intervals, drivers, stints, pits, fiaMessages, weather, loading }
}

export default useLiveData;