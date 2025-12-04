import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdvisorsAPI from '../../api/advisors';
import { Calendar, CheckSquare, Plus, User, Clock, Video, ExternalLink } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Fixes localhost relative linking issue.
const ensureAbsoluteUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

export default function AdvisorPortal() {
  const { engagementId } = useParams();
  const [data, setData] = useState(null);
  const [newTask, setNewTask] = useState("");
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionLink, setNewSessionLink] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [engagementId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await AdvisorsAPI.getPortal(engagementId);
      setData(res.data || res);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask) return;
    await AdvisorsAPI.addTask(engagementId, {
      id: `task_${Date.now()}`,
      title: newTask,
      assigned_by: data.coach_name,
      impact_tag: "General"
    });
    setNewTask("");
    loadData();
    alert("Task assigned to candidate");
  };

  const handleAddSession = async () => {
    if (!newSessionDate) return;
    await AdvisorsAPI.addSession(engagementId, {
      id: `sess_${Date.now()}`,
      coach_email: data.coach_email,
      date: new Date(newSessionDate).toISOString(),
      meeting_link: newSessionLink,
      status: "scheduled"
    });
    setNewSessionDate("");
    setNewSessionLink("");
    loadData();
    alert("Session scheduled");
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 d-flex flex-column align-items-center justify-content-center">
        <div className="spinner-border text-light mb-3" role="status" />
        <h3 className="text-white">Loading Portal...</h3>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (!data) {
    return (
      <div className="dashboard-gradient min-vh-100 d-flex flex-column align-items-center justify-content-center p-4">
        <div className="bg-white p-5 rounded-4 shadow-lg text-center" style={{ maxWidth: "500px" }}>
            <h2 className="text-danger fw-bold">Portal Not Found</h2>
            <p className="text-muted">This engagement link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-gradient min-vh-100 py-5">
      <div className="container" style={{ maxWidth: "900px" }}>
        
        {/* HEADER SECTION */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-pill px-3 py-1 mb-3 text-white backdrop-blur">
            <User size={16} className="me-2" />
            <small>Advisor Portal</small>
          </div>
          <h1 className="text-white fw-bold display-5 mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
            Welcome, {data.coach_name}
          </h1>
          <p className="text-white-50 fs-5">
            Managing career growth for candidate (ID: {engagementId.slice(-4)})
          </p>
        </div>

        {/* ACTION CARDS */}
        <div className="row g-4 mb-5">
            {/* Add Task Card */}
            <div className="col-md-6">
                <div className="card border-0 shadow-lg rounded-4 h-100">
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                                <CheckSquare className="text-primary" size={20}/> 
                            </div>
                            <h4 className="fw-bold m-0">Assign Task</h4>
                        </div>
                        <p className="text-muted small mb-3">Create an action item for your candidate.</p>
                        <input 
                            className="form-control form-control-lg bg-light border-0 mb-3" 
                            placeholder="e.g. Update Resume Summary" 
                            value={newTask} 
                            onChange={e=>setNewTask(e.target.value)} 
                        />
                        <button onClick={handleAddTask} className="btn btn-primary w-100 fw-bold py-2">
                            Assign Task
                        </button>
                    </div>
                </div>
            </div>

            {/* Schedule Session Card */}
            <div className="col-md-6">
                <div className="card border-0 shadow-lg rounded-4 h-100">
                    <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-success bg-opacity-10 p-2 rounded-circle me-2">
                                <Calendar className="text-success" size={20}/> 
                            </div>
                            <h4 className="fw-bold m-0">Schedule Session</h4>
                        </div>
                        <p className="text-muted small mb-3">Set up your next coaching call.</p>
                        <input 
                            type="datetime-local" 
                            className="form-control form-control-lg bg-light border-0 mb-2" 
                            value={newSessionDate} 
                            onChange={e=>setNewSessionDate(e.target.value)} 
                        />
                        <input 
                            className="form-control form-control-lg bg-light border-0 mb-3" 
                            placeholder="Zoom/Meet Link (e.g. zoom.us/j/123)" 
                            value={newSessionLink} 
                            onChange={e=>setNewSessionLink(e.target.value)} 
                        />
                        <button onClick={handleAddSession} className="btn btn-success w-100 fw-bold py-2">
                            Schedule Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        {/* HISTORY SECTION */}
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
             <div className="card-header bg-white border-bottom py-3 px-4">
                <h5 className="mb-0 fw-bold text-secondary">Active Plan & History</h5>
             </div>
             <div className="card-body p-0">
                <ul className="list-group list-group-flush">
                    {data.tasks.map(t => (
                        <li key={t.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                <div className={`p-2 rounded-circle ${t.status === 'completed' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                    <CheckSquare size={18} />
                                </div>
                                <div>
                                    <span className={`fw-medium ${t.status === 'completed' ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                                        {t.title}
                                    </span>
                                    <div className="small text-muted">Task</div>
                                </div>
                            </div>
                            <span className={`badge ${t.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>{t.status}</span>
                        </li>
                    ))}
                    {data.sessions.map(s => (
                        <li key={s.id} className="list-group-item p-3 d-flex justify-content-between align-items-center bg-light bg-opacity-50">
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <span className="fw-bold text-dark">
                                        Session: {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    {s.meeting_link && (
                                        <div className="mt-1">
                                            <a 
                                                href={ensureAbsoluteUrl(s.meeting_link)} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-primary small text-decoration-none d-flex align-items-center gap-1"
                                            >
                                                <Video size={12} /> Join Meeting <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`badge ${s.status === 'completed' ? 'bg-secondary' : 'bg-success'}`}>{s.status}</span>
                        </li>
                    ))}
                    {data.tasks.length === 0 && data.sessions.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <p>No active tasks or sessions.</p>
                        </div>
                    )}
                </ul>
             </div>
        </div>

        {/* FOOTER */}
        <div className="text-center mt-5 text-white-50">
          <small>Powered by Metamorphosis Job Tracker</small>
        </div>
      </div>
    </div>
  );
}