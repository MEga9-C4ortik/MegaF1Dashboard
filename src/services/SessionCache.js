const cache = {};

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