import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, ShieldCheck, Check, X, AlertTriangle, ArrowUpDown, GripVertical, Save, RefreshCw } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

const SystemSettings = () => {
  const { 
    config, 
    addPriority, updatePriority, 
    addOfficer, updateOfficer, 
    addStatus, updateStatus,
    refreshData
  } = useTaskContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('priorities');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', enabled: true, sortOrder: 0 });

  // Drag and Drop custom sequencing states
  const [localItems, setLocalItems] = useState([]);
  const [hasSequenceChanges, setHasSequenceChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const rawPriorities = config.rawPriorities || [];
  const rawOfficers = config.rawOfficers || [];
  const rawStatuses = config.rawStatuses || [];

  const getItemsForActiveTab = () => {
    let list = [];
    if (activeTab === 'priorities') list = rawPriorities;
    else if (activeTab === 'officers') list = rawOfficers;
    else if (activeTab === 'statuses') list = rawStatuses;
    
    // Sort consistently: sort_order asc, id asc
    return [...list].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
  };

  // Synchronize local drag state whenever the database config or active tab changes
  useEffect(() => {
    setLocalItems(getItemsForActiveTab());
    setHasSequenceChanges(false);
  }, [activeTab, config.rawPriorities, config.rawOfficers, config.rawStatuses]);

  const openAddModal = () => {
    // Propose default sort order as count + 1
    const nextOrder = localItems.length + 1;
    setEditingItem(null);
    setFormData({ name: '', enabled: true, sortOrder: nextOrder });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, enabled: item.enabled !== false, sortOrder: item.sort_order || 0 });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const orderNum = Number(formData.sortOrder) || 0;

    if (activeTab === 'priorities') {
      if (editingItem) {
        await updatePriority(editingItem.id, { name: formData.name, enabled: formData.enabled, sort_order: orderNum });
      } else {
        await addPriority(formData.name, orderNum);
      }
    } else if (activeTab === 'officers') {
      if (editingItem) {
        await updateOfficer(editingItem.id, { name: formData.name, enabled: formData.enabled, sort_order: orderNum });
      } else {
        await addOfficer(formData.name, orderNum);
      }
    } else if (activeTab === 'statuses') {
      if (editingItem) {
        await updateStatus(editingItem.id, { name: formData.name, enabled: formData.enabled, sort_order: orderNum });
      } else {
        await addStatus(formData.name, orderNum);
      }
    }

    setIsModalOpen(false);
  };

  const handleToggleEnable = async (item) => {
    const nextEnabled = !item.enabled;
    if (activeTab === 'statuses' && item.name === 'pending' && !nextEnabled) {
      alert("The 'pending' status is required by the system and cannot be disabled.");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${nextEnabled ? 'enable' : 'disable'} the master config item "${item.name.replace(/_/g, ' ')}"?`)) {
      return;
    }

    if (activeTab === 'priorities') {
      await updatePriority(item.id, { enabled: nextEnabled });
    } else if (activeTab === 'officers') {
      await updateOfficer(item.id, { enabled: nextEnabled });
    } else if (activeTab === 'statuses') {
      await updateStatus(item.id, { enabled: nextEnabled });
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
    e.currentTarget.style.border = '2px dashed var(--primary)';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...localItems];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    
    // Auto-update their local sort order values sequentially
    const sequentialItems = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1
    }));

    setLocalItems(sequentialItems);
    setHasSequenceChanges(true);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.border = 'none';
    setDraggedIndex(null);
  };

  const handleSaveSequence = async () => {
    if (!window.confirm("Are you sure you want to permanently save the new display sequence layout for these configuration items?")) {
      return;
    }
    setIsSaving(true);
    try {
      const promises = localItems.map((item, index) => {
        const updates = { sort_order: index + 1 };
        if (activeTab === 'priorities') {
          return updatePriority(item.id, updates);
        } else if (activeTab === 'officers') {
          return updateOfficer(item.id, updates);
        } else if (activeTab === 'statuses') {
          return updateStatus(item.id, updates);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      await refreshData();
      setHasSequenceChanges(false);
      alert("List sequence reordered and saved successfully!");
    } catch (err) {
      console.error("Failed to save dynamic sequence:", err);
      alert("Error saving custom sequence. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <button 
        className="btn btn-outline" 
        onClick={() => navigate('/incharge')}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>System Configuration</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure priorities, officers, and statuses. <strong>Drag & Drop</strong> rows to custom-order the lists as shown on entry pages.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} /> Add New {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Action Banner for Reordering */}
      {hasSequenceChanges && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--primary-light)',
          color: 'var(--primary-text)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--primary)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ArrowUpDown size={20} style={{ animation: 'bounce 2s infinite' }} />
            <span>You have reordered this master list! Click <strong>"Save Sequence Changes"</strong> to save this arrangement.</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn btn-outline" 
              style={{ background: 'white' }} 
              onClick={() => {
                setLocalItems(getItemsForActiveTab());
                setHasSequenceChanges(false);
              }}
              disabled={isSaving}
            >
              Reset Order
            </button>
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleSaveSequence}
              disabled={isSaving}
            >
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving Changes...' : 'Save Sequence Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '2rem' }}>
        {['priorities', 'officers', 'statuses'].map(tab => (
          <button 
            key={tab}
            className={`btn`} 
            style={{ 
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              padding: '0.75rem 1.5rem',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: 600,
              fontSize: '1rem',
              textTransform: 'capitalize'
            }}
            onClick={() => {
              if (hasSequenceChanges) {
                if (window.confirm("You have unsaved sorting changes. Do you want to discard them?")) {
                  setActiveTab(tab);
                }
              } else {
                setActiveTab(tab);
              }
            }}
          >
            {tab === 'officers' ? 'Officers / Assigners' : tab}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Name / Value</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Sequence</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No items defined. Click "Add New" to get started.
                  </td>
                </tr>
              ) : (
                localItems.map((item, index) => (
                  <tr 
                    key={item.id || item.name} 
                    style={{ 
                      opacity: item.enabled ? 1 : 0.6,
                      cursor: 'grab',
                      transition: 'background 0.2s ease, transform 0.2s ease',
                      backgroundColor: draggedIndex === index ? 'var(--bg-hover)' : 'transparent'
                    }}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <td style={{ color: 'var(--text-muted)', width: '40px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <GripVertical size={16} style={{ cursor: 'grab' }} />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)', verticalAlign: 'middle' }}>
                      {item.name.replace(/_/g, ' ')}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', textAlignment: 'center', verticalAlign: 'middle', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className={`badge`} style={{ 
                        background: item.enabled ? 'var(--success-light)' : 'var(--danger-light)',
                        color: item.enabled ? 'var(--success-text)' : 'var(--danger-text)'
                      }}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.35rem 0.75rem', 
                            fontSize: '0.75rem', 
                            background: item.enabled ? 'var(--danger-light)' : 'var(--success-light)',
                            color: item.enabled ? 'var(--danger-text)' : 'var(--success-text)',
                            border: 'none'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEnable(item);
                          }}
                        >
                          {item.enabled ? <X size={12} /> : <Check size={12} />}
                          {item.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Alert banner */}
      {activeTab === 'statuses' && (
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--warning-light)', color: 'var(--warning-text)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--warning)', marginTop: '2rem' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Dynamic Status Restrictions:</strong>
            <span style={{ fontSize: '0.875rem' }}>
              Disabling a status will remove it from all status update and filter dropdowns. Existing tasks currently set to a disabled status will remain intact, but no new tasks can be transitioned into that status.
            </span>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header">
              <h2 className="card-title">
                {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{activeTab.slice(0, -1).toUpperCase()} Name / Value</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  placeholder={`e.g. ${activeTab === 'priorities' ? 'Critical' : activeTab === 'officers' ? 'ADG-HQ' : 'completed_his_part'}`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sort Order / Index</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.sortOrder} 
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  required 
                  min="1"
                />
              </div>

              {editingItem && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="enabled-checkbox"
                    checked={formData.enabled} 
                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                  />
                  <label htmlFor="enabled-checkbox" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Active / Enabled
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
