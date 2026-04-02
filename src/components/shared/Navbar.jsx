import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/myLogo.svg'
import styles from './Navbar.module.css'

function Navbar({ year, setYear, hidden, setHidden }) {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLinkClick = () => setMenuOpen(false);

    const currentYear = new Date().getFullYear();
    const YEARS = Array.from(
        { length: currentYear - 1949 },
        (_, i) => currentYear - i
    );

    if (hidden) return (
        <div className={styles.navbarCollapsed}>
            <button onClick={() => setHidden(false)} className={styles.expandBtn}>▼</button>
        </div>
    );

    return (
        <nav className={styles.navbar}>
            <Link to="/" className={styles.left}>
                <img className={styles.logo} src={logo} alt="Mega F1 Dashboard" />
                <span className={styles.title}>Mega F1 Dashboard</span>
            </Link>

            <div className={styles.links}>
                <Link to="/" className={(location.pathname === '/' || location.pathname === '/calendar') ? styles.linkActive : styles.link}>
                    Calendar
                </Link>
                <Link to="/standings" className={location.pathname === '/standings' ? styles.linkActive : styles.link}>
                    Standings
                </Link>
                <Link to="/pitwall" className={location.pathname === '/pitwall' ? styles.linkActive : styles.link}>
                    Pit Wall
                </Link>
            </div>

            <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
                <Link to="/"
                      className={(location.pathname === '/' || location.pathname === '/calendar')
                          ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={handleLinkClick}>
                    Calendar
                </Link>
                <Link to="/standings"
                      className={location.pathname === '/standings' ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={handleLinkClick}>
                    Standings
                </Link>
                <Link to="/pitwall"
                      className={location.pathname === '/pitwall' ? styles.mobileLinkActive : styles.mobileLink}
                      onClick={handleLinkClick}>
                    Pit Wall
                </Link>
            </div>

            <div className={styles.right}>
                {!location.pathname.startsWith('/race/') && (
                    <select
                        className={styles.yearSelect}
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    >
                        {YEARS.map(y => (
                            <option key={y} value={y}>
                                {y < 2018 ? `${y} ·` : y}
                            </option>
                        ))}
                    </select>
                )}

                <button
                    className={styles.collapseBtn}
                    onClick={() => setHidden(true)}
                    title="Hide navbar"
                >▲</button>

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