import { useState, useEffect } from 'react';
import { fetchRaces } from '../services/JolpiApi';

function useRaces(year) {
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadRaces = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchRaces(year);
                setRaces(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadRaces();
    }, [year]);

    return { races, loading, error };
}

export default useRaces;