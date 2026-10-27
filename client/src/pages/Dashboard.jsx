import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function Card({ label, value, tone }) {
  return (
    <div className={`card ${tone || ''}`}>
      <div className="card-value">{value}</div>
      <div className="card-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/api/dashboard'), api('/api/complaints')])
      .then(([s, c]) => {
        setSummary(s);
        setComplaints(c);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">Could not load data: {error}</p>;
  if (!summary) return <p>Loading...</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">Prototype • Synthetic data</p>

      <div className="cards">
        <Card label="Total cases" value={summary.totalCases} />
        <Card label="Open cases" value={summary.openCases} />
        <Card label="Related-case groups" value={summary.relatedCaseGroups} tone="warn" />
        <Card label="Overdue cases" value={summary.overdueCases} tone="danger" />
      </div>

      <h2>Recent complaints</h2>
      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Institution</th>
            <th>Bureau</th>
            <th>Status</th>
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
              <td>{c.bureau}</td>
              <td>{c.status}</td>
              <td>{c.isOverdue ? 'Yes' : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}