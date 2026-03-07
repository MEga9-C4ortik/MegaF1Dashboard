import { useState } from 'react'
import styles from './RadioMessages.module.css'

const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function RadioMessages({ messages, drivers }) {
    if (!messages || messages.length === 0)
        return <p className={styles.empty}>Radio Silence</p>;

    const driversMap = {};
    drivers?.forEach(d => { driversMap[d.driver_number] = d });

    const sorted = [...messages]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Team Radio</h3>
            <div className={styles.list}>
                {sorted.map((msg, i) => {
                    const driver = driversMap[msg.driver_number];
                    const teamColor = driver?.team_colour ? `#${driver.team_colour}` : '#666'

                    return (
                        <div key={i} className={styles.message} style={{ borderLeftColor: teamColor }}>
                            <div className={styles.messageTop}>
                                <span className={styles.driver} style={{ color: teamColor }}>
                                    {driver?.name_acronym ?? `#${msg.driver_number}`}
                                </span>
                                <span className={styles.time}>{formatTime(msg.date)}</span>
                            </div>

                            <div className={styles.player}>
                                <audio
                                    src={msg.recording_url}
                                    controls
                                    className={styles.audio}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default RadioMessages;