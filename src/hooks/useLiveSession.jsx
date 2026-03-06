import { useState, useEffect } from 'react'
import { fetchCurrentSession, fetchSessionsByMeeting } from '../services/openf1Api'

function useLiveSession() {
    const [session, setSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await fetchCurrentSession();
                setSession(data);

                if (data?.meeting_key) {
                    const allSessions = await fetchSessionsByMeeting(data.meeting_key);
                    setSessions(allSessions.sort((a, b) =>
                        new Date(a.date_start) - new Date(b.date_start)
                    ));
                }

                if (data?.date_end) {
                    const end = new Date(data.date_end);
                    const now = new Date();
                    setIsLive(now < end);
                } else {
                    setIsLive(false);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                setIsLive(false);
            } finally {
                setLoading(false);
            }
        }

        checkSession();
        const interval = setInterval(checkSession, 30000);
        return () => clearInterval(interval);
    }, []);

    return { session, sessions, isLive, loading };
}

export default useLiveSession;