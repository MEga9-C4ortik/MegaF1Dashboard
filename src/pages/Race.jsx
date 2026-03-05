import { useState } from 'react'
import { useParams } from 'react-router-dom'
import useRaceResult from '../hooks/useRaceResult'
import styles from './Race.module.css'

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase()
}

const getMedalStyle = (position) => {
    if (position === '1') return styles.gold
    if (position === '2') return styles.silver
    if (position === '3') return styles.bronze
    return ''
}

function Race() {
    const { raceId } = useParams()
    const [year, round] = raceId.split('-')
    const { sessions, loading, error } = useRaceResult(year, round)
    const [activeSession, setActiveSession] = useState('race')

    if (loading) return <p className={styles.loading}>Loading...</p>
    if (error) return <p className={styles.error}>{error}</p>

    const raceInfo = sessions.race
    if (!raceInfo) return <p className={styles.error}>Race not found</p>

    const tabs = [
        { key: 'race',   label: 'Race',    data: sessions.race },
        { key: 'quali',  label: 'Qualification',   data: sessions.quali },
        { key: 'sprint', label: 'Sprint',  data: sessions.sprint },
        { key: 'fp1',    label: 'FP1',     data: sessions.fp1 },
        { key: 'fp2',    label: 'FP2',     data: sessions.fp2 },
        { key: 'fp3',    label: 'FP3',     data: sessions.fp3 },
    ].filter(tab => tab.data) // removing unexisting tabs(sprint)

    const currentData = sessions[activeSession]

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <span className={styles.round}>Round {String(round).padStart(2, '0')}</span>
                <span className={styles.raceName}>{raceInfo.raceName}</span>
                <span className={styles.circuit}>
                    {raceInfo.Circuit?.circuitName} · {raceInfo.Circuit?.Location?.country} · {raceInfo.Circuit?.Location?.locality}
                </span>
                <span className={styles.session}>
                    {tabs.find(t => t.key === activeSession)?.label}
                </span>
                <span className={styles.date}>{formatDate(currentData?.date)}</span>
            </div>

            <div className={styles.content}>
                <div className={styles.btnHub}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`${styles.btn} ${activeSession === tab.key ? styles.tabActive : ''}`}
                            onClick={() => setActiveSession(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={styles.results}>
                    <ResultsTable session={activeSession} data={currentData} />
                </div>
            </div>
        </div>
    )
}

function ResultsTable({ session, data }) {
    if (!data) return <p className={styles.error}>No data</p>

    if (session === 'quali') {
        const results = data.QualifyingResults || []
        return (
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>POS</th><th>DRIVER</th><th>TEAM</th><th>Q1</th><th>Q2</th><th>Q3</th>
                </tr>
                </thead>
                <tbody>
                {results.map(r => (
                    <tr key={r.position}>
                        <td className={styles.pos}>{r.position}</td>
                        <td className={styles.driver}>
                            <span className={styles.driverCode}>{r.Driver.code}</span>
                            <span className={styles.driverName}>{r.Driver.familyName}</span>
                        </td>
                        <td className={styles.team}>{r.Constructor.name}</td>
                        <td className={styles.time}>{r.Q1 || '—'}</td>
                        <td className={styles.time}>{r.Q2 || '—'}</td>
                        <td className={styles.time}>{r.Q3 || '—'}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }

    const results = data.Results || data.SprintResults || data.PracticeResults || []
    return (
        <table className={styles.table}>
            <thead>
            <tr>
                <th>POS</th><th>DRIVER</th><th>TEAM</th><th>TIME</th><th>PTS</th>
            </tr>
            </thead>
            <tbody>
            {results.map(r => (
                <tr key={r.position} className={getMedalStyle(r.position)}>
                    <td className={styles.pos}>{r.position}</td>
                    <td className={styles.driver}>
                        <span className={styles.driverCode}>{r.Driver.code}</span>
                        <span className={styles.driverName}>{r.Driver.familyName}</span>
                    </td>
                    <td className={styles.team}>{r.Constructor.name}</td>
                    <td className={styles.time}>
                        {r.Time?.time || r.status || '—'}
                    </td>
                    <td className={styles.pts}>{r.points || '—'}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

export default Race;