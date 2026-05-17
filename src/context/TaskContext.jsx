import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ppshqmgysuzdgvyrnwky.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc2hxbWd5c3V6ZGd2eXJud2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzAwMjYsImV4cCI6MjA5MzU0NjAyNn0.8B0y1sHXVbJXh0T-v3rFZFmwFTbxoqMCrih6at4L4To';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for mapping database snake_case to frontend camelCase
const mapToCamel = (item) => {
  if (!item) return item;
  return {
    id: item.id,
    sourceDept: item.source_dept,
    letterNo: item.letter_no,
    letterDate: item.letter_date,
    receivedDateTime: item.received_date_time,
    briefSubject: item.brief_subject,
    assignedBySenior: item.assigned_by_senior,
    priority: item.priority,
    instructions: item.instructions,
    assignedTo: item.assigned_to,
    assignmentDateTime: item.assignment_date_time,
    tentativeCompletionTime: item.tentative_completion_time,
    inchargeRemarks: item.incharge_remarks,
    status: item.status,
    subordinateStatuses: item.subordinate_statuses,
    pushRemarks: item.push_remarks,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
};

const mapToSnake = (item) => {
  const result = {};
  if (item.sourceDept !== undefined) result.source_dept = item.sourceDept;
  if (item.letterNo !== undefined) result.letter_no = item.letterNo;
  if (item.letterDate !== undefined) result.letter_date = item.letterDate;
  if (item.receivedDateTime !== undefined) result.received_date_time = item.receivedDateTime;
  if (item.briefSubject !== undefined) result.brief_subject = item.briefSubject;
  if (item.assignedBySenior !== undefined) result.assigned_by_senior = item.assignedBySenior;
  if (item.priority !== undefined) result.priority = item.priority;
  if (item.instructions !== undefined) result.instructions = item.instructions;
  if (item.assignedTo !== undefined) result.assigned_to = item.assignedTo;
  if (item.assignmentDateTime !== undefined) result.assignment_date_time = item.assignmentDateTime;
  if (item.tentativeCompletionTime !== undefined) result.tentative_completion_time = item.tentativeCompletionTime;
  if (item.inchargeRemarks !== undefined) result.incharge_remarks = item.inchargeRemarks;
  if (item.status !== undefined) result.status = item.status;
  if (item.subordinateStatuses !== undefined) result.subordinate_statuses = item.subordinateStatuses;
  if (item.pushRemarks !== undefined) result.push_remarks = item.pushRemarks;
  return result;
};

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
  const [config, setConfig] = useState({ 
    priorities: [], 
    officers: [], 
    statuses: [],
    rawPriorities: [],
    rawOfficers: [],
    rawStatuses: []
  });

  // ── Fetch on mount ──────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [tasksRes, usersRes, prioritiesRes, officersRes, statusesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*'),
        supabase.from('priorities').select('*').order('id'),
        supabase.from('officers').select('*').order('id'),
        supabase.from('statuses').select('*').order('id')
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (usersRes.error) throw usersRes.error;
      if (prioritiesRes.error) throw prioritiesRes.error;
      if (officersRes.error) throw officersRes.error;

      // Fallback for statuses if table doesn't exist
      let rawStats = [];
      if (statusesRes.error) {
        rawStats = [
          { id: 1, name: 'pending', enabled: true },
          { id: 2, name: 'partially_done', enabled: true },
          { id: 3, name: 'fully_completed', enabled: true },
          { id: 4, name: 'resolved', enabled: true },
          { id: 5, name: 'closed', enabled: true }
        ];
      } else {
        rawStats = statusesRes.data;
      }

      const rawPri = (prioritiesRes.data || []).map(p => ({ ...p, enabled: p.enabled !== false }));
      const rawOff = (officersRes.data || []).map(o => ({ ...o, enabled: o.enabled !== false }));

      setTasks(tasksRes.data.map(mapToCamel));
      setUsers((usersRes.data || []).map(u => ({ 
        ...u, 
        enabled: u.enabled !== false,
        power_assign_tasks: u.power_assign_tasks !== false,
        power_forward_tasks: u.power_forward_tasks !== false,
        power_manage_masters: u.power_manage_masters === true 
      })));
      
      setConfig({
        priorities: rawPri.filter(p => p.enabled).map(p => p.name),
        officers: rawOff.filter(o => o.enabled).map(o => o.name),
        statuses: rawStats.filter(s => s.enabled).map(s => s.name),
        rawPriorities: rawPri,
        rawOfficers: rawOff,
        rawStatuses: rawStats
      });
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Session persistence ─────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser_v4');
    }
  }, [currentUser]);

  // Update local session current user when the remote user gets modified
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updatedSelf = users.find(u => u.id === currentUser.id);
      if (updatedSelf) {
        if (updatedSelf.enabled === false) {
          setCurrentUser(null);
        } else if (JSON.stringify(updatedSelf) !== JSON.stringify(currentUser)) {
          setCurrentUser(updatedSelf);
        }
      }
    }
  }, [users, currentUser]);

  // ── Auth ────────────────────────────────────────────────────────
  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.enabled === false) {
        return { success: false, message: 'Your account has been disabled. Please contact the Incharge.' };
      }
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
    const newTask = { ...mapToSnake({ ...task, status: 'pending', subordinateStatuses: subStatuses, pushRemarks: [] }), id: Date.now() };
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [mapToCamel(data), ...prev]);
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const updateTask = async (id, updates) => {
    const snakeUpdates = mapToSnake(updates);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(snakeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? mapToCamel(data) : t));
    } catch (err) {
      console.error('Error updating task:', err);
    }
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

  const deleteTask = async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const deleteTasks = async (ids) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);
      if (error) throw error;
      setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    } catch (err) {
      console.error('Error deleting multiple tasks:', err);
    }
  };

  const resetTasks = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .neq('id', 0);
      if (error) throw error;
      setTasks([]);
    } catch (err) {
      console.error('Error resetting tasks:', err);
    }
  };

  // ── Users ───────────────────────────────────────────────────────
  const addUser = async (user) => {
    const newUser = { 
      ...user, 
      id: Date.now(), 
      enabled: user.enabled !== false, 
      power_assign_tasks: user.power_assign_tasks !== false,
      power_forward_tasks: user.power_forward_tasks !== false,
      power_manage_masters: user.power_manage_masters === true 
    };
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;
      setUsers(prev => [...prev, { 
        ...data, 
        enabled: data.enabled !== false, 
        power_assign_tasks: data.power_assign_tasks !== false,
        power_forward_tasks: data.power_forward_tasks !== false,
        power_manage_masters: data.power_manage_masters === true 
      }]);
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { 
        ...data, 
        enabled: data.enabled !== false, 
        power_assign_tasks: data.power_assign_tasks !== false,
        power_forward_tasks: data.power_forward_tasks !== false,
        power_manage_masters: data.power_manage_masters === true 
      } : u));
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  // ── System Configuration CRUD ──────────────────────────────────
  const addPriority = async (name) => {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .insert([{ name, enabled: true }])
        .select()
        .single();
      if (error) throw error;
      
      setConfig(prev => {
        const raw = [...prev.rawPriorities, { ...data, enabled: true }];
        return {
          ...prev,
          rawPriorities: raw,
          priorities: raw.filter(p => p.enabled).map(p => p.name)
        };
      });
    } catch (err) {
      console.error('Error adding priority:', err);
    }
  };

  const updatePriority = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      setConfig(prev => {
        const raw = prev.rawPriorities.map(p => p.id === id ? { ...p, ...data } : p);
        return {
          ...prev,
          rawPriorities: raw,
          priorities: raw.filter(p => p.enabled).map(p => p.name)
        };
      });
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  };

  const addOfficer = async (name) => {
    try {
      const { data, error } = await supabase
        .from('officers')
        .insert([{ name, enabled: true }])
        .select()
        .single();
      if (error) throw error;

      setConfig(prev => {
        const raw = [...prev.rawOfficers, { ...data, enabled: true }];
        return {
          ...prev,
          rawOfficers: raw,
          officers: raw.filter(o => o.enabled).map(o => o.name)
        };
      });
    } catch (err) {
      console.error('Error adding officer:', err);
    }
  };

  const updateOfficer = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('officers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      setConfig(prev => {
        const raw = prev.rawOfficers.map(o => o.id === id ? { ...o, ...data } : o);
        return {
          ...prev,
          rawOfficers: raw,
          officers: raw.filter(o => o.enabled).map(o => o.name)
        };
      });
    } catch (err) {
      console.error('Error updating officer:', err);
    }
  };

  const addStatus = async (name) => {
    try {
      const { data, error } = await supabase
        .from('statuses')
        .insert([{ name, enabled: true }])
        .select()
        .single();
      if (error) throw error;

      setConfig(prev => {
        const raw = [...prev.rawStatuses, { ...data, enabled: true }];
        return {
          ...prev,
          rawStatuses: raw,
          statuses: raw.filter(s => s.enabled).map(s => s.name)
        };
      });
    } catch (err) {
      console.error('Error adding status:', err);
    }
  };

  const updateStatus = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      setConfig(prev => {
        const raw = prev.rawStatuses.map(s => s.id === id ? { ...s, ...data } : s);
        return {
          ...prev,
          rawStatuses: raw,
          statuses: raw.filter(s => s.enabled).map(s => s.name)
        };
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks, users, config, loading, currentUser,
      login, logout,
      addTask, updateGlobalTaskStatus, updateSubordinateStatus, pushTask, forwardTask,
      deleteTask, deleteTasks, resetTasks,
      addUser, updateUser,
      addPriority, updatePriority,
      addOfficer, updateOfficer,
      addStatus, updateStatus
    }}>
      {children}
    </TaskContext.Provider>
  );
};
