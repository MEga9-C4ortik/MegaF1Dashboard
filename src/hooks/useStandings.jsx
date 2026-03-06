import {useState, useEffect} from 'react'
import {fetchConstructorStandings,fetchDriverStandings} from "../services/JolpiApi.jsx";

function useStandings(year) {
    const [drivers, setDrivers] = useState([]);
    const [constructors, setConstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [drv,con] = await Promise.allSettled([
                    fetchDriverStandings(year),
                    fetchConstructorStandings(year)
                    ]);

                setDrivers(drv.status === 'fulfilled' ? drv.value : []);
                setConstructors(con.status === 'fulfilled' ? con.value : []);
            }catch(error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [year]);
    return {drivers, constructors, loading, error};
}

export default useStandings;