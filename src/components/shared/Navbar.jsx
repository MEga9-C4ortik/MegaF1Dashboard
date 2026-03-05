import { Link } from 'react-router-dom'
import myLogo from '../../assets/myLogo.svg'

function Navbar({ year, setYear }) {
    const currentYear = new Date().getFullYear()
    const YEARS = Array.from(
        { length: currentYear - 1949 },
        (_, i) => currentYear - i
    )

    return (
        <nav>
            <img src={myLogo} alt="Mega F1 Dashboard" height="140" />
            <h1> Mega F1 dashboard</h1>

            <div>
                <Link to="/">Calendar</Link>
                <Link to="/standings">Standings</Link>
                <Link to="/live">Live</Link>
            </div>

            <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
            >
                {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </nav>
    )
}

export default Navbar