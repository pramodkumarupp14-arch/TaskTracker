import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import SpeechTextarea from '../components/SpeechTextarea';
import TaskBoard from '../components/TaskBoard';

const SubordinateDashboard = ({ hideHeader }) => {
  const { tasks, users, currentUser, updateSubordinateStatus, forwardTask, refreshData } = useTaskContext();
  
  useEffect(() => {
    refreshData();
  }, []);
  const [selectedTask, setSelectedTask] = useState(null);
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  
  const [forwardModalTask, setForwardModalTask] = useState(null);
  const [forwardAssignees, setForwardAssignees] = useState([]);

  // Dashboard board visibility: see all tasks if they have assign or forward permissions.
  // Otherwise, if all powers are revoked, see only directly assigned tasks.
  const isSupervisory = currentUser?.role === 'incharge' || (
    currentUser?.role === 'sub_incharge' && 
    (currentUser?.power_assign_tasks !== false || currentUser?.power_forward_tasks !== false)
  );

  const myTasks = isSupervisory 
    ? tasks 
    : tasks.filter(t => t.assignedTo && t.assignedTo.includes(currentUser?.name));

  // Determine forwarding permission
  const allowForwarding = currentUser?.role === 'incharge' || (
    currentUser?.role === 'sub_incharge' && 
    currentUser?.power_forward_tasks !== false
  );

  // Only allow forwarding to active subordinates
  const subordinates = users.filter(u => u.role === 'subordinate' && u.enabled !== false);

  const handleStatusUpdate = (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    updateSubordinateStatus(selectedTask.id, currentUser.name, status, reason);
    setSelectedTask(null);
    setStatus('');
    setReason('');
  };

  const handleForwardSubmit = (e) => {
    e.preventDefault();
    if (!forwardModalTask || forwardAssignees.length === 0) return;
    forwardTask(forwardModalTask.id, forwardAssignees);
    setForwardModalTask(null);
    setForwardAssignees([]);
  };

  const openActionModal = (task) => {
    setSelectedTask(task);
    const currentSubStatus = task.subordinateStatuses?.[currentUser.name];
    setStatus(currentSubStatus?.status || 'pending');
    setReason(currentSubStatus?.reason || '');
  };

  const openForwardModal = (task) => {
    setForwardModalTask(task);
    setForwardAssignees([]);
  };

  const toggleForwardAssignee = (username) => {
    if (forwardAssignees.includes(username)) {
      setForwardAssignees(prev => prev.filter(n => n !== username));
    } else {
      setForwardAssignees(prev => [...prev, username]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {!isSupervisory && !hideHeader && (
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>My Tasks</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and update your assigned tasks.</p>
        </div>
      )}

      <TaskBoard 
        tasks={myTasks}
        currentUser={currentUser}
        isSupervisory={isSupervisory}
        onUpdateSubordinateStatus={openActionModal}
        onForward={allowForwarding ? openForwardModal : undefined}
      />

      {/* Update Status Modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h2 className="card-title">Update Your Status</h2>
              <button type="button" onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-control" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="completed_his_part">Completed My Part</option>
                  <option value="action_req_by_other">Action Req by Other Assigned</option>
                  <option value="fully_completed">Fully Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Remarks / Action Taken</label>
                <SpeechTextarea 
                  name="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide details about your update... (Use mic icon to dictate)"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forward Task Modal */}
      {forwardModalTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h2 className="card-title">Forward Task</h2>
              <button type="button" onClick={() => setForwardModalTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <form onSubmit={handleForwardSubmit}>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Select active subordinates to forward this task to.</p>
              <div className="form-group">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', maxHeight: '200px', overflowY: 'auto' }}>
                  {subordinates.map(sub => {
                    const alreadyAssigned = forwardModalTask.assignedTo && forwardModalTask.assignedTo.includes(sub.name);
                    return (
                      <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: alreadyAssigned ? 'not-allowed' : 'pointer', opacity: alreadyAssigned ? 0.5 : 1 }}>
                        <input 
                          type="checkbox" 
                          checked={alreadyAssigned || forwardAssignees.includes(sub.name)}
                          onChange={() => toggleForwardAssignee(sub.name)}
                          disabled={alreadyAssigned}
                        />
                        {sub.name} {alreadyAssigned && '(Already assigned)'}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setForwardModalTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Forward Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubordinateDashboard;
