import { useState, useEffect } from 'react'
import { fetchMeetings, fetchSessionsByMeeting } from '../services/openf1Api'

// Маппинг session_name из OpenF1 → ключи которые использует Race.jsx
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

// Матчим страну Jolpi ('United Kingdom', 'UAE') с country_name из OpenF1 ('Great Britain', 'Abu Dhabi')
// Делаем мягкое сравнение — ищем вхождение слова
const countriesMatch = (jolpiCountry, openf1Country) => {
    if (!jolpiCountry || !openf1Country) return false;
    const a = jolpiCountry.toLowerCase();
    const b = openf1Country.toLowerCase();
    return a.includes(b) || b.includes(a);
};

// year       — год гонки (строка или число)
// countryName — из raceInfo.Circuit.Location.country (Jolpi)
// Возвращает { sessionKeyMap: { race: 9149, quali: 9148, fp1: 9146, ... } }
function useOpenF1Sessions(year, countryName) {
    const [sessionKeyMap, setSessionKeyMap] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!year || !countryName) return;

        setLoading(true);
        setSessionKeyMap({});

        const load = async () => {
            try {
                const meetings = await fetchMeetings(Number(year));
                const match = meetings.find(m => countriesMatch(countryName, m.country_name));

                if (!match) {
                    console.warn(`OpenF1: no meeting found for "${countryName}" in ${year}`);
                    return;
                }

                const sessions = await fetchSessionsByMeeting(match.meeting_key);
                const map = {};
                sessions.forEach(s => {
                    const key = SESSION_NAME_MAP[s.session_name];
                    if (key) map[key] = s.session_key;
                });
                setSessionKeyMap(map);
            } catch (err) {
                console.error('useOpenF1Sessions failed:', err);
            } finally {
                setLoading(false);
            }
        };

        load();

    }, [year, countryName]);

    return { sessionKeyMap, loading };
}

export default useOpenF1Sessions;