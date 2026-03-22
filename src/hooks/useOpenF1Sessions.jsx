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
};

const meetingMatchesRace = (meeting, raceDate) => {
    if (!meeting.date_start || !raceDate) return false;
    const raceDay  = raceDate.slice(0, 10);
    const startDay = meeting.date_start.slice(0, 10);
    const diffDays = (new Date(raceDay) - new Date(startDay)) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};

async function buildFPClassification(sessionKey) {
    const laps = await fetchLaps(sessionKey);
    const drivers = await fetchDrivers(sessionKey);

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
                position:     idx + 1,
                driver_number: lap.driver_number,
                nameAcronym:  d?.name_acronym ?? String(lap.driver_number),
                familyName:   d?.last_name ?? '',
                teamName:     d?.team_name ?? '',
                teamColour:   d?.team_colour ?? null,
                bestLap:      lap.lap_duration,
            };
        });
}

function useOpenF1Sessions(year, raceDate) {
    const [sessionKeyMap, setSessionKeyMap] = useState({});
    const [fpResults, setFpResults] = useState({});  // { fp1: [...], fp2: [...], fp3: [...] }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!year || !raceDate) return;

        let cancelled = false;

        setLoading(true);
        setSessionKeyMap({});
        setFpResults({});

        const load = async () => {
            try {
                const meetings = await fetchMeetings(Number(year));
                if (cancelled) return;

                const match = meetings.find(m => meetingMatchesRace(m, raceDate));

                if (!match) {
                    console.warn(`OpenF1: no meeting found for raceDate="${raceDate}" in ${year}`);
                    return;
                }

                const sessions = await fetchSessionsByMeeting(match.meeting_key);
                if (cancelled) return;

                const map = {};
                sessions.forEach(s => {
                    const key = SESSION_NAME_MAP[s.session_name];
                    if (key) map[key] = s.session_key;
                });
                setSessionKeyMap(map);

                const fpSessionKeys = ['fp1', 'fp2', 'fp3', 'sprintQuali'].filter(k => map[k]);
                const fpMap = {};
                for (const k of fpSessionKeys) {
                    if (cancelled) return;
                    try {
                        const data = await buildFPClassification(map[k]);
                        if (data.length > 0) fpMap[k] = data;
                    } catch (err) {
                        console.error(`FP classification failed for ${k}:`, err);
                    }
                }
                setFpResults(fpMap);

            } catch (err) {
                if (!cancelled) console.error('useOpenF1Sessions failed:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => { cancelled = true; };
    }, [year, raceDate]);

    return { sessionKeyMap, fpResults, loading };
}

export default useOpenF1Sessions;