import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, Key, Eye, EyeOff } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

const Navbar = () => {
  const { currentUser, logout, updateUser } = useTaskContext();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (currentPassword !== currentUser.password) {
      setErrorMsg('Current password does not match.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Password should be at least 4 characters long.');
      return;
    }

    await updateUser(currentUser.id, { password: newPassword });
    alert('Password updated successfully!');
    setIsModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const cleanRole = (role) => {
    if (role === 'incharge') return 'Incharge';
    if (role === 'sub_incharge') return 'Sub-Incharge';
    return 'Subordinate';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Activity size={24} />
        TaskTracker Pro
      </div>
      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
            {currentUser.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({cleanRole(currentUser.role)})</span>
          </span>
          <button 
            className="btn btn-outline" 
            onClick={() => setIsModalOpen(true)} 
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
          >
            <Key size={14} /> Change Password
          </button>
          <button 
            className="btn btn-outline" 
            onClick={handleLogout} 
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem', borderColor: 'var(--danger)', color: 'var(--danger-text)' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}

      {/* Password Change Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="card-header">
              <h2 className="card-title">Update Your Password</h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              {errorMsg && (
                <div style={{ background: 'var(--danger-light)', color: 'var(--danger-text)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="form-control" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button" 
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-control" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-control" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
