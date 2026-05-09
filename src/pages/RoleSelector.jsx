import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

const RoleSelector = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useTaskContext();

  const handleRoleSelect = (role, name) => {
    setCurrentUser({ role, name });
    if (role === 'incharge') {
      navigate('/incharge');
    } else {
      navigate('/subordinate');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 8rem)' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Welcome to TaskTracker Pro</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>Select your role to continue</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div 
          className="card" 
          style={{ width: '300px', cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem' }}
          onClick={() => handleRoleSelect('incharge', 'Section Incharge')}
        >
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Section Incharge</h2>
          <p style={{ color: 'var(--text-muted)' }}>Dashboard, Assignment & Tracking</p>
        </div>

        <div 
          className="card" 
          style={{ width: '300px', cursor: 'pointer', textAlign: 'center', padding: '3rem 2rem' }}
          onClick={() => handleRoleSelect('subordinate', 'Subordinate 3')}
        >
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <User size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Subordinate</h2>
          <p style={{ color: 'var(--text-muted)' }}>Task Execution & Reporting</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
