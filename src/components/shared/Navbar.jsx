import { Link, useLocation } from 'react-router-dom'
import myLogo from '../../assets/myLogo.svg'
import styles from './Navbar.module.css'

function Navbar({ year, setYear }) {
    const location = useLocation();
    const currentYear = new Date().getFullYear();
    const YEARS = Array.from(
        { length: currentYear - 1949 },
        (_, i) => currentYear - i
    );

    return (
        <nav className={styles.navbar}>
            <img className={styles.logo} src={myLogo} alt="Mega F1 Dashboard" />
            <h1 className={styles.header}> Mega F1 Dashboard</h1>

            <div className={styles.links}>
                <Link
                    to="/"
                    className={location.pathname === '/' ? styles.linkActive : styles.link}
                >
                    Calendar
                </Link>
                <Link
                    to="/standings"
                    className={location.pathname === '/standings' ? styles.linkActive : styles.link}
                >
                    Standings
                </Link>
                <Link
                    to="/live"
                    className={location.pathname === '/live' ? styles.linkActive : styles.link}
                >
                    Live
                </Link>
            </div>

            <select
                className={styles.yearSelect}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
            >
                {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </nav>
    );
}

export default Navbar;