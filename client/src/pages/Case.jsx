import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

const STATUSES = ['New', 'Under review', 'Pending action', 'Awaiting other Bureau', 'Closed'];
const BUREAUS = ['RB', 'PGRC', 'OTHER'];

export default function Case() {
  const { caseId } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [related, setRelated] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ status: '', bureau: '', assignedTo: '', reason: '' });

  const load = useCallback(() => {
    return Promise.all([
      api(`/api/complaints/${caseId}`),
      api(`/api/complaints/${caseId}/related`),
      api(`/api/complaints/${caseId}/audit`),
    ])
      .then(([c, r, a]) => {
        setComplaint(c);
        setRelated(r);
        setAudit(a);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [caseId]);

  useEffect(() => {
    setComplaint(null);
    setMessage('');
    load();
  }, [load]);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submitUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    const body = { reason: form.reason };
    if (form.status) body.status = form.status;
    if (form.bureau) body.bureau = form.bureau;
    if (form.assignedTo.trim()) body.assignedTo = form.assignedTo.trim();
    try {
      await api(`/api/complaints/${caseId}/status`, { method: 'PATCH', body: JSON.stringify(body) });
      setForm({ status: '', bureau: '', assignedTo: '', reason: '' });
      setMessage('Update recorded.');
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const decide = async (relatedCaseId, decision) => {
    const reason = window.prompt(`Reason for marking ${relatedCaseId} as ${decision}:`);
    if (!reason || !reason.trim()) return; // cancelled or empty
    try {
      await api(`/api/complaints/${caseId}/links`, {
        method: 'POST',
        body: JSON.stringify({ relatedCaseId, decision, reason }),
      });
      setMessage(`Link ${decision.toLowerCase()}.`);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  if (error) return <p className="error">Could not load data: {error}</p>;
  if (!complaint) return <p>Loading...</p>;

  return (
    <div>
      <p><Link to={`/institutions/${complaint.institutionId}`}>← {complaint.institutionId}</Link></p>
      <h1>{complaint.caseId}</h1>
      <p className="muted">{complaint.category} • Synthetic data</p>

      <div className="detail">
        <div><strong>Bureau:</strong> {complaint.bureau}</div>
        <div><strong>Assigned to:</strong> {complaint.assignedTo}</div>
        <div><strong>Status:</strong> {complaint.status}</div>
        <div><strong>Priority:</strong> {complaint.priority}</div>
        <div>
          <strong>Due:</strong> {complaint.dueDate ? new Date(complaint.dueDate).toLocaleDateString() : '-'}
          {complaint.isOverdue && <span className="badge danger">Overdue</span>}
        </div>
        <div><strong>Last updated:</strong> {new Date(complaint.updatedAt).toLocaleString()}</div>
        <div className="full"><strong>Description:</strong> {complaint.description}</div>
      </div>

      {message && <p className="message">{message}</p>}

      <h2>Suggested related cases</h2>
      <p className="muted">Suggestions only. An officer decides whether cases are really related.</p>
      <table>
        <thead>
          <tr>
            <th>Case</th>
            <th>Bureau</th>
            <th>Confidence</th>
            <th>Why it was suggested</th>
            <th>Review</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {related.map((r) => (
            <tr key={r.caseId}>
              <td><Link to={`/cases/${r.caseId}`}>{r.caseId}</Link></td>
              <td>{r.bureau}</td>
              <td><span className={`badge ${r.confidence.toLowerCase()}`}>{r.confidence}</span></td>
              <td>
                <ul className="reasons">
                  {r.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </td>
              <td>{r.reviewStatus}</td>
              <td className="actions">
                <button onClick={() => decide(r.caseId, 'Confirmed')}>Confirm</button>
                <button onClick={() => decide(r.caseId, 'Rejected')}>Reject</button>
              </td>
            </tr>
          ))}
          {related.length === 0 && (
            <tr><td colSpan="6">No other cases at this institution.</td></tr>
          )}
        </tbody>
      </table>

      <h2>Update status or hand off</h2>
      <form className="update-form" onSubmit={submitUpdate}>
        <select value={form.status} onChange={setField('status')}>
          <option value="">Status (no change)</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.bureau} onChange={setField('bureau')}>
          <option value="">Bureau (no change)</option>
          {BUREAUS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <input placeholder="Assign to (optional)" value={form.assignedTo} onChange={setField('assignedTo')} />
        <input
          className="wide"
          placeholder="Reason (required)"
          value={form.reason}
          onChange={setField('reason')}
        />
        <button type="submit">Save update</button>
      </form>

      <h2>Timeline</h2>
      <ul className="timeline">
  {audit.map((a) => (
    <li key={a._id}>
      <div className="when">{new Date(a.createdAt).toLocaleString()}</div>
      <div className="what">
        {a.action.replaceAll('_', ' ')}
        {(a.from || a.to) && (
          <span className="change">
            {a.from ? `${a.from} → ${a.to}` : a.to}
          </span>
        )}
      </div>
      <div className="meta">Reason: {a.reason} • By: {a.actor}</div>
    </li>
  ))}
    </ul>
    </div>
  );
}