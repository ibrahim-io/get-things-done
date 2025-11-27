import { useApp } from '../hooks/useApp';
import './FocusMode.css';

export function FocusMode() {
  const { state, dispatch, activeProject } = useApp();

  if (!activeProject) return null;

  const incompleteTasks = activeProject.tasks.filter(t => !t.completed);
  const currentTask = incompleteTasks[state.currentTaskIndex];
  const totalTasks = incompleteTasks.length;
  const completedCount = activeProject.tasks.filter(t => t.completed).length;

  const handleComplete = () => {
    if (currentTask) {
      dispatch({
        type: 'COMPLETE_TASK',
        payload: { projectId: activeProject.id, taskId: currentTask.id },
      });
      
      // If this was the last task, exit focus mode
      if (totalTasks === 1) {
        dispatch({ type: 'SET_FOCUS_MODE', payload: false });
      } else if (state.currentTaskIndex >= totalTasks - 1) {
        // If we're at the end, stay at the new last position
        dispatch({ type: 'SET_CURRENT_TASK_INDEX', payload: Math.max(0, state.currentTaskIndex - 1) });
      }
    }
  };

  const handleNext = () => {
    if (state.currentTaskIndex < totalTasks - 1) {
      dispatch({ type: 'NEXT_TASK' });
    }
  };

  const handlePrev = () => {
    if (state.currentTaskIndex > 0) {
      dispatch({ type: 'PREV_TASK' });
    }
  };

  const handleExit = () => {
    dispatch({ type: 'SET_FOCUS_MODE', payload: false });
  };

  if (totalTasks === 0) {
    return (
      <div className="focus-mode">
        <div className="focus-mode-content">
          <div className="focus-complete">
            <div className="focus-complete-icon">🎉</div>
            <h2>All Done!</h2>
            <p>You've completed all tasks in this project.</p>
            <button className="focus-exit-btn" onClick={handleExit}>
              Exit Focus Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-mode">
      <button className="focus-close-btn" onClick={handleExit} aria-label="Exit focus mode">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <div className="focus-mode-content">
        <div className="focus-progress">
          <div className="progress-text">
            Task {state.currentTaskIndex + 1} of {totalTasks}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(completedCount / activeProject.tasks.length) * 100}%` }}
            />
          </div>
          <div className="progress-completed">
            {completedCount} of {activeProject.tasks.length} completed
          </div>
        </div>

        <div className="focus-task">
          <h2 className="focus-task-title">{currentTask.title}</h2>
          {currentTask.description && (
            <p className="focus-task-description">{currentTask.description}</p>
          )}
        </div>

        <div className="focus-actions">
          <button
            className="focus-nav-btn prev"
            onClick={handlePrev}
            disabled={state.currentTaskIndex === 0}
            aria-label="Previous task"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          <button className="focus-complete-btn" onClick={handleComplete}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Complete Task
          </button>

          <button
            className="focus-nav-btn next"
            onClick={handleNext}
            disabled={state.currentTaskIndex === totalTasks - 1}
            aria-label="Next task"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>

        <p className="focus-hint">
          Complete this task, then move to the next one
        </p>
      </div>
    </div>
  );
}
