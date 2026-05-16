import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api';

const TaskContext = createContext();
export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser_v4');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ priorities: [], officers: [] });

  // ── Fetch on mount ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`${API}/tasks`).then(r => r.json()),
      fetch(`${API}/users`).then(r => r.json()),
      fetch(`${API}/config`).then(r => r.json()),
    ]).then(([t, u, c]) => {
      setTasks(t);
      setUsers(u);
      setConfig(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Session persistence ─────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser_v4');
    }
  }, [currentUser]);

  // ── Auth ────────────────────────────────────────────────────────
  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return { success: true, role: user.role };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const logout = () => setCurrentUser(null);

  // ── Tasks ───────────────────────────────────────────────────────
  const addTask = async (task) => {
    const subStatuses = {};
    if (Array.isArray(task.assignedTo)) {
      task.assignedTo.forEach(sub => {
        subStatuses[sub] = { status: 'pending', reason: '' };
      });
    }
    const newTask = { ...task, status: 'pending', subordinateStatuses: subStatuses, pushRemarks: [] };
    const saved = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    }).then(r => r.json());
    setTasks(prev => [saved, ...prev]);
  };

  const updateTask = async (id, updates) => {
    const updated = await fetch(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json());
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  const updateGlobalTaskStatus = (id, newStatus) =>
    updateTask(id, { status: newStatus });

  const updateSubordinateStatus = (taskId, subName, subStatus, reason) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSubStatuses = { ...task.subordinateStatuses };
    newSubStatuses[subName] = { status: subStatus, reason, updatedAt: new Date().toISOString() };
    const newGlobalStatus = subStatus === 'fully_completed' ? 'fully_completed' : task.status;
    updateTask(taskId, { subordinateStatuses: newSubStatuses, status: newGlobalStatus });
  };

  const pushTask = (id, remark) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const pushRemarks = [...(task.pushRemarks || []), { remark, date: new Date().toISOString() }];
    updateTask(id, { pushRemarks });
  };

  const forwardTask = (taskId, newAssignees) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const assignedTo = [...new Set([...(task.assignedTo || []), ...newAssignees])];
    const newSubStatuses = { ...task.subordinateStatuses };
    newAssignees.forEach(sub => {
      if (!newSubStatuses[sub]) newSubStatuses[sub] = { status: 'pending', reason: '' };
    });
    updateTask(taskId, { assignedTo, subordinateStatuses: newSubStatuses });
  };

  // ── Users ───────────────────────────────────────────────────────
  const addUser = async (user) => {
    const saved = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }).then(r => r.json());
    setUsers(prev => [...prev, saved]);
  };

  const updateUser = async (id, updates) => {
    const updated = await fetch(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json());
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
  };

  return (
    <TaskContext.Provider value={{
      tasks, users, config, loading, currentUser,
      login, logout,
      addTask, updateGlobalTaskStatus, updateSubordinateStatus, pushTask, forwardTask,
      addUser, updateUser
    }}>
      {children}
    </TaskContext.Provider>
  );
};
