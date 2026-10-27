import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

function Card({ label, value, tone }) {
  return (
    <div className={`card ${tone || ''}`}>
      <div className="card-value">{value}</div>
      <div className="card-label">{label}</div>
    </div>
  );
}

export default function Institution() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api(`/api/institutions/${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">Could not load data: {error}</p>;
  if (!data) return <p>Loading...</p>;

  const { institution, summary, coordinationAlert, complaints } = data;

  return (
    <div>
      <p><Link to="/institutions">← All institutions</Link></p>
      <h1>{institution.name}</h1>
      <p className="muted">
        {institution.institutionId} • {institution.city}, {institution.state} • Synthetic data
      </p>

      {coordinationAlert.active && (
        <div className="alert">
          <strong>Cross-Bureau Coordination Alert</strong>
          <p>{coordinationAlert.message}</p>
          <p className="muted">
            This is a prompt for review. It does not mean any of these cases are duplicates or that
            the institution has done anything wrong.
          </p>
        </div>
      )}

      <div className="cards">
        <Card label="Total cases" value={summary.totalCases} />
        <Card label="Open cases" value={summary.openCases} />
        <Card label="Overdue cases" value={summary.overdueCases} tone="danger" />
        <Card label="Active Bureaus" value={summary.activeBureaus.join(', ') || '-'} tone="warn" />
      </div>

      <h2>Linked complaints</h2>
      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Bureau</th>
            <th>Category</th>
            <th>Assigned to</th>
            <th>Status</th>
            <th>Overdue</th>
            <th>Last updated</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.caseId}>
              <td><Link to={`/cases/${c.caseId}`}>{c.caseId}</Link></td>
              <td>{c.bureau}</td>
              <td>{c.category}</td>
              <td>{c.assignedTo}</td>
              <td>{c.status}</td>
              <td>{c.isOverdue ? 'Yes' : '-'}</td>
              <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}