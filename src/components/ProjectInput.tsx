import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { generateTasks } from '../services/openai';
import { useApp } from '../hooks/useApp';
import type { Project, Priority } from '../types';
import './ProjectInput.css';

export function ProjectInput() {
  const [projectIdea, setProjectIdea] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useApp();

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    // Combine final transcript with interim for display
    const fullTranscript = transcript + interimTranscript;
    if (fullTranscript) {
      setProjectIdea(fullTranscript);
    }
  }, [transcript, interimTranscript]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectIdea.trim()) {
      setError('Please enter a project idea');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await generateTasks(projectIdea.trim());
      
      const newProject: Project = {
        id: crypto.randomUUID(),
        name: projectIdea.trim().slice(0, 50) + (projectIdea.length > 50 ? '...' : ''),
        description: projectIdea.trim(),
        tasks,
        completed: false,
        createdAt: new Date(),
        priority,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      setProjectIdea('');
      setPriority('medium');
      setStartDate('');
      setEndDate('');
      resetTranscript();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="project-input">
      <form onSubmit={handleSubmit}>
        <div className="idea-section">
          <label htmlFor="projectIdea" className="input-label">
            What's your project idea?
          </label>
          <div className="textarea-wrapper">
            <textarea
              id="projectIdea"
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              placeholder="Describe your project in natural language... (e.g., 'Build a personal portfolio website with React')"
              className="idea-textarea"
              rows={4}
              disabled={isLoading}
            />
            {isSupported && (
              <button
                type="button"
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceToggle}
                disabled={isLoading}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                {isListening ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </button>
            )}
          </div>
          {isListening && (
            <p className="listening-indicator">
              <span className="pulse"></span>
              Listening...
            </p>
          )}
        </div>

        <div className="details-section">
          <div className="form-group">
            <label htmlFor="priority" className="input-label">
              Priority <span className="optional-text">(Optional)</span>
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="select-input"
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate" className="input-label">
              Start Date <span className="optional-text">(Optional)</span>
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate" className="input-label">
              End Date <span className="optional-text">(Optional)</span>
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading || !projectIdea.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Generating Tasks...
            </>
          ) : (
            'Generate GTD Checklist'
          )}
        </button>
      </form>
    </div>
  );
}
