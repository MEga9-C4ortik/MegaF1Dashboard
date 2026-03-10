import styles from './FiaMessages.module.css'

const flagConfig = {
    'GREEN':       { color: '#39b54a', icon: '🟢', label: 'GREEN' },
    'YELLOW':      { color: '#ffc800', icon: '🟡', label: 'YELLOW' },
    'DOUBLE YELLOW': { color: '#ffc800', icon: '🟡🟡', label: 'DBL YELLOW' },
    'RED':         { color: '#e10600', icon: '🔴', label: 'RED' },
    'BLUE':        { color: '#0067ff', icon: '🔵', label: 'BLUE' },
    'CHEQUERED':   { color: '#ffffff', icon: '🏁', label: 'FINISH' },
    'SAFETY CAR':  { color: '#ffc800', icon: '🚗', label: 'SC' },
    'VIRTUAL SAFETY CAR': { color: '#ffc800', icon: '🚗', label: 'VSC' },
};

const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function FIAMessages({ messages }) {
    if (!messages || messages.length === 0)
        return <p className={styles.empty}>No messages</p>;

    const sorted = [...messages]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Race Control</h3>
            <div className={styles.list}>
                {sorted.map((msg) => {
                    const config = flagConfig[msg.flag] ??
                        { color: '#555', icon: '📋', label: msg.flag };

                    return (
                        <div key={`${msg.date}_${msg.flag ?? 'msg'}`} className={styles.message} style={{ borderLeftColor: config.color }}>
                            <div className={styles.messageTop}>
                                <span className={styles.flag} style={{ color: config.color }}>
                                    {config.label}
                                </span>
                                <span className={styles.time}>{formatTime(msg.date)}</span>
                            </div>
                            <span className={styles.text}>{msg.message}</span>
                            {msg.driver_number && (
                                <span className={styles.driver}>Driver #{msg.driver_number}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FIAMessages;