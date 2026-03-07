const BASE_URL = 'https://api.openf1.org/v1'

const safeFetch = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

export const fetchCurrentSession = async () => {
  const data = await safeFetch(`${BASE_URL}/sessions?session_key=latest`);
  return Array.isArray(data) ? (data[0] ?? null) : null;
}

export const fetchSessionsByMeeting = async (meetingKey) => {
  const data = await safeFetch(`${BASE_URL}/sessions?meeting_key=${meetingKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchPositions = async (sessionKey, sinceDate = null) => {
  const url = sinceDate
      ? `${BASE_URL}/position?session_key=${sessionKey}&date>=${sinceDate}`
      : `${BASE_URL}/position?session_key=${sessionKey}`;
  const data = await safeFetch(url);
  return Array.isArray(data) ? data : [];
}

export const fetchIntervals = async (sessionKey) => {
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
  return Array.isArray(data) ? data : [];
}

// driverNumber — передаём реального пилота из сессии, не хардкодим 1
export const fetchTrackLayout = async (sessionKey, driverNumber) => {
  const data = await safeFetch(`${BASE_URL}/location?session_key=${sessionKey}&driver_number=${driverNumber}`);
  const arr = Array.isArray(data) ? data : [];
  return arr.filter((_, i) => i % 5 === 0);
}

// replayTime — для replay используем окно вокруг позиции реплея,
// иначе Date.now()-5s это будущее для прошлых сессий → всегда пустой массив
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