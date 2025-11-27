import { useApp } from '../hooks/useApp';
import './ProjectSelector.css';

export function ProjectSelector() {
  const { state, dispatch, activeProject } = useApp();
  const activeProjects = state.projects.filter(p => !p.completed);

  if (activeProjects.length <= 1) {
    return null;
  }

  return (
    <div className="project-selector">
      <label htmlFor="project-select" className="selector-label">
        Current Project:
      </label>
      <select
        id="project-select"
        value={activeProject?.id || ''}
        onChange={(e) => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: e.target.value })}
        className="selector-dropdown"
      >
        {activeProjects.map(project => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}
