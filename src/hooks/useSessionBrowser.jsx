import { useState, useEffect } from 'react'
import { fetchMeetings, fetchSessionsByMeeting } from '../services/openf1Api'

function useSessionBrowser(year, initialSessionKey = null) {
    const [meetings, setMeetings] = useState([]);
    const [selectedMeetingKey, setSelectedMeetingKey] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionKey, setSelectedSessionKey] = useState(initialSessionKey);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);

    useEffect(() => {
        if (!year) return;

        setMeetings([]);
        setSelectedMeetingKey(null);
        setSessions([]);
        setSelectedSessionKey(initialSessionKey ?? null);
        setLoadingMeetings(true);

        const load = async () => {
            try {
                const data = await fetchMeetings(year);
                setMeetings(data);
            } catch (err) {
                console.error('fetchMeetings failed:', err);
            } finally {
                setLoadingMeetings(false);
            }
        };

        load();
    }, [year, initialSessionKey]);

    useEffect(() => {
        if (!selectedMeetingKey) return;

        setSessions([]);
        setSelectedSessionKey(null);
        setLoadingSessions(true);

        const load = async () => {
            try {
                const data = await fetchSessionsByMeeting(selectedMeetingKey);
                setSessions(
                    data.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
                );
            } catch (err) {
                console.error('fetchSessionsByMeeting failed:', err);
            } finally {
                setLoadingSessions(false);
            }
        };

        load();
    }, [selectedMeetingKey]);

    return {
        meetings, selectedMeetingKey, setSelectedMeetingKey,
        sessions, selectedSessionKey, setSelectedSessionKey,
        loadingMeetings, loadingSessions,
    };
}

export default useSessionBrowser;