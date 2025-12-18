import React, { useState, useEffect } from 'react';
import AdvisorsAPI from '../../api/advisors';
import { Calendar, CheckSquare, UserPlus, CreditCard, Video, Copy, ExternalLink, Trash2 } from 'lucide-react';


const ensureAbsoluteUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

export default function CoachingDashboard() {
  const [advisors, setAdvisors] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', rate: '', payment_link: '' });

  useEffect(() => {
    loadAdvisors();
  }, []);

  const loadAdvisors = async () => {
    try {
      const res = await AdvisorsAPI.getMyAdvisors();
      setAdvisors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async () => {
    await AdvisorsAPI.inviteAdvisor(inviteForm);
    setShowInvite(false);
    setInviteForm({ name: '', email: '', rate: '', payment_link: '' });
    loadAdvisors();
    alert("Advisor invited successfully!");
  };

  const toggleTask = async (engId, taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await AdvisorsAPI.updateTaskStatus(engId, taskId, newStatus);
    loadAdvisors();
  };
  
  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to remove this advisor? History will be lost.")) return;
    try {
      await AdvisorsAPI.deleteAdvisor(id);
      loadAdvisors(); 
    } catch (err) {
      alert("Failed to remove advisor");
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f8f9fa" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>🚀 Professional Coaching</h2>
          <p className="text-muted small m-0">Manage your external career advisors and action plans.</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="btn btn-primary d-flex align-items-center gap-2">
          <UserPlus size={18} /> Connect Coach
        </button>
      </div>

      {showInvite && (
        <div className="card p-4 mb-4 shadow-sm border-0">
          <h4 className="mb-3">Invite a Career Coach</h4>
          <div className="row g-3">
            <div className="col-md-6"><input className="form-control" placeholder="Coach Name" aria-label="Coach Name" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Coach Email" aria-label="Coach Email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Hourly Rate (Optional)" aria-label="Hourly Rate (Optional)" value={inviteForm.rate} onChange={e => setInviteForm({...inviteForm, rate: e.target.value})} /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Payment Link (Stripe/PayPal)" aria-label="Payment Link (Stripe/PayPal)" value={inviteForm.payment_link} onChange={e => setInviteForm({...inviteForm, payment_link: e.target.value})} /></div>
            <div className="col-12"><button onClick={handleInvite} aria-label="Send Invitation" className="btn btn-success">Send Invitation</button></div>
          </div>
        </div>
      )}

      {advisors.map(adv => (
        <div key={adv._id} className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-header bg-white p-4 border-bottom">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h3 className="fw-bold mb-1">{adv.coach_name}</h3>
                <div className="d-flex align-items-center gap-2 text-muted">
                   <span>{adv.coach_email}</span>
                   {adv.hourly_rate && <span className="badge bg-light text-dark border">${adv.hourly_rate}/hr</span>}
                </div>
              </div>
              <div className="text-end">
                {adv.payment_link && (
                  <a href={ensureAbsoluteUrl(adv.payment_link)} target="_blank" rel="noreferrer" className="btn btn-outline-success btn-sm d-flex align-items-center gap-2 mb-2">
                    <CreditCard size={16} /> Pay Invoice
                  </a>
                )}
                <div className="d-flex gap-2">
                   <button 
                      className="btn btn-sm btn-light border d-flex align-items-center gap-2"
                      onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/advisor-portal/${adv._id}`);
                          alert("Portal Link Copied!");
                      }}
                   >
                      <Copy size={14} /> Copy Portal Link
                   </button>
                   <button 
                      className="btn btn-sm btn-light border d-flex align-items-center gap-2"
                      onClick={() => window.open(`/advisor-portal/${adv._id}`, '_blank')}
                   >
                      <ExternalLink size={14} /> Open Portal
                   </button>
                   <button 
                      className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2"
                      onClick={() => handleRemove(adv._id)}
                      title="Remove Advisor"
                   >
                      <Trash2 size={14} />
                   </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="row g-0">
              <div className="col-md-6 p-4 border-end">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary">
                  <CheckSquare size={20} /> Action Plan
                </h5>
                {adv.tasks.length === 0 ? <p className="text-muted small">No tasks assigned yet.</p> : (
                  <ul className="list-group list-group-flush">
                    {adv.tasks.map(task => (
                      <li key={task.id} className="list-group-item border-0 px-0 py-2 d-flex align-items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'completed'} 
                          onChange={() => toggleTask(adv._id, task.id, task.status)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <span style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? '#999' : '#333' }}>
                            {task.title}
                          </span>
                          {task.impact_tag && <span className="badge bg-light text-secondary ms-2 small">{task.impact_tag}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="col-md-6 p-4 bg-light">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary">
                  <Calendar size={20} /> Sessions
                </h5>
                {adv.sessions.length === 0 ? <p className="text-muted small">No sessions scheduled.</p> : (
                  <div className="d-flex flex-column gap-3">
                    {adv.sessions.map(session => (
                      <div key={session.id} className="bg-white p-3 rounded-3 shadow-sm border">
                        <div className="d-flex justify-content-between mb-2">
                          <strong>{new Date(session.date).toLocaleDateString()}</strong>
                          <span className={`badge ${session.status === 'completed' ? 'bg-secondary' : 'bg-success'}`}>
                            {session.status}
                          </span>
                        </div>
                        {session.meeting_link && (
                          <a href={ensureAbsoluteUrl(session.meeting_link)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2">
                            <Video size={14} /> Join Meeting
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}