import { useState, useEffect, useRef, useMemo } from 'react'
import { fetchTrackLayout, fetchDriverAllLocations } from '../services/openf1Api'
import {
    getTrackLayoutCache, setTrackLayoutCache,
    getLocationCache, setLocationCache
} from '../services/SessionCache'

const W = 800, H = 800, PAD = 40;

function buildNormParams(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = xs.reduce((a, b) => a < b ? a : b, Infinity);
    const maxX = xs.reduce((a, b) => a > b ? a : b, -Infinity);
    const minY = ys.reduce((a, b) => a < b ? a : b, Infinity);
    const maxY = ys.reduce((a, b) => a > b ? a : b, -Infinity);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scaleX = (W - PAD * 2) / rangeX;
    const scaleY = (H - PAD * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (W - rangeX * scale) / 2 - minX * scale;
    const offsetY = (H - rangeY * scale) / 2 - minY * scale;
    return { minX, minY, scale, offsetX, offsetY };
}

function normPoint(x, y, params) {
    return {
        px: x * params.scale + params.offsetX,
        py: y * params.scale + params.offsetY,
    };
}

function pointsToPath(points) {
    if (!points.length) return '';
    return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px.toFixed(1)},${p.py.toFixed(1)}`)
        .join(' ') + ' Z';
}

function useMap(sessionKey, drivers, replayTime = null) {
    const [trackPath, setTrackPath]       = useState('');
    const [allLocations, setAllLocations] = useState([]);
    const [normParams, setNormParams]     = useState(null);
    const [loading, setLoading]           = useState(true);
    const isMounted = useRef(true);
    const firstDriverNum = drivers?.[0]?.driver_number ?? null;

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!sessionKey || !firstDriverNum) return;
        setLoading(true);
        setTrackPath('');
        setAllLocations([]);
        setNormParams(null);

        const load = async () => {
            try {
                const cachedTrack = getTrackLayoutCache(sessionKey);
                let points = [];
                const MIN_POINTS = 1000;

                if (cachedTrack) {
                    points = cachedTrack;
                } else {
                    for (const driver of drivers) {
                        if (!isMounted.current) return;
                        const candidate = await fetchTrackLayout(sessionKey, driver.driver_number);
                        if (candidate.length >= MIN_POINTS) {
                            points = candidate;
                            break;
                        }
                    }
                    if (points.length >= MIN_POINTS) {
                        setTrackLayoutCache(sessionKey, points);
                    }
                }

                if (points.length >= MIN_POINTS && isMounted.current) {
                    const params = buildNormParams(points);
                    setNormParams(params);
                    const normed = points.map(p => normPoint(p.x, p.y, params));
                    setTrackPath(pointsToPath(normed));
                }

                if (!isMounted.current) return;

                const cachedLocs = getLocationCache(sessionKey);
                if (cachedLocs) {
                    if (isMounted.current) setAllLocations(cachedLocs);
                } else {
                    const allLocs = [];
                    for (const driver of drivers) {
                        if (!isMounted.current) return;
                        try {
                            const driverLocs = await fetchDriverAllLocations(sessionKey, driver.driver_number);
                            allLocs.push(...driverLocs);
                        } catch (e) {
                            console.error(`Locations failed for driver ${driver.driver_number}:`, e);
                        }
                    }
                    if (isMounted.current) {
                        setAllLocations(allLocs);
                        setLocationCache(sessionKey, allLocs);
                    }
                }
            } catch (err) {
                console.error('Map load failed:', err);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        load();
    }, [sessionKey, firstDriverNum]);

    const driverDots = useMemo(() => {
        if (!normParams || !allLocations.length || !replayTime) return [];

        const ct = replayTime instanceof Date ? replayTime.getTime() : new Date(replayTime).getTime();
        const since = ct - 5000;

        const driversMap = {};
        drivers?.forEach(d => { driversMap[d.driver_number] = d; });

        const latest = {};
        for (const loc of allLocations) {
            if (loc._ts >= since && loc._ts <= ct) {
                if (!latest[loc.driver_number] || loc._ts > latest[loc.driver_number]._ts) {
                    latest[loc.driver_number] = loc;
                }
            }
        }

        return Object.values(latest).map(loc => {
            const { px, py } = normPoint(loc.x, loc.y, normParams);
            const driver = driversMap[loc.driver_number];
            return {
                driver_number: loc.driver_number,
                px, py,
                color: driver?.team_colour ? `#${driver.team_colour}` : null,
                acronym: driver?.name_acronym ?? null,
                number: loc.driver_number,
            };
        });
    }, [allLocations, normParams, replayTime, drivers]);

    return { trackPath, driverDots, loading, W, H };
}

export default useMap;