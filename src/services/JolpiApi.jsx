const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

const safeFetch = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
};

export const fetchRaces = async (year) => {
    const data = await safeFetch(`${BASE_URL}/${year}/races.json`);
    return data.MRData.RaceTable.Races;
}

export const fetchDriverStandings = async (year) => {
    const data = await safeFetch(`${BASE_URL}/${year}/driverstandings.json?limit=100`);
    return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

export const fetchConstructorStandings = async (year) => {
    const data = await safeFetch(`${BASE_URL}/${year}/constructorstandings.json?limit=100`);
    return data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
}

export const fetchRaceResult = async (year, round) => {
    const data = await safeFetch(`${BASE_URL}/${year}/${round}/results.json`);
    return data.MRData.RaceTable.Races[0];
}

export const fetchQualiResult = async (year, round) => {
    const data = await safeFetch(`${BASE_URL}/${year}/${round}/qualifying.json`);
    return data.MRData.RaceTable.Races[0];
}

export const fetchSprintResult = async (year, round) => {
    const data = await safeFetch(`${BASE_URL}/${year}/${round}/sprint.json`);
    return data.MRData.RaceTable.Races[0];
}

export const fetchRace = async (year, round) => {
    try {
        const data = await safeFetch(`${BASE_URL}/${year}/${round}/races.json`);
        return data.MRData.RaceTable.Races[0] ?? null;
    } catch {
        return null;
    }
}