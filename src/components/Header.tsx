import './Header.css';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <p className="header-subtitle">AI-powered task planning</p>
    </header>
  );
}
