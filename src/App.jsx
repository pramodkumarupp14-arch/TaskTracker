// Trigger deploy on db-storage
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import InchargeDashboard from './pages/InchargeDashboard';
import SubordinateDashboard from './pages/SubordinateDashboard';
import SubInchargeDashboard from './pages/SubInchargeDashboard';
import TaskEntry from './pages/TaskEntry';
import UserManagement from './pages/UserManagement';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useTaskContext();
  if (!currentUser) return <Navigate to="/" />;
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'incharge') return <Navigate to="/incharge" />;
    if (currentUser.role === 'sub_incharge') return <Navigate to="/sub-incharge" />;
    return <Navigate to="/subordinate" />;
  }
  return children;
};

const AppContent = () => {
  const { loading } = useTaskContext();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connecting to server...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/incharge" element={
            <ProtectedRoute allowedRoles={['incharge']}>
              <InchargeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/incharge/users" element={
            <ProtectedRoute allowedRoles={['incharge']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/task/new" element={
            <ProtectedRoute allowedRoles={['incharge', 'sub_incharge']}>
              <TaskEntry />
            </ProtectedRoute>
          } />
          <Route path="/sub-incharge" element={
            <ProtectedRoute allowedRoles={['sub_incharge']}>
              <SubInchargeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/subordinate" element={
            <ProtectedRoute allowedRoles={['subordinate']}>
              <SubordinateDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <TaskProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TaskProvider>
  );
}

export default App;
