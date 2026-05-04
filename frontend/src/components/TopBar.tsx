import { Wordmark } from "./Wordmark";

function GithubMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .297a12 12 0 0 0-3.793 23.39c.6.111.82-.26.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.547-1.387-1.336-1.756-1.336-1.756-1.092-.745.083-.73.083-.73 1.205.084 1.84 1.236 1.84 1.236 1.072 1.835 2.812 1.305 3.498.998.108-.776.42-1.306.762-1.606-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.124-.303-.535-1.523.118-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 6.005 0c2.29-1.552 3.297-1.23 3.297-1.23.654 1.653.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.62-5.48 5.92.43.37.812 1.103.812 2.222v3.293c0 .32.218.694.825.576A12.001 12.001 0 0 0 12 .297" />
    </svg>
  );
}

export function TopBar() {
  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-line/50">
      <Wordmark />
      <a
        href="https://github.com/anmolgautam/disco"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View source on GitHub"
        className="text-ink-muted hover:text-ink transition-colors duration-150"
      >
        <GithubMark />
      </a>
    </header>
  );
}
