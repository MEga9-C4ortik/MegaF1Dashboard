const cache = {};
const trackLayoutCache = {};
const locationCache = {};

export function getCached(sessionKey) {
    return cache[sessionKey] ?? null;
}

export function setCached(sessionKey, data) {
    cache[sessionKey] = {
        ...(cache[sessionKey] ?? {}),
        ...data,
    };
}

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

export function getLocationCache(sessionKey) {
    return locationCache[sessionKey] ?? null;
}

export function setLocationCache(sessionKey, data) {
    locationCache[sessionKey] = data;
}