import React from 'react';
import SubordinateDashboard from './SubordinateDashboard';
import { Plus, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskContext } from '../context/TaskContext';

const SubInchargeDashboard = () => {
  const navigate = useNavigate();
  const { tasks, currentUser } = useTaskContext();

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const partialCount = tasks.filter(t => t.status === 'partially_done').length;
  const resolvedCount = tasks.filter(t => t.status === 'fully_completed' || t.status === 'resolved').length;
  const totalCount = tasks.length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Sub-Incharge Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {currentUser?.has_powers !== false 
              ? "Manage your team's tasks and assign new ones." 
              : "View and update tasks assigned to you."}
          </p>
        </div>
        {currentUser?.has_powers !== false && (
          <button className="btn btn-primary" onClick={() => navigate('/task/new')}>
            <Plus size={20} /> Assign New Task
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon primary"><FileText size={24} /></div>
          <div className="stat-info"><h3>Total Tasks</h3><p>{totalCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><Clock size={24} /></div>
          <div className="stat-info"><h3>Pending</h3><p>{pendingCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary" style={{ background: 'var(--secondary)', color: 'white' }}><AlertCircle size={24} /></div>
          <div className="stat-info"><h3>Partially Done</h3><p>{partialCount}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircle size={24} /></div>
          <div className="stat-info"><h3>Resolved</h3><p>{resolvedCount}</p></div>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>Task Board</h2>
        <SubordinateDashboard hideHeader={true} />
      </div>
    </div>
  );
};

export default SubInchargeDashboard;
