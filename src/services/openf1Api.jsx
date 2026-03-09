const BASE_URL = 'https://api.openf1.org/v1'

const safeFetch = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json()
}

export const fetchCurrentSession = async () => {
  const data = await safeFetch(`${BASE_URL}/sessions?session_key=latest`);
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
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

export const fetchIntervalsGaps = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/intervals?session_key=${sessionKey}&limit=5000`);
  const result = Array.isArray(data) ? data : [];
  console.log(`[intervals] session=${sessionKey} count=${result.length}`, result[0] ?? 'EMPTY');
  return result;
}

export const fetchLaps = async (sessionKey, sinceDate = null) => {
  const url = sinceDate
      ? `${BASE_URL}/laps?session_key=${sessionKey}&date_start>=${sinceDate}&limit=500`
      : `${BASE_URL}/laps?session_key=${sessionKey}&limit=5000`;
  const data = await safeFetch(url);
  return Array.isArray(data) ? data : [];
}

export const fetchDrivers = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/drivers?session_key=${sessionKey}`);
  return Array.isArray(data) ? data : [];
}

export const fetchStints = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/stints?session_key=${sessionKey}&limit=500`);
  return Array.isArray(data) ? data : [];
}

export const fetchPits = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/pit?session_key=${sessionKey}&limit=500`);
  return Array.isArray(data) ? data : [];
}

export const fetchFiaMessages = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/race_control?session_key=${sessionKey}&limit=500`);
  return Array.isArray(data) ? data : [];
}

export const fetchTeamRadio = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/team_radio?session_key=${sessionKey}&limit=500`);
  return Array.isArray(data) ? data : [];
}

export const fetchWeather = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/weather?session_key=${sessionKey}&limit=500`);
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