
export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7 shrink-0 text-primary"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        <path d="M10 10.5v-2a2 2 0 1 1 4 0v2" />
        <path d="M10 10.5a2 2 0 1 0 4 0" />
        <circle cx="12" cy="14.5" r="1.5" fill="currentColor" strokeWidth="0" />
      </svg>
      <h1 className="font-headline text-xl font-semibold tracking-tight">
        Anony Trading
      </h1>
    </div>
  );
}
