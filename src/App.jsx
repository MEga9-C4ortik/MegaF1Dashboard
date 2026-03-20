import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/shared/Navbar'
import Calendar from './pages/Calendar'
import Race from './pages/Race'
import Standings from './pages/Standings'
import PitWall from './pages/PitWall'
import NotFound from './pages/NotFound'

function App() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    return (
        <BrowserRouter>
            <Navbar year={year} setYear={setYear} />
            <Routes>
                <Route path="/" element={<Calendar year={year} />} />
                <Route path="/standings" element={<Standings year={year} />} />
                <Route path="/race/:raceId" element={<Race year={year} />} />
                <Route path="/pitwall" element={<PitWall year={year} />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;