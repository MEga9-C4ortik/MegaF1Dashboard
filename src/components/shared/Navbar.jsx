import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import myLogo from '../../assets/myLogo.svg'
import styles from './Navbar.module.css'

function Navbar({ year, setYear }) {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLinkClick = () => setMenuOpen(false);

    const currentYear = new Date().getFullYear();
    const YEARS = Array.from(
        { length: currentYear - 1949 },
        (_, i) => currentYear - i
    );

    return (
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <img className={styles.logo} src={myLogo} alt="Mega F1 Dashboard" />
                <h1 className={styles.header}>Mega F1 Dashboard</h1>
            </div>

            <div className={styles.links}>
                <Link to="/" className={location.pathname === '/' ? styles.linkActive : styles.link}>
                    Calendar
                </Link>
                <Link to="/standings" className={location.pathname === '/standings' ? styles.linkActive : styles.link}>
                    Standings
                </Link>
                <Link to="/live" className={location.pathname === '/live' ? styles.linkActive : styles.link}>
                    Live
                </Link>
            </div>

            <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
                <Link to="/"
                      className={location.pathname === '/' ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={handleLinkClick}>
                    Calendar
                </Link>
                <Link to="/standings"
                      className={location.pathname === '/standings' ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={handleLinkClick}>
                    Standings
                </Link>
                <Link to="/live"
                      className={location.pathname === '/live' ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={handleLinkClick}>
                    Live
                </Link>
            </div>

            <div className={styles.right}>
                {location.pathname !== '/live' && (
                    <select
                        className={styles.yearSelect}
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {YEARS.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                )}

                <button
                    className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;