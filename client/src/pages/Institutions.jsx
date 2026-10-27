import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Institutions() {
  const [search, setSearch] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/institutions?search=${encodeURIComponent(search)}`)
      .then((data) => {
        setInstitutions(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [search]);

  return (
    <div>
      <h1>Institutions</h1>
      <div className="filters">
        <input
          placeholder="Search by ID, name or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error">Could not load data: {error}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>City</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {institutions.map((i) => (
            <tr key={i.institutionId}>
              <td><Link to={`/institutions/${i.institutionId}`}>{i.institutionId}</Link></td>
              <td>{i.name}</td>
              <td>{i.city}</td>
              <td>{i.state}</td>
            </tr>
          ))}
          {institutions.length === 0 && (
            <tr><td colSpan="4">No institutions found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}