const BASE_URL = 'https://api.openf1.org/v1'

export const fetchCurrentSession = async () => {
  const response = await fetch(`${BASE_URL}/sessions?session_key=latest`);
  const data = await response.json();
  return data[0] ?? null;
}

export const fetchPositions = async (sessionKey) => {
  const response = await fetch(`${BASE_URL}/positions?session_key=${sessionKey}`);
  const data = await response.json();
  return data;
}

export const fetchIntervals = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/intervals?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchDrivers = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/drivers?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchStints = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/stints?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchPits = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/pit?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchFiaMessages = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/race_control?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchTeamRadio = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/team_radio?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchWeather = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/weather?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}

export const fetchLocation = async (sessionKey) => {
  const res = await fetch(`${BASE_URL}/location?session_key=${sessionKey}`)
  const data = await res.json()
  return data
}