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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true);

                const [race, quali, sprint, fp1, fp2, fp3] = await Promise.allSettled([
                    fetchRaceResult(year, round),
                    fetchQualiResult(year, round),
                    fetchSprintResult(year, round),
                    fetchFP(year, round, 1),
                    fetchFP(year, round, 2),
                    fetchFP(year, round, 3),
                ]);

                const getValue = (result) =>
                    result.status === 'fulfilled' && result.value ? result.value : null;

                setSessions({
                    race:   getValue(race),
                    quali:  getValue(quali),
                    sprint: getValue(sprint),
                    fp1:    getValue(fp1),
                    fp2:    getValue(fp2),
                    fp3:    getValue(fp3),
                })
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadAll();
    }, [year, round]);

    return { sessions, loading, error };
}

export default useRaceResult;