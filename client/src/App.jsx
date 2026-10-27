import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <strong>Institution Complaint Monitor</strong>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/complaints">Complaints</NavLink>
      </nav>
      <div className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/institutions/:id" element={<p>Institution page coming in Phase 5.</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}