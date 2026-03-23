import { useState, useEffect, useRef, useMemo } from 'react'
import { fetchTrackLayout, fetchDriverLocationsDirectly } from '../services/openf1Api'
import {
    getTrackLayoutCache, setTrackLayoutCache,
    getLocationCache, setLocationCache
} from '../services/SessionCache'

const W = 800, H = 800, PAD = 40;
const delay = ms => new Promise(r => setTimeout(r, ms));

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
    // Две фазы загрузки — трек отдельно, локации отдельно
    const [trackLoading, setTrackLoading]   = useState(true);
    const [locProgress, setLocProgress]     = useState({ done: 0, total: 0 });
    const isMounted = useRef(true);
    const firstDriverNum = drivers?.[0]?.driver_number ?? null;

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!sessionKey || !firstDriverNum) return;
        setTrackLoading(true);
        setTrackPath('');
        setAllLocations([]);
        setNormParams(null);
        setLocProgress({ done: 0, total: 0 });

        const load = async () => {
            try {
                // ── Фаза 1: трек ──────────────────────────────────────────────
                const cachedTrack = getTrackLayoutCache(sessionKey);
                let points = [];
                let bestPoints = []; // лучшее что нашли, даже если мало точек
                const MIN_POINTS = 500; // после i%5 = 2500 оригинальных точек

                if (cachedTrack) {
                    points = cachedTrack;
                } else {
                    for (const driver of drivers) {
                        if (!isMounted.current) return;
                        const candidate = await fetchTrackLayout(sessionKey, driver.driver_number);
                        if (candidate.length > bestPoints.length) {
                            bestPoints = candidate;
                        }
                        if (candidate.length >= MIN_POINTS) {
                            points = candidate;
                            break;
                        }
                    }
                    // Если ни один пилот не набрал MIN_POINTS — берём лучшее что есть
                    if (points.length < MIN_POINTS && bestPoints.length > 50) {
                        points = bestPoints;
                    }
                    if (points.length > 50) {
                        setTrackLayoutCache(sessionKey, points);
                    }
                }

                if (points.length > 50 && isMounted.current) {
                    const params = buildNormParams(points);
                    setNormParams(params);
                    const normed = points.map(p => normPoint(p.x, p.y, params));
                    setTrackPath(pointsToPath(normed));
                }

                // Трек загружен — показываем его немедленно
                if (isMounted.current) setTrackLoading(false);

                if (!isMounted.current) return;

                // ── Фаза 2: локации пилотов (фоново, с прогрессом) ────────────
                const cachedLocs = getLocationCache(sessionKey);
                if (cachedLocs) {
                    if (isMounted.current) {
                        setAllLocations(cachedLocs);
                        setLocProgress({ done: cachedLocs.length > 0 ? drivers.length : 0, total: drivers.length });
                    }
                } else {
                    if (isMounted.current) setLocProgress({ done: 0, total: drivers.length });
                    const allLocs = [];

                    for (let i = 0; i < drivers.length; i++) {
                        if (!isMounted.current) return;
                        try {
                            const locs = await fetchDriverLocationsDirectly(sessionKey, drivers[i].driver_number);
                            allLocs.push(...locs);
                        } catch (e) {
                            console.error(`Locations failed for driver ${drivers[i].driver_number}:`, e);
                        }
                        if (isMounted.current) {
                            setLocProgress({ done: i + 1, total: drivers.length });
                        }
                        // 150мс между запросами — 20 пилотов = ~3 сек вместо 10
                        if (i < drivers.length - 1) await delay(150);
                    }

                    if (isMounted.current) {
                        setAllLocations(allLocs);
                        setLocationCache(sessionKey, allLocs);
                    }
                }
            } catch (err) {
                console.error('Map load failed:', err);
                if (isMounted.current) setTrackLoading(false);
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

    return { trackPath, driverDots, trackLoading, locProgress, W, H };
}

export default useMap;