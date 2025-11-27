import { useApp } from '../hooks/useApp';
import type { Project } from '../types';
import './CompletedTab.css';

interface CompletedProjectProps {
  project: Project;
}

function CompletedProject({ project }: CompletedProjectProps) {
  const { dispatch } = useApp();
  const completedTasks = project.tasks.filter(t => t.completed);
  const totalTasks = project.tasks.length;

  const handleReopen = () => {
    dispatch({ type: 'REOPEN_PROJECT', payload: project.id });
    dispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'active' });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      dispatch({ type: 'DELETE_PROJECT', payload: project.id });
    }
  };

  return (
    <div className="completed-project">
      <div className="completed-project-header">
        <h3 className="completed-project-title">{project.name}</h3>
        <span className="completed-project-date">
          {project.completedAt?.toLocaleDateString()}
        </span>
      </div>

      <div className="completed-project-stats">
        <span className="stat-badge">
          ✓ {completedTasks.length}/{totalTasks} tasks
        </span>
      </div>

      <div className="completed-tasks-preview">
        {project.tasks.slice(0, 3).map(task => (
          <div key={task.id} className="completed-task-preview">
            <span className={`preview-checkbox ${task.completed ? 'checked' : ''}`}>
              {task.completed ? '✓' : '○'}
            </span>
            <span className="preview-title">{task.title}</span>
          </div>
        ))}
        {project.tasks.length > 3 && (
          <p className="more-tasks">+{project.tasks.length - 3} more tasks</p>
        )}
      </div>

      <div className="completed-project-actions">
        <button className="reopen-btn" onClick={handleReopen}>
          Reopen Project
        </button>
        <button className="delete-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function CompletedTab() {
  const { state } = useApp();
  const completedProjects = state.projects.filter(p => p.completed);

  if (completedProjects.length === 0) {
    return (
      <div className="completed-tab">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No completed projects yet</h3>
          <p>Complete your first project to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="completed-tab">
      <h2 className="completed-tab-title">Completed Projects</h2>
      <div className="completed-projects-list">
        {completedProjects.map(project => (
          <CompletedProject key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
