const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

export const fetchRaces = async (year) => {
    const response = await fetch(`${BASE_URL}/${year}/races.json`);
    const data = await response.json();
    return data.MRData.RaceTable.Races;
}

export const fetchDriverStandings = async (year) => {
    const response = await fetch(`${BASE_URL}/${year}/driverstandings.json`);
    const data = await response.json();
    return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

export const fetchConstructorStandings = async (year) => {
    const response = await fetch(`${BASE_URL}/${year}/constructorstandings.json`);
    const data = await response.json();
    return data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
}

export const fetchRaceResult = async (year, round) => {
    const response = await fetch(`${BASE_URL}/${year}/${round}/results.json`);
    const data = await response.json();
    return data.MRData.RaceTable.Races[0];
}

export const fetchQualiResult = async (year, round) => {
    const response = await fetch(`${BASE_URL}/${year}/${round}/qualifying.json`);
    const data = await response.json();
    return data.MRData.RaceTable.Races[0];
}

export const fetchFP = async (year, round, number) => {
    const response = await fetch(`${BASE_URL}/${year}/${round}/practice/${number}.json`);
    const data = await response.json();
    return data.MRData.RaceTable.Races[0];
}

export const fetchSprintResult = async (year, round) => {
    const response = await fetch(`${BASE_URL}/${year}/${round}/sprint.json`)
    const data = await response.json()
    return data.MRData.RaceTable.Races[0]
}