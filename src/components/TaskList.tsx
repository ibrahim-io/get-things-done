import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import type { Task } from '../types';
import './TaskList.css';

interface TaskItemProps {
  task: Task;
  projectId: string;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  index: number;
}

function TaskItem({ task, projectId, onDragStart, onDragOver, onDrop, index }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const { dispatch } = useApp();

  const handleToggle = () => {
    if (task.completed) {
      dispatch({ type: 'UNCOMPLETE_TASK', payload: { projectId, taskId: task.id } });
    } else {
      dispatch({ type: 'COMPLETE_TASK', payload: { projectId, taskId: task.id } });
    }
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { projectId, taskId: task.id, updates: { title: editTitle.trim() } },
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''}`}
      draggable={!task.completed}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
    >
      <div className="task-checkbox-wrapper">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          className="task-checkbox"
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
      </div>
      
      <div className="task-content">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="task-edit-input"
            autoFocus
          />
        ) : (
          <>
            <span className="task-title" onClick={() => !task.completed && setIsEditing(true)}>
              {task.title}
            </span>
            {task.description && (
              <span className="task-description">{task.description}</span>
            )}
          </>
        )}
      </div>

      {!task.completed && (
        <div className="task-drag-handle" aria-label="Drag to reorder">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export function TaskList() {
  const { dispatch, activeProject } = useApp();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!activeProject) {
    return (
      <div className="task-list-empty">
        <p>No active project. Create one above!</p>
      </div>
    );
  }

  const incompleteTasks = activeProject.tasks.filter(t => !t.completed);
  const completedTasks = activeProject.tasks.filter(t => t.completed);
  const allComplete = incompleteTasks.length === 0 && completedTasks.length > 0;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newTasks = [...incompleteTasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    // Update order and merge with completed tasks
    const reorderedTasks = [
      ...newTasks.map((t, i) => ({ ...t, order: i })),
      ...completedTasks,
    ];

    dispatch({
      type: 'REORDER_TASKS',
      payload: { projectId: activeProject.id, tasks: reorderedTasks },
    });
    setDraggedIndex(null);
  };

  const handleCompleteProject = () => {
    dispatch({ type: 'COMPLETE_PROJECT', payload: activeProject.id });
  };

  const handleEnterFocusMode = () => {
    dispatch({ type: 'SET_FOCUS_MODE', payload: true });
    dispatch({ type: 'SET_CURRENT_TASK_INDEX', payload: 0 });
  };

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h2 className="project-title">{activeProject.name}</h2>
        <div className="task-list-actions">
          {incompleteTasks.length > 0 && (
            <button className="focus-mode-btn" onClick={handleEnterFocusMode}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
              Focus Mode
            </button>
          )}
        </div>
      </div>

      {allComplete ? (
        <div className="all-complete">
          <div className="all-complete-icon">🎉</div>
          <h3>All tasks completed!</h3>
          <p>Great job finishing this project.</p>
          <button className="complete-project-btn" onClick={handleCompleteProject}>
            Mark Project Complete
          </button>
        </div>
      ) : (
        <>
          <div className="task-section">
            <h3 className="section-title">
              To Do ({incompleteTasks.length})
            </h3>
            {incompleteTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                projectId={activeProject.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                index={index}
              />
            ))}
          </div>

          {completedTasks.length > 0 && (
            <div className="task-section">
              <h3 className="section-title completed-title">
                Completed ({completedTasks.length})
              </h3>
              {completedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  projectId={activeProject.id}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  index={index}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
