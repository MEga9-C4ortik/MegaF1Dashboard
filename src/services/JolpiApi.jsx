const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

const safeFetch = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
}

export const fetchRaces = async (year) => {
    const data = await safeFetch(`${BASE_URL}/${year}/races.json`);
    return data.MRData.RaceTable.Races;
}

export const fetchDriverStandings = async (year) => {
    const data = await safeFetch(`${BASE_URL}/${year}/driverstandings.json`);
    return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

export const fetchConstructorStandings = async (year) => {
    const data = await safeFetch(`${BASE_URL}/${year}/constructorstandings.json`);
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

export const fetchFP = async (year, round, number) => {
    const data = await safeFetch(`${BASE_URL}/${year}/${round}/practice/${number}.json`);
    // Races[0] будет undefined если у этой гонки нет практики (например sprint weekend)
    // В этом случае бросаем ошибку чтобы Promise.allSettled поймал как rejected
    const race = data.MRData.RaceTable.Races[0];
    if (!race) throw new Error(`No FP${number} data for ${year} round ${round}`);
    return race;
}

export const fetchSprintResult = async (year, round) => {
    const data = await safeFetch(`${BASE_URL}/${year}/${round}/sprint.json`);
    return data.MRData.RaceTable.Races[0];
}