const BASE_URL = 'https://api.openf1.org/v1'
const QUEUE_DELAY = 500;

const delay = ms => new Promise(r => setTimeout(r, ms));

const safeFetch = async (url) => {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await enqueue(() => fetch(url));
    if (res.status === 404) return [];
    if (res.ok) return res.json();
    const shouldRetry = res.status === 429 || res.status >= 500;
    if (!shouldRetry || attempt === MAX_ATTEMPTS) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    await delay(2000 * Math.pow(2, attempt - 1));
  }
};

const queue = [];
let isRunning = false;

async function worker() {
  isRunning = true;
  while (queue.length > 0) {
    const { fn, resolve, reject } = queue.shift();
    try { resolve(await fn()); } catch(e) { reject(e); }
    await delay(QUEUE_DELAY);
  }
  isRunning = false;
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    if (!isRunning) worker();
  });
}

export const fetchSessionsByMeeting = async (meetingKey) => {
  const data = await safeFetch(`${BASE_URL}/sessions?meeting_key=${meetingKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchMeetings = async (year) => {
  const data = await safeFetch(`${BASE_URL}/meetings?year=${year}`);
  return Array.isArray(data)
      ? data.sort((a, b) => a.meeting_number - b.meeting_number)
      : [];
}

export const fetchPositions = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/position?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchIntervalsGaps = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/intervals?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchLaps = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/laps?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchDrivers = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/drivers?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchStints = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/stints?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchPits = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/pit?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchFiaMessages = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/race_control?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchTeamRadio = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/team_radio?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchWeather = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/weather?session_key=${sessionKey}`);
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export const fetchTrackLayout = async (sessionKey, driverNumber) => {
  const data = await safeFetch(`${BASE_URL}/location?session_key=${sessionKey}&driver_number=${driverNumber}`);
  const arr = Array.isArray(data) ? data : [];
  return arr.filter((_, i) => i % 5 === 0);
}

export const fetchDriverAllLocations = async (sessionKey, driverNumber) => {
  const url = `${BASE_URL}/location?session_key=${sessionKey}&driver_number=${driverNumber}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url); 
      if (res.status === 404) return [];
      if (res.ok) {
        const arr = await res.json();
        return arr
            .filter((_, i) => i % 3 === 0)
            .map(loc => ({ ...loc, _ts: Date.parse(loc.date) }));
      }
      if (res.status === 429 || res.status >= 500) await delay(1500 * attempt);
      else return [];
    } catch {
      if (attempt === 4) return [];
      await delay(1000);
    }
  }
  return [];
};