const BASE_URL = 'https://api.openf1.org/v1'

const delay = ms => new Promise(r => setTimeout(r, ms));

const safeFetch = async (url) => {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await enqueue(() => fetch(url));

    if (res.status === 404) return [];
    if (res.ok) return res.json();

    // На какие статусы делаем retry?
    const shouldRetry = res.status === 429 || res.status >= 500;

    if (!shouldRetry || attempt === MAX_ATTEMPTS) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    await delay(1000 * Math.pow(2, attempt - 1));
  }
};

const queue = [];
let isRunning = false;

async function worker() {
  isRunning = true;
  while (queue.length > 0) {
    const { fn, resolve, reject } = queue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch(e) {
      reject(e);
    }
    await delay(300);
  }
  isRunning = false;
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    if (!isRunning) worker();
  });
}

export const fetchCurrentSession = async () => {
  const data = await safeFetch(`${BASE_URL}/sessions?session_key=latest`);
  let res = queue(data);
  return Array.isArray(res) && res.length > 0 ? res[0] : null;
};

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

export const fetchPositions = async (sessionKey, sinceDate = null) => {
  const url = sinceDate
      ? `${BASE_URL}/position?session_key=${sessionKey}&date>=${sinceDate}`
      : `${BASE_URL}/position?session_key=${sessionKey}`;
  const data = await safeFetch(url);
  return Array.isArray(data) ? data : [];
}

export const fetchIntervalsGaps = async (sessionKey, sinceDate = null) => {
  const url = sinceDate
      ? `${BASE_URL}/intervals?session_key=${sessionKey}&date>=${sinceDate}`
      : `${BASE_URL}/intervals?session_key=${sessionKey}`;
  const data = await safeFetch(url);
  return Array.isArray(data) ? data : [];
}

export const fetchLaps = async (sessionKey, sinceDate = null) => {
  const url = sinceDate
      ? `${BASE_URL}/laps?session_key=${sessionKey}&date_start>=${sinceDate}`
      : `${BASE_URL}/laps?session_key=${sessionKey}`;
  const data = await safeFetch(url);
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

export const fetchDriverLocations = async (sessionKey, replayTime = null) => {
  let url;
  if (replayTime) {
    const t = typeof replayTime === 'string' ? new Date(replayTime) : replayTime;
    const since = new Date(t.getTime() - 5000).toISOString();
    const until = t.toISOString();
    url = `${BASE_URL}/location?session_key=${sessionKey}&date>=${since}&date<=${until}`;
  } else {
    const since = new Date(Date.now() - 5000).toISOString();
    url = `${BASE_URL}/location?session_key=${sessionKey}&date>=${since}`;
  }
  const data = await safeFetch(url);
  return Array.isArray(data) ? data : [];
}