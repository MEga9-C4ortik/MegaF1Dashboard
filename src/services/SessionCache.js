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

export function hasStaticCache(sessionKey) {
    const c = cache[sessionKey];
    return c && Array.isArray(c.drivers) && c.drivers.length > 0;
}

// Track layout кешируется навсегда — трасса не меняется в рамках митинга
export function getTrackLayoutCache(sessionKey) {
    return trackLayoutCache[sessionKey] ?? null;
}

export function setTrackLayoutCache(sessionKey, data) {
    trackLayoutCache[sessionKey] = data;
}