// src/hooks/useOpenF1Sessions.jsx
import { useState, useEffect } from 'react'
import { fetchMeetings, fetchSessionsByMeeting, fetchLaps, fetchDrivers } from '../services/openf1Api'

const SESSION_NAME_MAP = {
    'Race':              'race',
    'Qualifying':        'quali',
    'Practice 1':        'fp1',
    'Practice 2':        'fp2',
    'Practice 3':        'fp3',
    'Sprint':            'sprint',
    'Sprint Qualifying': 'sprintQuali',
    'Sprint Shootout':   'sprintQuali',
};

// Матчим по дате: ищем митинг где date_start за 0–7 дней до дня гонки
const meetingMatchesRace = (meeting, raceDate) => {
    if (!meeting.date_start || !raceDate) return false;
    const race = new Date(raceDate).getTime();
    const start = new Date(meeting.date_start).getTime();
    const diffDays = (race - start) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};

async function buildFPClassification(sessionKey) {
    const [laps, drivers] = await Promise.all([
        fetchLaps(sessionKey),
        fetchDrivers(sessionKey),
    ]);

    const driversMap = {};
    drivers.forEach(d => { driversMap[d.driver_number] = d; });

    const bestByDriver = {};
    laps.forEach(lap => {
        if (!lap.lap_duration) return;
        const prev = bestByDriver[lap.driver_number];
        if (!prev || lap.lap_duration < prev.lap_duration) {
            bestByDriver[lap.driver_number] = lap;
        }
    });

    return Object.values(bestByDriver)
        .sort((a, b) => a.lap_duration - b.lap_duration)
        .map((lap, idx) => {
            const d = driversMap[lap.driver_number];
            return {
                position:      idx + 1,
                driver_number: lap.driver_number,
                nameAcronym:   d?.name_acronym ?? String(lap.driver_number),
                familyName:    d?.last_name ?? '',
                teamName:      d?.team_name ?? '',
                teamColour:    d?.team_colour ?? null,
                bestLap:       lap.lap_duration,
            };
        });
}

// Принимает raceDate вместо countryName
function useOpenF1Sessions(year, raceDate) {
    const [sessionKeyMap, setSessionKeyMap] = useState({});
    const [fpResults, setFpResults] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!year || !raceDate) return;

        setLoading(true);
        setSessionKeyMap({});
        setFpResults({});

        const load = async () => {
            try {
                const meetings = await fetchMeetings(Number(year));
                const match = meetings.find(m => meetingMatchesRace(m, raceDate));

                if (!match) {
                    console.warn(`OpenF1: no meeting found for race date "${raceDate}" in ${year}`);
                    return;
                }

                const sessions = await fetchSessionsByMeeting(match.meeting_key);
                const map = {};
                sessions.forEach(s => {
                    const key = SESSION_NAME_MAP[s.session_name];
                    if (key) map[key] = s.session_key;
                });
                setSessionKeyMap(map);

                const fpSessionKeys = ['fp1', 'fp2', 'fp3', 'sprintQuali'].filter(k => map[k]);
                const fpEntries = await Promise.allSettled(
                    fpSessionKeys.map(k => buildFPClassification(map[k]).then(r => [k, r]))
                );

                const fpMap = {};
                fpEntries.forEach(result => {
                    if (result.status === 'fulfilled') {
                        const [k, data] = result.value;
                        if (data.length > 0) fpMap[k] = data;
                    }
                });
                setFpResults(fpMap);

            } catch (err) {
                console.error('useOpenF1Sessions failed:', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [year, raceDate]);

    return { sessionKeyMap, fpResults, loading };
}

export default useOpenF1Sessions;