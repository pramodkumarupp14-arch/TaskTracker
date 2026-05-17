import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Minus } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { format, addDays } from 'date-fns';
import SpeechTextarea from '../components/SpeechTextarea';

const TaskEntry = () => {
  const { addTask, users, config, currentUser } = useTaskContext();
  const navigate = useNavigate();

  // Only assign to active subordinates/sub-incharges
  const subordinates = users.filter(
    u => (u.role === 'subordinate' || u.role === 'sub_incharge') && u.enabled !== false
  );

  const defaultDateStr = format(new Date(), "yyyy-MM-dd'T'10:00");

  const [formData, setFormData] = useState({
    sourceDept: '',
    letterNo: '',
    letterDate: format(new Date(), "yyyy-MM-dd"),
    receivedDateTime: defaultDateStr,
    briefSubject: '',
    assignedBySenior: '',
    priority: '',
    instructions: '',
    assignedTo: [],
    assignmentDateTime: defaultDateStr,
    tentativeCompletionTime: format(addDays(new Date(), 7), "yyyy-MM-dd'T'17:00"),
    inchargeRemarks: ''
  });

  // Dynamic default values once config is fetched
  useEffect(() => {
    if (config.officers && config.officers.length > 0 && !formData.assignedBySenior) {
      setFormData(prev => ({ ...prev, assignedBySenior: config.officers[0] }));
    }
    if (config.priorities && config.priorities.length > 0 && !formData.priority) {
      const defaultPriority = config.priorities.includes('Medium') ? 'Medium' : config.priorities[0];
      setFormData(prev => ({ ...prev, priority: defaultPriority }));
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e, username) => {
    if (e.target.checked) {
      setFormData(prev => ({ ...prev, assignedTo: [...prev.assignedTo, username] }));
    } else {
      setFormData(prev => ({ ...prev, assignedTo: prev.assignedTo.filter(name => name !== username) }));
    }
  };

  const adjustDate = (field, days) => {
    setFormData(prev => {
      const current = prev[field] ? new Date(prev[field]) : new Date();
      return { ...prev, [field]: format(addDays(current, days), "yyyy-MM-dd'T'HH:mm") };
    });
  };

  const DateControls = ({ field }) => (
    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
      <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => adjustDate(field, -1)}>
        <Minus size={12} /> 1 Day
      </button>
      <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => adjustDate(field, 1)}>
        <Plus size={12} /> 1 Day
      </button>
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.assignedTo.length === 0) {
      alert("Please assign to at least one subordinate.");
      return;
    }
    
    const formattedData = {
      ...formData,
      letterDate: formData.letterDate ? format(new Date(formData.letterDate), 'dd/MM/yyyy') : '',
      receivedDateTime: formData.receivedDateTime ? format(new Date(formData.receivedDateTime), 'dd/MM/yyyy HH:mm') : '',
      assignmentDateTime: formData.assignmentDateTime ? format(new Date(formData.assignmentDateTime), 'dd/MM/yyyy HH:mm') : '',
      tentativeCompletionTime: formData.tentativeCompletionTime ? format(new Date(formData.tentativeCompletionTime), 'dd/MM/yyyy HH:mm') : ''
    };

    addTask(formattedData);
    navigate(currentUser.role === 'incharge' ? '/incharge' : '/sub-incharge');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <button 
        className="btn btn-outline" 
        onClick={() => navigate(currentUser.role === 'incharge' ? '/incharge' : '/sub-incharge')}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Assign New Task</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source / Sender Department</label>
              <input 
                type="text" 
                className="form-control" 
                name="sourceDept" 
                value={formData.sourceDept} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Ministry of Home Affairs"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Original Letter No.</label>
              <input 
                type="text" 
                className="form-control" 
                name="letterNo" 
                value={formData.letterNo} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Original Letter Date</label>
              <input 
                type="date" 
                className="form-control" 
                name="letterDate" 
                value={formData.letterDate} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Received Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                name="receivedDateTime" 
                value={formData.receivedDateTime} 
                onChange={handleChange} 
                required 
              />
              <DateControls field="receivedDateTime" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Brief Subject</label>
            <SpeechTextarea 
              name="briefSubject"
              rows={2}
              value={formData.briefSubject}
              onChange={handleChange}
              placeholder="e.g. Review cyber cell logs... (Use microphone icon to dictate)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assigned by Senior Officer</label>
              <select className="form-control" name="assignedBySenior" value={formData.assignedBySenior} onChange={handleChange}>
                {(config.officers || []).map(off => (
                  <option key={off} value={off}>{off}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" name="priority" value={formData.priority} onChange={handleChange}>
                {(config.priorities || []).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Instructions Given</label>
            <SpeechTextarea 
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Detailed instructions from the senior officer... (Use microphone icon to dictate)"
            />
          </div>

          <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18}/> Section Assignment
          </h3>

          <div className="form-group">
            <label className="form-label">Assign To Subordinates (Multi-Select)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              {subordinates.map(sub => (
                <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.assignedTo.includes(sub.name)}
                    onChange={(e) => handleCheckboxChange(e, sub.name)}
                  />
                  {sub.name} {sub.role === 'sub_incharge' && '(SI)'}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assignment Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                name="assignmentDateTime" 
                value={formData.assignmentDateTime} 
                onChange={handleChange} 
                required 
              />
              <DateControls field="assignmentDateTime" />
            </div>
            <div className="form-group">
              <label className="form-label">Tentative Completion Time</label>
              <input 
                type="datetime-local" 
                className="form-control" 
                name="tentativeCompletionTime" 
                value={formData.tentativeCompletionTime} 
                onChange={handleChange} 
                required 
              />
              <DateControls field="tentativeCompletionTime" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks by Assigner</label>
            <SpeechTextarea 
              name="inchargeRemarks"
              rows={2}
              value={formData.inchargeRemarks}
              onChange={handleChange}
              placeholder="Any additional remarks for the subordinate... (Use microphone icon to dictate)"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Assign Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEntry;
