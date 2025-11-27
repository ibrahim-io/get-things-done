import { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import type { Project, Priority } from '../types';
import './ProjectGantt.css';

function getPriorityColor(priority?: Priority): string {
  switch (priority) {
    case 'high': return 'var(--gantt-high, #ef4444)';
    case 'medium': return 'var(--gantt-medium, #f59e0b)';
    case 'low': return 'var(--gantt-low, #22c55e)';
    default: return 'var(--primary-color)';
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

interface GanttBarProps {
  project: Project;
  minDate: Date;
  maxDate: Date;
  totalDays: number;
}

function GanttBar({ project, minDate, totalDays }: GanttBarProps) {
  const startDate = new Date(project.startDate!);
  const endDate = new Date(project.endDate!);
  
  const startOffset = Math.floor((startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const leftPercent = (startOffset / totalDays) * 100;
  const widthPercent = (duration / totalDays) * 100;

  const completedTasks = project.tasks.filter(t => t.completed).length;
  const totalTasks = project.tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="gantt-row">
      <div className="gantt-label">
        <span className="gantt-project-name" title={project.name}>
          {project.name}
        </span>
        <span className="gantt-progress-text">
          {completedTasks}/{totalTasks}
        </span>
      </div>
      <div className="gantt-timeline">
        <div 
          className="gantt-bar"
          style={{ 
            left: `${leftPercent}%`, 
            width: `${widthPercent}%`,
            backgroundColor: getPriorityColor(project.priority)
          }}
          title={`${project.name}: ${formatDate(startDate)} - ${formatDate(endDate)}`}
        >
          <div 
            className="gantt-bar-progress"
            style={{ width: `${progressPercent}%` }}
          />
          <span className="gantt-bar-text">
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProjectGantt() {
  const { state } = useApp();
  
  const projectsWithDates = useMemo(() => {
    return state.projects.filter(
      p => !p.completed && p.startDate && p.endDate
    );
  }, [state.projects]);

  const { minDate, maxDate, totalDays, monthMarkers } = useMemo(() => {
    if (projectsWithDates.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), totalDays: 1, monthMarkers: [] };
    }

    let min = new Date(projectsWithDates[0].startDate!);
    let max = new Date(projectsWithDates[0].endDate!);

    projectsWithDates.forEach(p => {
      const start = new Date(p.startDate!);
      const end = new Date(p.endDate!);
      if (start < min) min = start;
      if (end > max) max = end;
    });

    // Add buffer
    min = addDays(min, -7);
    max = addDays(max, 7);

    const total = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

    // Generate month markers
    const markers: { label: string; position: number }[] = [];
    const current = new Date(min);
    current.setDate(1); // Start of month
    
    while (current <= max) {
      const dayOffset = Math.floor((current.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
      if (dayOffset >= 0) {
        markers.push({
          label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          position: (dayOffset / total) * 100
        });
      }
      current.setMonth(current.getMonth() + 1);
    }

    return { minDate: min, maxDate: max, totalDays: total, monthMarkers: markers };
  }, [projectsWithDates]);

  if (projectsWithDates.length === 0) {
    return (
      <div className="gantt-empty">
        <div className="gantt-empty-icon">📅</div>
        <h3>No projects with dates</h3>
        <p>Add start and end dates to your projects to see them in the Gantt view.</p>
        <p className="gantt-empty-hint">
          You can add dates when creating a new project or by editing an existing one.
        </p>
      </div>
    );
  }

  return (
    <div className="project-gantt">
      <div className="gantt-header">
        <div className="gantt-label-header">Project</div>
        <div className="gantt-timeline-header">
          {monthMarkers.map((marker, i) => (
            <div 
              key={i} 
              className="gantt-month-marker"
              style={{ left: `${marker.position}%` }}
            >
              {marker.label}
            </div>
          ))}
        </div>
      </div>
      <div className="gantt-body">
        {projectsWithDates.map(project => (
          <GanttBar
            key={project.id}
            project={project}
            minDate={minDate}
            maxDate={maxDate}
            totalDays={totalDays}
          />
        ))}
      </div>
    </div>
  );
}
