import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

const Navbar = () => {
  const { currentUser, logout } = useTaskContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Activity size={24} />
        TaskTracker Pro
      </div>
      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontWeight: 500 }}>
            {currentUser.name} ({currentUser.role === 'incharge' ? 'Incharge' : 'Subordinate'})
          </span>
          <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
