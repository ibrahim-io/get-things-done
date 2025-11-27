import { AppProvider } from './context/AppContext';
import { useApp } from './hooks/useApp';
import {
  Header,
  ProjectInput,
  TaskList,
  FocusMode,
  CompletedTab,
  TabBar,
  ProjectSelector,
} from './components';
import './App.css';

function AppContent() {
  const { state, activeProject } = useApp();

  if (state.focusMode && activeProject) {
    return <FocusMode />;
  }

  return (
    <div className="app">
      <Header title="Get Things Done" />
      <TabBar />
      
      {state.activeTab === 'active' ? (
        <>
          <ProjectInput />
          <ProjectSelector />
          {activeProject && <TaskList />}
        </>
      ) : (
        <CompletedTab />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
