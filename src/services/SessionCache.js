const cache = {};
const trackLayoutCache = {};

export function getCached(sessionKey) {
    return cache[sessionKey] ?? null;
}

export function setCached(sessionKey, data) {
    cache[sessionKey] = {
        ...(cache[sessionKey] ?? {}),
        ...data,
    };
}

// Статик кэш валиден только если у пилотов есть team_colour.
// Для свежих сессий OpenF1 иногда не успевает заполнить цвета —
// в этом случае возвращаем false чтобы перезагрузить.
export function hasStaticCache(sessionKey) {
    const c = cache[sessionKey];
    if (!c || !Array.isArray(c.drivers) || c.drivers.length === 0) return false;
    return c.drivers.some(d => d.team_colour != null);
}

export function getTrackLayoutCache(sessionKey) {
    return trackLayoutCache[sessionKey] ?? null;
}

export function setTrackLayoutCache(sessionKey, data) {
    trackLayoutCache[sessionKey] = data;
}