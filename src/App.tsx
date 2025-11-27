import { AppProvider } from './context/AppContext';
import { useApp } from './hooks/useApp';
import {
  Header,
  ProjectInput,
  ProjectList,
  FocusMode,
  CompletedTab,
  TabBar,
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
          <ProjectList />
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
