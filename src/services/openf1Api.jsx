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

export const fetchPositions = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/position?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchIntervals = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/intervals?session_key=${sessionKey}`);
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

export const fetchTrackLayout = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/location?session_key=${sessionKey}&driver_number=1`);
  const arr = Array.isArray(data) ? data : [];
  return arr.filter((_, i) => i % 5 === 0);
}

export const fetchDriverLocations = async (sessionKey) => {
  const since = new Date(Date.now() - 5000).toISOString()
  const data = await safeFetch(`${BASE_URL}/location?session_key=${sessionKey}&date>=${since}`);
  return Array.isArray(data) ? data : [];
}