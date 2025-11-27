import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { generateTasks, getStoredApiKey, setStoredApiKey } from '../services/openai';
import { useApp } from '../hooks/useApp';
import type { Project } from '../types';
import './ProjectInput.css';

export function ProjectInput() {
  const [projectIdea, setProjectIdea] = useState('');
  const [apiKey, setApiKey] = useState(getStoredApiKey() || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!getStoredApiKey());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useApp();

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setProjectIdea(transcript);
    }
  }, [transcript]);

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

    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await generateTasks(projectIdea.trim(), apiKey.trim());
      
      // Save API key for future use
      setStoredApiKey(apiKey.trim());
      setShowApiKeyInput(false);

      const newProject: Project = {
        id: crypto.randomUUID(),
        name: projectIdea.trim().slice(0, 50) + (projectIdea.length > 50 ? '...' : ''),
        description: projectIdea.trim(),
        tasks,
        completed: false,
        createdAt: new Date(),
      };

      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      setProjectIdea('');
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
        {showApiKeyInput && (
          <div className="api-key-section">
            <label htmlFor="apiKey" className="input-label">
              OpenAI API Key
              <button
                type="button"
                className="help-btn"
                onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
              >
                ?
              </button>
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="api-key-input"
            />
          </div>
        )}

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

      {!showApiKeyInput && (
        <button
          type="button"
          className="change-api-key-btn"
          onClick={() => setShowApiKeyInput(true)}
        >
          Change API Key
        </button>
      )}
    </div>
  );
}
