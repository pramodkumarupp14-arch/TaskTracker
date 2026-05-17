import React, { useState, useMemo } from 'react';
import { Clock, AlertCircle, Calendar, Forward, MessageSquare, Download, FileText, Search, LayoutGrid, List, BellRing, Filter, ArrowUpDown, Trash2 } from 'lucide-react';
import { format, isPast, addDays, isBefore, parse } from 'date-fns';
import { exportToExcel, exportToPDF } from '../utils/export';
import { useTaskContext } from '../context/TaskContext';

const TaskBoard = ({ 
  tasks, 
  isSupervisory,
  onUpdateGlobalStatus,
  onUpdateSubordinateStatus,
  onForward,
  onPush
}) => {
  const { users, config, currentUser, deleteTask, deleteTasks, resetTasks } = useTaskContext();
  const [viewMode, setViewMode] = useState('medium'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignedBy, setFilterAssignedBy] = useState('');
  const [sortBy, setSortBy] = useState('deadline-asc');
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);

  const enableBulkActions = currentUser?.role === 'incharge';

  const getUrgencyClass = (deadline) => {
    if (!deadline) return '';
    try {
      const date = parse(deadline, 'dd/MM/yyyy HH:mm', new Date());
      if (isPast(date)) return 'past-deadline';
      if (isBefore(date, addDays(new Date(), 2))) return 'near-deadline';
    } catch(e) {}
    return '';
  };

  const priorityWeights = { 'A+': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

  const processedTasks = useMemo(() => {
    let filtered = tasks.filter(t => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (t.briefSubject || '').toLowerCase().includes(searchLower) ||
        (t.letterNo || '').toLowerCase().includes(searchLower) ||
        (t.sourceDept || '').toLowerCase().includes(searchLower);
      
      const matchesPriority = filterPriority ? t.priority === filterPriority : true;
      const matchesStatus = filterStatus ? t.status === filterStatus : true;
      const matchesAssignedBy = filterAssignedBy ? t.assignedBySenior === filterAssignedBy : true;
      
      return matchesSearch && matchesPriority && matchesStatus && matchesAssignedBy;
    });

    filtered.sort((a, b) => {
      if (sortBy.startsWith('priority')) {
        const pA = priorityWeights[a.priority] || 0;
        const pB = priorityWeights[b.priority] || 0;
        return sortBy === 'priority-desc' ? pB - pA : pA - pB;
      }
      if (sortBy.startsWith('deadline')) {
        try {
          const dA = a.tentativeCompletionTime ? parse(a.tentativeCompletionTime, 'dd/MM/yyyy HH:mm', new Date()).getTime() : Infinity;
          const dB = b.tentativeCompletionTime ? parse(b.tentativeCompletionTime, 'dd/MM/yyyy HH:mm', new Date()).getTime() : Infinity;
          return sortBy === 'deadline-asc' ? dA - dB : dB - dA;
        } catch(e) { return 0; }
      }
      if (sortBy.startsWith('received')) {
        try {
          const dA = a.receivedDateTime ? parse(a.receivedDateTime, 'dd/MM/yyyy HH:mm', new Date()).getTime() : 0;
          const dB = b.receivedDateTime ? parse(b.receivedDateTime, 'dd/MM/yyyy HH:mm', new Date()).getTime() : 0;
          return sortBy === 'received-asc' ? dA - dB : dB - dA;
        } catch(e) { return 0; }
      }
      return 0;
    });

    return filtered;
  }, [tasks, searchTerm, filterPriority, filterStatus, filterAssignedBy, sortBy]);

  // Bulk action handlers
  const handleDeleteSingle = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      await deleteTask(id);
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected task(s)? This action cannot be undone.`)) {
      await deleteTasks(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleResetAll = async () => {
    if (window.confirm("⚠️ WARNING: This will permanently delete ALL tasks in the system! This action cannot be undone. Are you absolutely sure?")) {
      const confirmWord = window.prompt("Type 'DELETE ALL' to confirm resetting the task list:");
      if (confirmWord === "DELETE ALL") {
        await resetTasks();
        setSelectedIds([]);
        alert("Task list reset successful!");
      } else {
        alert("Reset canceled.");
      }
    }
  };

  const renderCard = (task) => {
    const isAssignedToMe = task.assignedTo && currentUser && task.assignedTo.includes(currentUser.name);
    const urgency = getUrgencyClass(task.tentativeCompletionTime);

    // Sort assignees: sub_incharge first, then subordinates
    const sortedAssignees = [...(task.assignedTo || [])].sort((a, b) => {
      const roleA = users.find(u => u.name === a)?.role;
      const roleB = users.find(u => u.name === b)?.role;
      if (roleA === 'sub_incharge' && roleB !== 'sub_incharge') return -1;
      if (roleA !== 'sub_incharge' && roleB === 'sub_incharge') return 1;
      return 0;
    });
    
    let gridStyle = { padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' };
    let textSizes = { title: '1rem', sub: '0.85rem', meta: '0.75rem', icon: 16 };
    
    if (viewMode === 'small') {
      gridStyle.padding = '1rem';
      textSizes = { title: '0.85rem', sub: '0.75rem', meta: '0.65rem', icon: 12 };
    } else if (viewMode === 'large') {
      gridStyle.padding = '2rem';
      textSizes = { title: '1.25rem', sub: '0.9rem', meta: '0.85rem', icon: 20 };
    }

    return (
      <div key={task.id} className={`card ${urgency}`} style={gridStyle}>
        {enableBulkActions && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: 'var(--bg-app)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: textSizes.meta, fontWeight: 500 }}>
              <input 
                type="checkbox" 
                checked={selectedIds.includes(task.id)}
                onChange={() => {
                  if (selectedIds.includes(task.id)) {
                    setSelectedIds(prev => prev.filter(x => x !== task.id));
                  } else {
                    setSelectedIds(prev => [...prev, task.id]);
                  }
                }}
                style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
              />
              Select Task
            </label>
            <button 
              className="btn" 
              style={{ padding: '0.25rem', background: 'none', border: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', cursor: 'pointer' }} 
              onClick={(e) => handleDeleteSingle(task.id, e)}
              title="Delete Task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span className={`badge badge-${(task.priority || 'medium').toLowerCase().replace('+', 'plus')}`} style={{ marginBottom: '0.5rem', fontSize: textSizes.meta }}>{task.priority} Priority</span>
            {task.briefSubject && <h3 style={{ fontSize: textSizes.title, fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '0.25rem' }}>{task.briefSubject}</h3>}
            <div style={{ fontSize: textSizes.sub, fontWeight: 500, color: 'var(--text-main)' }}>{task.letterNo}</div>
            <p style={{ fontSize: textSizes.meta, color: 'var(--text-muted)', marginTop: '0.25rem' }}>From: {task.sourceDept} {task.letterDate ? `| Date: ${task.letterDate}` : ''}</p>
          </div>
          
          <span 
            className={`badge badge-${(task.status || 'pending')}`} 
            style={{ fontSize: textSizes.meta, cursor: isSupervisory ? 'pointer' : 'default', border: isSupervisory ? '1px dashed var(--primary)' : 'none' }}
            onClick={() => isSupervisory && onUpdateGlobalStatus && onUpdateGlobalStatus(task)}
            title={isSupervisory ? "Click to force update global status" : ""}
          >
            Global: {(task.status || 'pending').replace(/_/g, ' ')}
          </span>
        </div>
        
        <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', flexGrow: 1, borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: textSizes.sub, color: 'var(--text-main)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem', fontWeight: 500 }}>
            <MessageSquare size={textSizes.icon} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ display: '-webkit-box', WebkitLineClamp: viewMode === 'small' ? 2 : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.instructions || 'No special instructions.'}</span>
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', fontSize: textSizes.meta, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><strong>Received:</strong> {task.receivedDateTime ? format(parse(task.receivedDateTime, 'dd/MM/yyyy HH:mm', new Date()), 'dd MMM yy, HH:mm') : ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><strong>Assigned By:</strong> {task.assignedBySenior}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={textSizes.icon} /> <strong>Assigned:</strong> {task.assignmentDateTime ? format(parse(task.assignmentDateTime, 'dd/MM/yyyy HH:mm', new Date()), 'PPp') : ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: urgency === 'past-deadline' ? 'var(--danger)' : 'inherit' }}><Clock size={textSizes.icon} /> <strong>Deadline:</strong> {task.tentativeCompletionTime ? format(parse(task.tentativeCompletionTime, 'dd/MM/yyyy HH:mm', new Date()), 'PPp') : ''}</div>
          </div>
          
          {task.inchargeRemarks && (
            <div style={{ marginTop: '0.5rem', fontSize: textSizes.meta, color: 'var(--warning-text)', background: 'var(--warning-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <strong>Remarks:</strong> {task.inchargeRemarks}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: textSizes.meta, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Assignees Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sortedAssignees.length > 0 ? sortedAssignees.map(assignee => {
              const subObj = task.subordinateStatuses?.[assignee] || {};
              const stat = subObj.status || 'pending';
              
              if (task.status === 'fully_completed' && stat === 'pending') {
                return null; 
              }
              
              const isMe = currentUser && assignee === currentUser.name;
              const assigneeUser = users.find(u => u.name === assignee);
              const roleTag = assigneeUser?.role === 'sub_incharge' ? 'SI' : 'S';
              
              return (
                <div key={assignee} style={{ fontSize: textSizes.meta, background: isMe ? 'var(--primary-light)' : 'var(--surface)', color: 'var(--text-main)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid', borderColor: isMe ? 'var(--primary)' : 'var(--border)' }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start', marginBottom: subObj.reason ? '0.5rem' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <strong style={{ color: isMe ? 'var(--primary)' : 'inherit' }}>{assignee} <span style={{opacity: 0.5, fontSize: '0.8em'}}>({roleTag})</span></strong>
                      <span className={`badge badge-${stat.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>{stat.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  {subObj.updatedAt && (
                    <div style={{ fontSize: '0.65rem', opacity: 0.7, fontStyle: 'italic', marginTop: '0.1rem', marginBottom: '0.25rem' }}>
                      Updated: {format(new Date(subObj.updatedAt), 'dd MMM, HH:mm')}
                    </div>
                  )}
                  {subObj.reason && (
                    <div style={{ padding: '0.5rem', background: 'var(--bg-app)', borderLeft: '3px solid var(--secondary)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic', color: 'var(--text-main)' }}>
                      "{subObj.reason}"
                    </div>
                  )}
                </div>
              );
            }) : <span style={{ fontSize: textSizes.meta, color: 'var(--text-muted)' }}>Unassigned</span>}
          </div>
        </div>

        {task.pushRemarks && task.pushRemarks.length > 0 && (
          <div style={{ background: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--danger-text)', fontSize: textSizes.meta }}>
            <AlertCircle size={textSizes.icon} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontWeight: 500 }}>Push: "{task.pushRemarks[task.pushRemarks.length - 1].remark}"</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
          {isAssignedToMe && onUpdateSubordinateStatus && (
            <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: textSizes.meta }} onClick={() => onUpdateSubordinateStatus(task)}>
              Update My Status
            </button>
          )}
          {isSupervisory && onForward && (
            <button className="btn btn-outline" style={{ flex: isAssignedToMe ? 0 : 1, padding: '0.5rem', fontSize: textSizes.meta }} onClick={() => onForward(task)} title="Forward Task">
              <Forward size={textSizes.icon} /> {isAssignedToMe ? '' : 'Forward'}
            </button>
          )}
          {isSupervisory && currentUser?.role === 'incharge' && onPush && (
            <button className="btn btn-outline" style={{ flex: isAssignedToMe ? 0 : 1, padding: '0.5rem', fontSize: textSizes.meta }} onClick={() => onPush(task.id)} title="Push to Complete">
              <BellRing size={textSizes.icon} /> {isAssignedToMe ? '' : 'Push'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {enableBulkActions && <th>Select / Delete</th>}
                <th>Source & Letter</th>
                <th style={{ maxWidth: '250px' }}>Assigned By & Instructions</th>
                <th>Dates & Deadlines</th>
                <th>Priority</th>
                <th style={{ minWidth: '200px' }}>Assignees & Status</th>
                <th>Global Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedTasks.map(task => {
                const urgency = getUrgencyClass(task.tentativeCompletionTime);
                let deadlineBg = 'transparent';
                let deadlineColor = 'inherit';
                if (urgency === 'past-deadline') {
                  deadlineBg = 'var(--danger-light)';
                  deadlineColor = 'var(--danger-text)';
                } else if (urgency === 'near-deadline') {
                  deadlineBg = 'var(--warning-light)';
                  deadlineColor = 'var(--warning-text)';
                }
                
                return (
                <tr key={task.id}>
                  {enableBulkActions && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(task.id)}
                          onChange={() => {
                            if (selectedIds.includes(task.id)) {
                              setSelectedIds(prev => prev.filter(x => x !== task.id));
                            } else {
                              setSelectedIds(prev => [...prev, task.id]);
                            }
                          }}
                          style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
                        />
                        <button 
                          type="button" 
                          style={{ padding: '0.25rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          onClick={(e) => handleDeleteSingle(task.id, e)}
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{task.sourceDept}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <strong>{task.letterNo}</strong> {task.letterDate ? `| ${task.letterDate}` : ''}
                    </div>
                  </td>
                  <td style={{ maxWidth: '250px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{task.assignedBySenior}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{task.instructions || 'No special instructions.'}"
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}>Rcvd: {task.receivedDateTime ? format(parse(task.receivedDateTime, 'dd/MM/yyyy HH:mm', new Date()), 'dd MMM yy, HH:mm') : ''}</div>
                    <div style={{ background: deadlineBg, color: deadlineColor, padding: '0.1rem 0.3rem', borderRadius: '4px', display: 'inline-block', fontWeight: urgency ? 600 : 400 }}>
                      Due: {task.tentativeCompletionTime ? format(parse(task.tentativeCompletionTime, 'dd/MM/yyyy HH:mm', new Date()), 'dd MMM yy, HH:mm') : ''}
                    </div>
                  </td>
                  <td><span className={`badge badge-${(task.priority || 'medium').toLowerCase().replace('+', 'plus')}`}>{task.priority}</span></td>
                  <td style={{ minWidth: '200px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[...(task.assignedTo || [])].sort((a, b) => {
                        const rA = users.find(u => u.name === a)?.role;
                        const rB = users.find(u => u.name === b)?.role;
                        if (rA === 'sub_incharge' && rB !== 'sub_incharge') return -1;
                        if (rA !== 'sub_incharge' && rB === 'sub_incharge') return 1;
                        return 0;
                      }).map(a => {
                        const subObj = task.subordinateStatuses?.[a] || {};
                        const stat = subObj.status || 'pending';
                        if (task.status === 'fully_completed' && stat === 'pending') return null;
                        
                        const assigneeUser = users.find(u => u.name === a);
                        const roleTag = assigneeUser?.role === 'sub_incharge' ? 'SI' : 'S';
                        return (
                          <div key={a} style={{ fontSize: '0.75rem', padding: '0.35rem', background: 'var(--bg-app)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong>{a} ({roleTag})</strong>
                              <span className={`badge badge-${stat.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{stat.replace(/_/g, ' ')}</span>
                            </div>
                            {subObj.reason && (
                              <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.7rem' }}>"{subObj.reason}"</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <span 
                      className={`badge badge-${(task.status || 'pending')}`}
                      onClick={() => isSupervisory && onUpdateGlobalStatus && onUpdateGlobalStatus(task)}
                      style={{ cursor: isSupervisory ? 'pointer' : 'default' }}
                    >
                      {(task.status || 'pending').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {task.assignedTo?.includes(currentUser?.name) && onUpdateSubordinateStatus && (
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => onUpdateSubordinateStatus(task)}>Update</button>
                      )}
                      {isSupervisory && onForward && (
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => onForward(task)}><Forward size={12}/></button>
                      )}
                      {isSupervisory && currentUser?.role === 'incharge' && onPush && (
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => onPush(task.id)}><BellRing size={12}/></button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getGridTemplate = () => {
    if (viewMode === 'small') return 'repeat(auto-fill, minmax(300px, 1fr))';
    if (viewMode === 'large') return 'repeat(auto-fill, minmax(450px, 1fr))';
    return 'repeat(auto-fill, minmax(380px, 1fr))'; // medium
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search & Top Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flexGrow: 1, maxWidth: '1000px' }}>
            <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search Subject, Letter No, Source..." 
                style={{ paddingLeft: '2.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <Filter size={14} style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }} />
              <select className="form-control" style={{ border: 'none', background: 'transparent' }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                {(config.priorities || []).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              
              <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
              
              <select className="form-control" style={{ border: 'none', background: 'transparent' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {(config.statuses || ['pending', 'partially_done', 'fully_completed', 'resolved', 'closed']).map(statusKey => (
                  <option key={statusKey} value={statusKey}>{statusKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>

              <div style={{ width: '1px', height: '20px', background: 'var(--border)' }}></div>
              
              <select className="form-control" style={{ border: 'none', background: 'transparent' }} value={filterAssignedBy} onChange={(e) => setFilterAssignedBy(e.target.value)}>
                <option value="">All Assigners</option>
                {(config.officers || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '0.25rem', borderRadius: 'var(--radius)' }}>
              {['small', 'medium', 'large'].map(mode => (
                <button 
                  key={mode}
                  className={`btn ${viewMode === mode ? 'btn-primary' : ''}`} 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', background: viewMode === mode ? '' : 'transparent', color: viewMode === mode ? '' : 'var(--text-muted)' }}
                  onClick={() => setViewMode(mode)}
                  title={`${mode} tiles`}
                >
                  <LayoutGrid size={14} />
                </button>
              ))}
              <button 
                className={`btn ${viewMode === 'list' ? 'btn-primary' : ''}`} 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)', background: viewMode === 'list' ? '' : 'transparent', color: viewMode === 'list' ? '' : 'var(--text-muted)' }}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
            
            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => exportToExcel(processedTasks)} title="Export to Excel">
              <FileText size={16} />
            </button>
            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => exportToPDF('task-board-content')} title="Export PDF">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Bottom Sorting Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <strong style={{ color: 'var(--text-muted)' }}>Sort by:</strong>
            <select className="form-control" style={{ width: '200px', padding: '0.25rem 0.5rem' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="deadline-asc">Deadline (Earliest First)</option>
              <option value="deadline-desc">Deadline (Latest First)</option>
              <option value="priority-desc">Priority (Highest First)</option>
              <option value="priority-asc">Priority (Lowest First)</option>
              <option value="received-desc">Received Date (Newest)</option>
              <option value="received-asc">Received Date (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk actions control bar */}
      {enableBulkActions && (
        <div className="card animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', background: 'var(--danger-light)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: 'var(--danger-text)', fontSize: '0.875rem' }}>
              <input 
                type="checkbox" 
                checked={processedTasks.length > 0 && selectedIds.length === processedTasks.length} 
                onChange={() => {
                  if (selectedIds.length === processedTasks.length) {
                    setSelectedIds([]);
                  } else {
                    setSelectedIds(processedTasks.map(t => t.id));
                  }
                }}
                style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer' }}
              />
              Select All Visible ({processedTasks.length})
            </label>
            {selectedIds.length > 0 && (
              <span style={{ fontSize: '0.875rem', color: 'var(--danger-text)', fontWeight: 500 }}>
                {selectedIds.length} Task(s) Selected
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn" 
              style={{ background: 'var(--danger)', color: 'white', opacity: selectedIds.length === 0 ? 0.5 : 1, padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
            <button 
              className="btn btn-outline" 
              style={{ borderColor: 'var(--danger)', color: 'var(--danger-text)', background: 'transparent', padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              onClick={handleResetAll}
            >
              Reset Task List (All)
            </button>
          </div>
        </div>
      )}

      <div id="task-board-content">
        {processedTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No tasks match your filters.</p>
          </div>
        ) : (
          viewMode === 'list' ? renderList() : (
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: getGridTemplate() }}>
              {processedTasks.map(renderCard)}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
