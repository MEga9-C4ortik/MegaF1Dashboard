import { useState, useEffect } from 'react'
import {
    fetchRaceResult,
    fetchQualiResult,
    fetchSprintResult,
    fetchFP
} from '../services/JolpiApi'

function useRaceResult(year, round) {
    const [sessions, setSessions] = useState({
        race: null,
        quali: null,
        sprint: null,
        fp1: null,
        fp2: null,
        fp3: null,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true)

                const [race, quali, sprint, fp1, fp2, fp3] = await Promise.allSettled([
                    fetchRaceResult(year, round),
                    fetchQualiResult(year, round),
                    fetchSprintResult(year, round),
                    fetchFP(year, round, 1),
                    fetchFP(year, round, 2),
                    fetchFP(year, round, 3),
                ]);

                // allSettled не падает если одна сессия не найдена
                setSessions({
                    race:   race.status   === 'fulfilled' ? race.value   : null,
                    quali:  quali.status  === 'fulfilled' ? quali.value  : null,
                    sprint: sprint.status === 'fulfilled' ? sprint.value : null,
                    fp1:    fp1.status    === 'fulfilled' ? fp1.value    : null,
                    fp2:    fp2.status    === 'fulfilled' ? fp2.value    : null,
                    fp3:    fp3.status    === 'fulfilled' ? fp3.value    : null,
                })
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadAll();
    }, [year, round]);

    return { sessions, loading, error };
}

export default useRaceResult;