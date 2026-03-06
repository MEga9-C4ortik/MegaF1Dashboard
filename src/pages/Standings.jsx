import {useState} from 'react'
import useStandings from '../hooks/useStandings.jsx'
import styles from './Standings.module.css'

const getPodiumStyle = (position) => {
    if (position === '1' || position === '2' || position === '3')
        return styles.podium;
    return '';
}

function Standings({year}) {
    const {drivers, constructors, loading, error} = useStandings(year);
    const [activeTab, setActiveTab] = useState('drivers');

    if (loading) return <p className={styles.loading}> Loading ...</p>
    if(error) return <p className={styles.error}> Error: {error}</p>

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {activeTab === 'drivers' ? 'Drivers Championship' : 'Constructors Championship'} {year}
                </h1>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'drivers' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('drivers')}
                    >
                        Drivers
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'constructors' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('constructors')}
                    >
                        Constructors
                    </button>
                </div>
            </div>

            {activeTab === 'drivers' && (
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>POS</th>
                        <th>DRIVER</th>
                        <th>TEAM</th>
                        <th>PTS</th>
                        <th>WINS</th>
                    </tr>
                    </thead>
                    <tbody>
                    {drivers.map(d => (
                        <tr key={d.position} className={getPodiumStyle(d.position)}>
                            <td className={styles.pos}>{d.position}</td>
                            <td className={styles.driver}>
                                <span className={styles.driverCode}>{d.Driver.code}</span>
                                <span className={styles.driverName}>
                                    {d.Driver.givenName} {d.Driver.familyName}
                                </span>
                            </td>
                            <td className={styles.team}>{d.Constructors[0]?.name}</td>
                            <td className={styles.pts}>{d.points}</td>
                            <td className={styles.wins}>{d.wins}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {activeTab === 'constructors' && (
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>POS</th>
                        <th>TEAM</th>
                        <th>PTS</th>
                        <th>WINS</th>
                    </tr>
                    </thead>
                    <tbody>
                    {constructors.map(c => (
                        <tr key={c.position} className={getPodiumStyle(c.position)}>
                            <td className={styles.pos}>{c.position}</td>
                            <td className={styles.team}>{c.Constructor.name}</td>
                            <td className={styles.pts}>{c.points}</td>
                            <td className={styles.wins}>{c.wins}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Standings;