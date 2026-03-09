import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '60vh', gap: '16px',
            fontFamily: "'JetBrains Mono', monospace", textAlign: 'center',
            padding: '40px',
        }}>
            <span style={{ fontSize: '80px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '4px' }}>404</span>
            <span style={{ fontSize: '18px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Page not found
            </span>
            <Link to="/" style={{
                marginTop: '16px', color: '#e10600', fontSize: '13px',
                letterSpacing: '2px', textTransform: 'uppercase',
                textDecoration: 'none', border: '1px solid #e10600',
                padding: '8px 20px', borderRadius: '4px',
            }}>
                ← Back to Calendar
            </Link>
        </div>
    );
}

export default NotFound;