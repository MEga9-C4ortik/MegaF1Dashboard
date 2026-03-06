import { useState, useEffect } from 'react'
import { fetchCurrentSession } from '../services/openf1Api'

function useLiveSession() {
    const [session, setSession] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const data = await fetchCurrentSession()
                setSession(data)

                // проверяем идёт ли сессия прямо сейчас
                if (data?.date_end) {
                    const end = new Date(data.date_end)
                    const now = new Date()
                    setIsLive(now < end)
                } else {
                    setIsLive(false)
                }
            } catch (err) {
                console.error('Session check failed:', err)
                setIsLive(false)
            } finally {
                setLoading(false)
            }
        }

        checkSession();

        const interval = setInterval(checkSession, 30000)
        return () => clearInterval(interval)
    }, []);

    return { session, isLive, loading }
}

export default useLiveSession;