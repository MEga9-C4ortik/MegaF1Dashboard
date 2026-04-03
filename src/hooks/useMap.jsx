import { useState, useEffect, useRef, useMemo } from 'react'
import { fetchTrackLayout, fetchDriverAllLocations } from '../services/openf1Api'
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
    return points.map((p, i) => {
        if (i === 0) return `M${p.px.toFixed(1)},${p.py.toFixed(1)}`;
        const prev = points[i - 1];
        const dx = p.px - prev.px;
        const dy = p.py - prev.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < 4) return null;
        const cmd = dist > 50 ? 'M' : 'L';
        return `${cmd}${p.px.toFixed(1)},${p.py.toFixed(1)}`;
    }).filter(Boolean).join(' ');
}

function useMap(sessionKey, drivers, replayTime = null) {
    const [trackPath, setTrackPath]     = useState('');
    const [allLocations, setAllLocations] = useState([]);
    const [normParams, setNormParams]   = useState(null);
    const [trackLoading, setTrackLoading] = useState(true);
    const [locProgress, setLocProgress] = useState({ done: 0, total: 0 });

    const firstDriverNum = drivers?.[0]?.driver_number ?? null;

    useEffect(() => {
        if (!sessionKey || !firstDriverNum) return;

        let cancelled = false;

        setTrackLoading(true);
        setTrackPath('');
        setAllLocations([]);
        setNormParams(null);
        setLocProgress({ done: 0, total: 0 });

        const load = async () => {
            try {
                const cachedTrack = getTrackLayoutCache(sessionKey);
                let points = [];
                let bestPoints = [];
                const MIN_POINTS = 2500;

                if (cachedTrack) {
                    points = cachedTrack;
                } else {
                    const lapCounts = await Promise.all(
                        drivers.map(async (driver) => {
                            try {
                                const res = await fetch(
                                    `https://api.openf1.org/v1/laps?session_key=${sessionKey}&driver_number=${driver.driver_number}`
                                );
                                const data = await res.json();
                                return { driver, count: Array.isArray(data) ? data.length : 0 };
                            } catch {
                                return { driver, count: 0 };
                            }
                        })
                    );

                    const sortedDrivers = [...lapCounts]
                        .sort((a, b) => b.count - a.count)
                        .map(d => d.driver);

                    for (const driver of sortedDrivers) {
                        if (cancelled) return;
                        const candidate = await fetchTrackLayout(sessionKey, driver.driver_number);
                        if (candidate.length > bestPoints.length) bestPoints = candidate;
                        if (candidate.length >= MIN_POINTS) {
                            points = candidate;
                            break;
                        }
                    }

                    if (points.length < MIN_POINTS && bestPoints.length > 50) points = bestPoints;
                    if (points.length > 50) setTrackLayoutCache(sessionKey, points);
                }

                if (cancelled) return;

                const filtered = points.filter((p, i) => {
                    if (i === 0) return true;
                    const prev = points[i - 1];
                    const dist = Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
                    return dist < 800;
                });

                if (filtered.length > 50) {
                    const params = buildNormParams(filtered);
                    setNormParams(params);
                    const normed = filtered.map(p => normPoint(p.x, p.y, params));
                    setTrackPath(pointsToPath(normed));
                }

                setTrackLoading(false);

                const cachedLocs = getLocationCache(sessionKey);
                if (cachedLocs) {
                    if (!cancelled) {
                        setAllLocations(cachedLocs);
                        setLocProgress({
                            done: cachedLocs.length > 0 ? drivers.length : 0,
                            total: drivers.length,
                        });
                    }
                } else {
                    if (!cancelled) setLocProgress({ done: 0, total: drivers.length });

                    const allLocs = [];
                    for (let i = 0; i < drivers.length; i++) {
                        if (cancelled) return;
                        try {
                            const locs = await fetchDriverAllLocations(sessionKey, drivers[i].driver_number);
                            allLocs.push(...locs);
                        } catch (e) {
                            console.error(`Locations failed for driver ${drivers[i].driver_number}:`, e);
                        }
                        if (!cancelled) setLocProgress({ done: i + 1, total: drivers.length });
                        if (i < drivers.length - 1) await delay(100);
                    }

                    if (!cancelled) {
                        setAllLocations(allLocs);
                        setLocationCache(sessionKey, allLocs);
                    }
                }
            } catch (err) {
                console.error('Map load failed:', err);
                if (!cancelled) setTrackLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [sessionKey, firstDriverNum]);

    const driverDots = useMemo(() => {
        if (!normParams || !allLocations.length || !replayTime) return [];

        const ct = replayTime instanceof Date ? replayTime.getTime() : new Date(replayTime).getTime();
        const driversMap = {};
        drivers?.forEach(d => { driversMap[d.driver_number] = d; });

        const latest = {};
        for (const loc of allLocations) {
            if (loc._ts <= ct) {
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