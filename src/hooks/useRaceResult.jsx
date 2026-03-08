import { useState, useEffect } from 'react'
import {
    fetchRaceResult,
    fetchQualiResult,
    fetchSprintResult,
} from '../services/JolpiApi'

function useRaceResult(year, round) {
    const [sessions, setSessions] = useState({
        race:   null,
        quali:  null,
        sprint: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoading(true);
                setError(null);

                const [race, quali, sprint] = await Promise.allSettled([
                    fetchRaceResult(year, round),
                    fetchQualiResult(year, round),
                    fetchSprintResult(year, round),
                ]);

                const getValue = (result) =>
                    result.status === 'fulfilled' && result.value ? result.value : null;

                setSessions({
                    race:   getValue(race),
                    quali:  getValue(quali),
                    sprint: getValue(sprint),
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [year, round]);

    return { sessions, loading, error };
}

export default useRaceResult;