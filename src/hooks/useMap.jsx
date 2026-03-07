import { useState, useEffect, useRef } from 'react'
import { fetchTrackLayout, fetchDriverLocations } from '../services/openf1Api'
import { getTrackLayoutCache, setTrackLayoutCache } from '../services/SessionCache'

const W = 600, H = 400, PAD = 24;

function buildNormParams(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scaleX = (W - PAD * 2) / rangeX;
    const scaleY = (H - PAD * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY);
    return { minX, minY, scale };
}

function normPoint(x, y, params) {
    return {
        px: (x - params.minX) * params.scale + PAD,
        py: (y - params.minY) * params.scale + PAD,
    };
}

function pointsToPath(points) {
    if (!points.length) return ''
    return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px.toFixed(1)},${p.py.toFixed(1)}`)
        .join(' ') + ' Z';
}

function useMap(sessionKey, drivers, replayTime = null) {
    const [trackPath, setTrackPath] = useState('');
    const [driverDots, setDriverDots] = useState([]);
    const [normParams, setNormParams] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (!sessionKey) return;
        setLoading(true);
        setTrackPath('');
        setDriverDots([]);
        setNormParams(null);

        const load = async () => {
            try {
                const cached = getTrackLayoutCache(sessionKey);
                let points;

                if (cached) {
                    points = cached;
                } else {
                    await new Promise(r => setTimeout(r, 800));
                    if (!isMounted.current) return;

                    // Используем первого доступного пилота из сессии, а не хардкодим 1.
                    // Если driver_number=1 не едет в этом сезоне — API вернёт пустой массив.
                    const driverNum = drivers?.length > 0 ? drivers[0].driver_number : 1;
                    points = await fetchTrackLayout(sessionKey, driverNum);
                    if (points.length) setTrackLayoutCache(sessionKey, points);
                }

                if (!points.length || !isMounted.current) return;

                const params = buildNormParams(points);
                setNormParams(params);
                const normed = points.map(p => normPoint(p.x, p.y, params));
                setTrackPath(pointsToPath(normed));
            } catch (err) {
                console.error('Track layout failed:', err);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }

        load();
    }, [sessionKey]);

    useEffect(() => {
        if (!sessionKey || !normParams) return;

        const driversMap = {};
        drivers?.forEach(d => { driversMap[d.driver_number] = d });

        const loadLocations = async () => {
            try {
                // В replay режиме передаём replayTime — запрашиваем локации на момент реплея.
                // В pitWall режиме replayTime = null — берём последние 5 секунд реального времени.
                const raw = await fetchDriverLocations(sessionKey, replayTime);
                if (!raw.length || !isMounted.current) return;

                const latest = {};
                raw.forEach(loc => {
                    if (!latest[loc.driver_number] ||
                        loc.date > latest[loc.driver_number].date) {
                        latest[loc.driver_number] = loc;
                    }
                });

                const dots = Object.values(latest).map(loc => {
                    const { px, py } = normPoint(loc.x, loc.y, normParams);
                    const driver = driversMap[loc.driver_number];
                    return {
                        driver_number: loc.driver_number,
                        px, py,
                        color: driver?.team_colour ? `#${driver.team_colour}` : '#888',
                        acronym: driver?.name_acronym ?? `${loc.driver_number}`,
                    };
                });

                if (isMounted.current) setDriverDots(dots);
            } catch (err) {
                if (!err.message?.includes('429')) {
                    console.error('Driver locations failed:', err);
                }
            }
        }

        loadLocations();

        // В replay режиме интервальный polling не нужен — replayTime обновляется снаружи.
        // В pitWall режиме — опрашиваем каждые 5 секунд.
        if (replayTime) return;
        const interval = setInterval(loadLocations, 5000);
        return () => clearInterval(interval);
    }, [sessionKey, normParams, drivers, replayTime]);

    return { trackPath, driverDots, loading, W, H };
}

export default useMap;