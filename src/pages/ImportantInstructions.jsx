import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, Clock, BookOpen, User, Calendar, FileText, Check } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { format, parseISO } from 'date-fns';

const ImportantInstructions = () => {
  const { 
    instructions, 
    users, 
    currentUser, 
    config, 
    addInstruction, 
    updateInstruction, 
    deleteInstruction, 
    acknowledgeInstruction,
    refreshData 
  } = useTaskContext();
  
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState(null);
  const [formData, setFormData] = useState({
    givenBy: '',
    givenDate: format(new Date(), 'yyyy-MM-dd'),
    details: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  // Dynamically set defaults for the creation modal when officers are available
  useEffect(() => {
    if (config.officers && config.officers.length > 0 && !formData.givenBy) {
      setFormData(prev => ({ ...prev, givenBy: config.officers[0] }));
    }
  }, [config]);

  // Determine authorized managers: Incharge, or Sub-Incharge with delegated power
  const isAuthorized = currentUser?.role === 'incharge' || (
    currentUser?.role === 'sub_incharge' && 
    currentUser?.power_manage_instructions === true
  );

  // Active subordinates and sub-incharges that need to acknowledge
  const targetUsers = users.filter(
    u => (u.role === 'subordinate' || u.role === 'sub_incharge') && u.enabled !== false
  );

  const openAddModal = () => {
    const defaultOfficer = config.officers && config.officers.length > 0 ? config.officers[0] : '';
    setEditingInst(null);
    setFormData({
      givenBy: defaultOfficer,
      givenDate: format(new Date(), 'yyyy-MM-dd'),
      details: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (inst) => {
    setEditingInst(inst);
    setFormData({
      givenBy: inst.given_by,
      givenDate: inst.given_date,
      details: inst.details
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.details.trim()) return;

    if (editingInst) {
      await updateInstruction(editingInst.id, {
        given_by: formData.givenBy,
        given_date: formData.givenDate,
        details: formData.details
      });
    } else {
      await addInstruction(formData.givenBy, formData.givenDate, formData.details);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this important instruction?")) {
      await deleteInstruction(id);
    }
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handles both ISO timestamps and YYYY-MM-DD formats
      const cleanDate = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr);
      return format(cleanDate, 'dd/MM/yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const formatSeenDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return format(parseISO(isoStr), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Back Button */}
      <button 
        className="btn btn-outline" 
        onClick={() => navigate(
          currentUser?.role === 'incharge' ? '/incharge' :
          currentUser?.role === 'sub_incharge' ? '/sub-incharge' : '/subordinate'
        )}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={28} style={{ color: 'var(--primary)' }} /> Important Instructions
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Official instructions issued by Senior Officers. Subordinates must acknowledge receipt.</p>
        </div>
        {isAuthorized && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={20} /> Create Instruction
          </button>
        )}
      </div>

      {/* Instructions list */}
      {instructions.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Important Instructions</h3>
          <p style={{ color: 'var(--text-muted)' }}>No high-priority instructions have been issued yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {instructions.map(inst => {
            const seenByList = Array.isArray(inst.seen_by) ? inst.seen_by : [];
            const hasAcknowledged = seenByList.some(s => s.username === currentUser?.username);
            const canAcknowledge = (currentUser?.role === 'subordinate' || currentUser?.role === 'sub_incharge') && !hasAcknowledged;

            return (
              <div 
                key={inst.id} 
                className="card" 
                style={{ 
                  borderLeft: '5px solid var(--primary)', 
                  position: 'relative',
                  background: 'var(--bg-card)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                
                {/* Top Action Options for Managers */}
                {isAuthorized && (
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} 
                      onClick={() => openEditModal(inst)}
                      title="Edit Instruction"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      className="btn" 
                      style={{ 
                        padding: '0.35rem 0.5rem', 
                        fontSize: '0.75rem', 
                        background: 'var(--danger-light)', 
                        color: 'var(--danger-text)',
                        border: 'none'
                      }} 
                      onClick={() => handleDelete(inst.id)}
                      title="Delete Instruction"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

                {/* Meta details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={16} style={{ color: 'var(--primary)' }} />
                    <span><strong>Given By:</strong> {inst.given_by}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={16} style={{ color: 'var(--primary)' }} />
                    <span><strong>Given Date:</strong> {formatDateStr(inst.given_date)}</span>
                  </div>
                </div>

                {/* Instruction narrative details */}
                <div style={{ 
                  background: 'var(--bg-app)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  marginBottom: '1.5rem',
                  fontSize: '0.975rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {inst.details}
                </div>

                {/* Seen By Acknowledgments Section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle size={16} style={{ color: 'var(--success-text)' }} /> Seen / Acknowledged Status ({seenByList.length}/{targetUsers.length})
                  </h4>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {targetUsers.map(user => {
                      const seenRecord = seenByList.find(s => s.username === user.username);
                      
                      return (
                        <span 
                          key={user.id} 
                          className="badge" 
                          style={{
                            background: seenRecord ? 'var(--success-light)' : 'var(--bg-app)',
                            color: seenRecord ? 'var(--success-text)' : 'var(--text-muted)',
                            border: seenRecord ? '1px solid var(--success)' : '1px solid var(--border)',
                            fontSize: '0.8rem',
                            padding: '0.35rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title={seenRecord ? `Seen at ${formatSeenDate(seenRecord.timestamp)}` : 'Awaiting acknowledgment'}
                        >
                          {seenRecord ? <Check size={12} /> : <Clock size={12} />}
                          {user.name} 
                          {seenRecord && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({formatDateStr(seenRecord.timestamp)})</span>}
                        </span>
                      );
                    })}
                  </div>

                  {/* Acknowledge Button for active Subordinate/Sub-Incharge */}
                  {canAcknowledge && (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => acknowledgeInstruction(inst.id, currentUser.username)}
                    >
                      <Check size={18} /> I Have Read & Acknowledged This Instruction
                    </button>
                  )}

                  {hasAcknowledged && (currentUser?.role === 'subordinate' || currentUser?.role === 'sub_incharge') && (
                    <div style={{ 
                      background: 'var(--success-light)', 
                      color: 'var(--success-text)', 
                      padding: '0.5rem', 
                      borderRadius: 'var(--radius)', 
                      textAlign: 'center', 
                      fontSize: '0.875rem', 
                      fontWeight: 600 
                    }}>
                      ✓ You acknowledged this instruction.
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal - Create/Edit Instruction */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header">
              <h2 className="card-title">
                {editingInst ? 'Edit Important Instruction' : 'Create Important Instruction'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Instruction Given By (Senior Officer)</label>
                <select 
                  className="form-control" 
                  value={formData.givenBy} 
                  onChange={(e) => setFormData({...formData, givenBy: e.target.value})}
                  required
                >
                  {(config.officers || []).map(off => (
                    <option key={off} value={off}>{off}</option>
                  ))}
                  {(!config.officers || config.officers.length === 0) && (
                    <option value="Admin">Admin</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Given Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.givenDate} 
                  onChange={(e) => setFormData({...formData, givenDate: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instruction Details</label>
                <textarea 
                  className="form-control" 
                  rows={6}
                  value={formData.details} 
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  required
                  placeholder="Type the detailed official instructions here..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingInst ? 'Save Changes' : 'Publish Instruction'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ImportantInstructions;
