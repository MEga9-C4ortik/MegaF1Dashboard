import './App.css'
import {BrowserRouter,Route, Routes} from "react-router-dom";

import Navbar from './components/shared/Navbar'
import Calendar from './pages/Calendar'
import Race from './pages/Race'
import Standings from './pages/Standings'
import Live from './pages/Live'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Calendar />} />
        <Route path="/race/:raceId" element={<Race />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/live" element={<Live />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;