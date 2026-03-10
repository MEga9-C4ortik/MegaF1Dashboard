const BASE_URL = 'https://api.openf1.org/v1'

const safeFetch = async (url) => {
  const res = await fetch(url);
  // OpenF1 возвращает 404 когда данных нет (а не пустой массив) — трактуем как []
  if (res.status === 404) return [];
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

export const fetchIntervalsGaps = async (sessionKey, sinceDate = null) => {
  // Гонка 90 мин × 20 пилотов × каждые 5с = ~21600 записей.
  // Первый загруз: limit=25000 чтобы не обрезать.
  // Инкрементально: только свежие записи как laps/positions.
  const url = sinceDate
      ? `${BASE_URL}/intervals?session_key=${sessionKey}&date>=${sinceDate}&limit=1000`
      : `${BASE_URL}/intervals?session_key=${sessionKey}&limit=25000`;
  const data = await safeFetch(url);
  return Array.isArray(data) ? data : [];
}

// Гонка: ~20 пилотов × 70 кругов = ~1400 записей.
// OpenF1 по умолчанию отдаёт 1000 → пропадает вторая половина.
// Ставим limit=5000 — с запасом на любую длину сессии.
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

// Weather: сортируем по date и берём последнюю запись
export const fetchWeather = async (sessionKey) => {
  const data = await safeFetch(`${BASE_URL}/weather?session_key=${sessionKey}&limit=500`);
  if (!Array.isArray(data) || data.length === 0) return [];
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export const fetchTrackLayout = async (sessionKey, driverNumber) => {
  const data = await safeFetch(`${BASE_URL}/location?session_key=${sessionKey}&driver_number=${driverNumber}&limit=5000`);
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