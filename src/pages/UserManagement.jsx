import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Plus, ShieldAlert, Search } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

const UserManagement = () => {
  const { users, addUser, updateUser } = useTaskContext();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    role: 'subordinate',
    enabled: true,
    power_assign_tasks: true,
    power_forward_tasks: true,
    power_manage_masters: false,
    power_manage_instructions: false
  });

  const openNewUserModal = () => {
    setEditingUser(null);
    setFormData({ 
      username: '', 
      name: '', 
      password: '', 
      role: 'subordinate', 
      enabled: true, 
      power_assign_tasks: true,
      power_forward_tasks: true,
      power_manage_masters: false,
      power_manage_instructions: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ 
      username: user.username, 
      name: user.name, 
      password: user.password, 
      role: user.role,
      enabled: user.enabled !== false,
      power_assign_tasks: user.power_assign_tasks !== false,
      power_forward_tasks: user.power_forward_tasks !== false,
      power_manage_masters: user.power_manage_masters === true,
      power_manage_instructions: user.power_manage_instructions === true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const actionText = editingUser 
      ? `update the user account profile and permissions for "${formData.name}"`
      : `create a new user account for "${formData.name}"`;
      
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    setIsModalOpen(false);
  };

  // Sort: Incharge > Sub Incharge > Subordinate
  const roleOrder = { 'incharge': 1, 'sub_incharge': 2, 'subordinate': 3 };
  
  const filteredUsers = users
    .filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>
      <button 
        className="btn btn-outline" 
        onClick={() => navigate('/incharge')}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage subordinate and sub-incharge accounts, toggle status, and configure granular permissions.</p>
        </div>
        <button className="btn btn-primary" onClick={openNewUserModal}>
          <Plus size={20} /> Add New User
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            className="form-control" 
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, username, or role..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Sub-Incharge Powers</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found matching your search.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} style={{ opacity: user.enabled !== false ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 500 }}>{user.name}</td>
                    <td>{user.username}</td>
                    <td>
                      <span className={`badge`} style={{ 
                        background: user.role === 'incharge' ? 'var(--primary-light)' : user.role === 'sub_incharge' ? 'var(--warning-light)' : 'var(--bg-app)',
                        color: user.role === 'incharge' ? 'var(--primary)' : user.role === 'sub_incharge' ? 'var(--warning-text)' : 'var(--text-main)',
                        border: '1px solid var(--border)'
                      }}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {user.role === 'sub_incharge' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {user.power_assign_tasks !== false && <span className="badge" style={{ background: 'var(--success-light)', color: 'var(--success-text)', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Assign</span>}
                          {user.power_forward_tasks !== false && <span className="badge" style={{ background: 'var(--success-light)', color: 'var(--success-text)', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Forward</span>}
                          {user.power_manage_masters === true && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Masters</span>}
                          {user.power_manage_instructions === true && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>Instructions</span>}
                          {user.power_assign_tasks === false && user.power_forward_tasks === false && user.power_manage_masters !== true && user.power_manage_instructions !== true && (
                            <span className="badge" style={{ background: 'var(--danger-light)', color: 'var(--danger-text)', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>None</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge`} style={{ 
                        background: user.enabled !== false ? 'var(--success-light)' : 'var(--danger-light)',
                        color: user.enabled !== false ? 'var(--success-text)' : 'var(--danger-text)'
                      }}>
                        {user.enabled !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => openEditModal(user)}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px' }}>
            <div className="card-header">
              <h2 className="card-title">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            {editingUser && editingUser.role === 'incharge' && (
              <div style={{ background: 'var(--warning-light)', color: 'var(--warning-text)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <ShieldAlert size={16} /> Be careful modifying the main admin account.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-control" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                  disabled={editingUser && editingUser.role === 'incharge'}
                >
                  <option value="subordinate">Subordinate</option>
                  <option value="sub_incharge">Sub Incharge</option>
                  {editingUser && editingUser.role === 'incharge' && <option value="incharge">Incharge</option>}
                </select>
              </div>

              {formData.role === 'sub_incharge' && (
                <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>
                    Delegate Granular Permissions
                  </label>
                  
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="assign-checkbox"
                      checked={formData.power_assign_tasks} 
                      onChange={(e) => setFormData({...formData, power_assign_tasks: e.target.checked})}
                    />
                    <label htmlFor="assign-checkbox" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: 400 }}>
                      Allow Assigning Tasks
                    </label>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="forward-checkbox"
                      checked={formData.power_forward_tasks} 
                      onChange={(e) => setFormData({...formData, power_forward_tasks: e.target.checked})}
                    />
                    <label htmlFor="forward-checkbox" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: 400 }}>
                      Allow Forwarding Tasks
                    </label>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="masters-checkbox"
                      checked={formData.power_manage_masters} 
                      onChange={(e) => setFormData({...formData, power_manage_masters: e.target.checked})}
                    />
                    <label htmlFor="masters-checkbox" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: 400 }}>
                      Allow Managing Masters (Priorities, Statuses, Officers)
                    </label>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                    <input 
                      type="checkbox" 
                      id="instructions-checkbox"
                      checked={formData.power_manage_instructions} 
                      onChange={(e) => setFormData({...formData, power_manage_instructions: e.target.checked})}
                    />
                    <label htmlFor="instructions-checkbox" className="form-label" style={{ margin: 0, cursor: 'pointer', fontWeight: 400 }}>
                      Allow Managing Instructions (Create, Edit, Delete)
                    </label>
                  </div>
                </div>
              )}

              {(!editingUser || editingUser.role !== 'incharge') && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="enabled-checkbox"
                    checked={formData.enabled} 
                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                  />
                  <label htmlFor="enabled-checkbox" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Account Enabled
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
