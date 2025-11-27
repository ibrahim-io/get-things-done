# Get Things Done

A React + TypeScript web app that uses OpenAI to auto-generate GTD-style (Getting Things Done) task checklists from natural language project ideas.

![Main Screen](https://github.com/user-attachments/assets/f70c2248-37e6-430e-ad3d-c58538300d73)

## Features

- **AI-Powered Task Generation**: Enter a project idea in natural language and get an actionable GTD-style checklist
- **Focus Mode**: View one task at a time with "Next Task" navigation for distraction-free work
- **Task Management**: Edit task titles, reorder tasks via drag-and-drop, mark tasks complete/incomplete
- **Voice Input**: Optional speech-to-text input using Web Speech API
- **Completed Projects Tab**: View finished projects and their tasks, with ability to reopen
- **Mobile-Friendly UI**: Minimalist, responsive design that works on all devices
- **Persistent Storage**: Projects and tasks are saved to localStorage

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. Enter your OpenAI API key (stored locally in browser)
2. Describe your project idea in natural language
3. Click "Generate GTD Checklist" to create actionable tasks
4. Use Focus Mode to work through tasks one at a time
5. Mark tasks complete as you finish them
6. View completed projects in the "Completed" tab

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **OpenAI API** - Task generation
- **Web Speech API** - Voice input
- **CSS3** - Styling (no external UI library)

## Project Structure

```
src/
├── components/       # React components
├── context/          # App state management
├── hooks/            # Custom React hooks
├── services/         # API and storage services
├── types/            # TypeScript type definitions
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## License

MIT
