import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const BUREAUS = ['RB', 'PGRC', 'OTHER'];
const STATUSES = ['New', 'Under review', 'Pending action', 'Awaiting other Bureau', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function Complaints() {
  const [filters, setFilters] = useState({ search: '', bureau: '', status: '', priority: '' });
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    api(`/api/complaints?${params.toString()}`)
      .then((data) => {
        setComplaints(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [filters]);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const select = (key, label, options) => (
    <select value={filters[key]} onChange={set(key)}>
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  return (
    <div>
      <h1>Complaint register</h1>

      <div className="filters">
        <input placeholder="Search case ID or text" value={filters.search} onChange={set('search')} />
        {select('bureau', 'All Bureaus', BUREAUS)}
        {select('status', 'All statuses', STATUSES)}
        {select('priority', 'All priorities', PRIORITIES)}
        <button onClick={() => setFilters({ search: '', bureau: '', status: '', priority: '' })}>Clear</button>
      </div>

      {error && <p className="error">Could not load data: {error}</p>}

      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Institution</th>
            <th>Category</th>
            <th>Bureau</th>
            <th>Assigned to</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Overdue</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.caseId}>
              <td>{c.caseId}</td>
              <td>
                <Link to={`/institutions/${c.institutionId}`}>{c.institutionId}</Link>
              </td>
              <td>{c.category}</td>
              <td>{c.bureau}</td>
              <td>{c.assignedTo}</td>
              <td>{c.status}</td>
              <td>{c.priority}</td>
              <td>{c.isOverdue ? 'Yes' : '-'}</td>
            </tr>
          ))}
          {complaints.length === 0 && (
            <tr>
              <td colSpan="8">No cases match these filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}