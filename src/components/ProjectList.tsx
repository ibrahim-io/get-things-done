import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { TaskList } from './TaskList';
import type { Priority, Project } from '../types';
import './ProjectList.css';

const ITEMS_PER_PAGE = 5;

export function ProjectList() {
  const { state, dispatch } = useApp();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState<Priority | undefined>(undefined);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const activeProjects = state.projects.filter(p => !p.completed);
  const totalPages = Math.ceil(activeProjects.length / ITEMS_PER_PAGE);
  
  const paginatedProjects = activeProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleProject = (projectId: string) => {
    if (editingProjectId === projectId) return; // Don't toggle if editing
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const startEditing = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditPriority(project.priority);
    setEditStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
    setEditEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(null);
  };

  const saveEditing = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!editName.trim()) return;

    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        projectId,
        updates: {
          name: editName.trim(),
          priority: editPriority,
          startDate: editStartDate ? new Date(editStartDate) : undefined,
          endDate: editEndDate ? new Date(editEndDate) : undefined,
        },
      },
    });
    setEditingProjectId(null);
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    }
  };

  const getPriorityColor = (priority?: Priority) => {
    switch (priority) {
      case 'high': return 'var(--error-color)';
      case 'medium': return '#f59e0b'; // Amber
      case 'low': return 'var(--success-color)';
      default: return 'transparent';
    }
  };

  if (activeProjects.length === 0) {
    return null;
  }

  return (
    <div className="project-list">
      {paginatedProjects.map(project => (
        <div key={project.id} className="project-item">
          <div 
            className="project-header" 
            onClick={() => toggleProject(project.id)}
          >
            {editingProjectId === project.id ? (
              <div className="edit-form" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="edit-input"
                  placeholder="Project Name"
                />
                <select
                  value={editPriority || ''}
                  onChange={e => setEditPriority(e.target.value as Priority || undefined)}
                  className="edit-select"
                >
                  <option value="">No Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="edit-date"
                    aria-label="Start Date"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="edit-date"
                    aria-label="End Date"
                  />
                </div>
                <div className="edit-actions">
                  <button onClick={e => saveEditing(e, project.id)} className="save-btn">Save</button>
                  <button onClick={cancelEditing} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="project-info">
                  <svg 
                    className={`toggle-icon ${expandedProjects.has(project.id) ? 'expanded' : ''}`}
                    viewBox="0 0 24 24" 
                    width="24" 
                    height="24" 
                    fill="currentColor"
                  >
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                  <div className="project-title-wrapper">
                    <h3 className="project-name">{project.name}</h3>
                    <div className="project-badges">
                      {project.priority && (
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(project.priority) }}
                        >
                          {project.priority}
                        </span>
                      )}
                      {(project.startDate || project.endDate) && (
                        <span className="date-badge">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : '...'} 
                          {' - '}
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : '...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="project-meta">
                  <span className="task-count">
                    {project.tasks.filter(t => !t.completed).length} tasks
                  </span>
                  <button 
                    className="edit-btn"
                    onClick={(e) => startEditing(e, project)}
                    aria-label="Edit project"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, project.id)}
                    aria-label="Delete project"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {expandedProjects.has(project.id) && !editingProjectId && (
            <div className="project-content">
              <TaskList project={project} />
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
