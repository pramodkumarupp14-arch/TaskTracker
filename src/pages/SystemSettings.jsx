import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, ShieldCheck, Check, X, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

const SystemSettings = () => {
  const { 
    config, 
    addPriority, updatePriority, 
    addOfficer, updateOfficer, 
    addStatus, updateStatus 
  } = useTaskContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('priorities');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', enabled: true, sortOrder: 0 });

  const rawPriorities = config.rawPriorities || [];
  const rawOfficers = config.rawOfficers || [];
  const rawStatuses = config.rawStatuses || [];

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', enabled: true, sortOrder: 0 });
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
    if (activeTab === 'priorities') {
      await updatePriority(item.id, { enabled: nextEnabled });
    } else if (activeTab === 'officers') {
      await updateOfficer(item.id, { enabled: nextEnabled });
    } else if (activeTab === 'statuses') {
      if (item.name === 'pending' && !nextEnabled) {
        alert("The 'pending' status is required by the system and cannot be disabled.");
        return;
      }
      await updateStatus(item.id, { enabled: nextEnabled });
    }
  };

  const getItemsForActiveTab = () => {
    let list = [];
    if (activeTab === 'priorities') list = rawPriorities;
    else if (activeTab === 'officers') list = rawOfficers;
    else if (activeTab === 'statuses') list = rawStatuses;
    
    // Sort local display consistently: sort_order asc, id asc
    return [...list].sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
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
          <p style={{ color: 'var(--text-muted)' }}>Configure priority levels, senior officers (assigners), and global task statuses. Arrange order using numerical values.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} /> Add New {activeTab.slice(0, -1)}
        </button>
      </div>

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
            onClick={() => setActiveTab(tab)}
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
                <th>Name / Value</th>
                <th>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowUpDown size={14} /> Display Sequence / Order
                  </div>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getItemsForActiveTab().length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No items defined. Click "Add New" to get started.
                  </td>
                </tr>
              ) : (
                getItemsForActiveTab().map(item => (
                  <tr key={item.id || item.name} style={{ opacity: item.enabled ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.name.replace(/_/g, ' ')}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {item.sort_order || 0}
                    </td>
                    <td>
                      <span className={`badge`} style={{ 
                        background: item.enabled ? 'var(--success-light)' : 'var(--danger-light)',
                        color: item.enabled ? 'var(--success-text)' : 'var(--danger-text)'
                      }}>
                        {item.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => openEditModal(item)}
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
                          onClick={() => handleToggleEnable(item)}
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
                <label className="form-label">Sort Order (Lower numbers display first)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.sortOrder} 
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  required 
                  min="0"
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
