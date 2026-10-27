import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import Institutions from './pages/Institutions';
import Institution from './pages/Institution';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <strong>Institution Complaint Monitor</strong>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/complaints">Complaints</NavLink>
        <NavLink to="/institutions">Institutions</NavLink>
      </nav>
      <div className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/institutions/:id" element={<Institution />} />
          <Route path="/cases/:caseId" element={<p>Case page coming in Step 19.</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}