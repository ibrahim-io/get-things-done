import { useApp } from '../hooks/useApp';
import type { TabType } from '../types';
import './TabBar.css';

export function TabBar() {
  const { state, dispatch } = useApp();
  const activeProjects = state.projects.filter(p => !p.completed);
  const completedProjects = state.projects.filter(p => p.completed);

  const handleTabChange = (tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${state.activeTab === 'active' ? 'active' : ''}`}
        onClick={() => handleTabChange('active')}
      >
        Active
        {activeProjects.length > 0 && (
          <span className="tab-badge">{activeProjects.length}</span>
        )}
      </button>
      <button
        className={`tab-btn ${state.activeTab === 'gantt' ? 'active' : ''}`}
        onClick={() => handleTabChange('gantt')}
      >
        Gantt
      </button>
      <button
        className={`tab-btn ${state.activeTab === 'completed' ? 'active' : ''}`}
        onClick={() => handleTabChange('completed')}
      >
        Completed
        {completedProjects.length > 0 && (
          <span className="tab-badge completed">{completedProjects.length}</span>
        )}
      </button>
    </div>
  );
}
