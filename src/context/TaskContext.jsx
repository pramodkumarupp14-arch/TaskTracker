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
  const [config, setConfig] = useState({ priorities: [], officers: [] });

  // ── Fetch on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes, prioritiesRes, officersRes] = await Promise.all([
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('users').select('*'),
          supabase.from('priorities').select('name').order('id'),
          supabase.from('officers').select('name').order('id')
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (usersRes.error) throw usersRes.error;
        if (prioritiesRes.error) throw prioritiesRes.error;
        if (officersRes.error) throw officersRes.error;

        setTasks(tasksRes.data.map(mapToCamel));
        setUsers(usersRes.data);
        setConfig({
          priorities: prioritiesRes.data.map(p => p.name),
          officers: officersRes.data.map(o => o.name)
        });
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

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

  // ── Users ───────────────────────────────────────────────────────
  const addUser = async (user) => {
    const newUser = { ...user, id: Date.now() };
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;
      setUsers(prev => [...prev, data]);
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
      setUsers(prev => prev.map(u => u.id === id ? data : u));
    } catch (err) {
      console.error('Error updating user:', err);
    }
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
