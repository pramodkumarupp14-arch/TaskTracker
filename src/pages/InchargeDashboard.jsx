import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, CheckCircle, AlertCircle, FileText, Users, Settings } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import TaskBoard from '../components/TaskBoard';

const InchargeDashboard = () => {
  const { tasks, pushTask, updateGlobalTaskStatus, currentUser, config } = useTaskContext();
  const navigate = useNavigate();
  
  const [selectedTaskStatus, setSelectedTaskStatus] = useState(null);
  const [newGlobalStatus, setNewGlobalStatus] = useState('');

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const partialCount = tasks.filter(t => t.status === 'partially_done').length;
  const resolvedCount = tasks.filter(t => t.status === 'fully_completed' || t.status === 'resolved').length;
  const totalCount = tasks.length;

  const handlePinch = (taskId) => {
    pushTask(taskId, 'Please expedite the completion of this task.');
    alert('Push notification sent to subordinates.');
  };

  const openGlobalStatusModal = (task) => {
    setSelectedTaskStatus(task);
    setNewGlobalStatus(task.status);
  };

  const handleUpdateGlobalStatus = (e) => {
    e.preventDefault();
    if(selectedTaskStatus) {
      updateGlobalTaskStatus(selectedTaskStatus.id, newGlobalStatus);
      setSelectedTaskStatus(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Incharge Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Overview of all assigned tasks and their progress.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/incharge/settings')}>
            <Settings size={20} /> System Settings
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/incharge/users')}>
            <Users size={20} /> Manage Users
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/task/new')}>
            <Plus size={20} /> Assign New Task
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p>{totalCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p>{pendingCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary" style={{ background: 'var(--secondary)', color: 'white' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Partially Done</h3>
            <p>{partialCount}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Resolved</h3>
            <p>{resolvedCount}</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>All Tasks</h2>
      
      <TaskBoard 
        tasks={tasks}
        currentUser={currentUser}
        isSupervisory={true}
        onUpdateGlobalStatus={openGlobalStatusModal}
        onPush={handlePinch}
      />

      {/* Force Global Status Modal */}
      {selectedTaskStatus && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h2 className="card-title">Force Global Status</h2>
              <button onClick={() => setSelectedTaskStatus(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <form onSubmit={handleUpdateGlobalStatus}>
              <div className="form-group">
                <label className="form-label">Global Status for Task {selectedTaskStatus.letterNo}</label>
                <select 
                  className="form-control" 
                  value={newGlobalStatus} 
                  onChange={(e) => setNewGlobalStatus(e.target.value)}
                  required
                >
                  {(config.statuses || ['pending', 'partially_done', 'fully_completed', 'resolved', 'closed']).map(statusKey => (
                    <option key={statusKey} value={statusKey}>{statusKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedTaskStatus(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InchargeDashboard;
