import Link from "next/link";

export function TopNav() {
  return (
    <header className="border-b border-rule bg-bg/80 backdrop-blur-md sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-baseline gap-3 group">
          <span className="font-display text-[22px] font-medium tracking-tight text-ink group-hover:text-accent transition-colors">
            摄影历
          </span>
          <span className="font-display text-[11px] tracking-[0.18em] uppercase text-ink-3">
            Photography History
          </span>
        </Link>

        <div className="flex-1" />

        <SearchButton />

        <button
          type="button"
          aria-label="语言切换"
          className="text-ink-2 hover:text-ink transition-colors p-2 -m-2"
          title="语言切换 · Language (coming soon)"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3a14 14 0 010 18" />
            <path d="M12 3a14 14 0 000 18" />
          </svg>
        </button>

        <Link
          href="/about"
          className="text-ink-2 hover:text-ink transition-colors p-2 -m-2"
          aria-label="关于"
          title="关于"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

function SearchButton() {
  return (
    <button
      type="button"
      className="hidden sm:flex items-center gap-2 px-3 h-8 border border-rule hover:border-rule-2 text-ink-2 hover:text-ink text-sm transition-colors group"
      aria-label="搜索"
      title="搜索 (Ctrl+K)"
    >
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7.5" />
        <path d="M21 21l-4.5-4.5" />
      </svg>
      <span>搜索摄影师 / 流派</span>
      <kbd className="ml-2 font-mono text-[10px] text-ink-3 border border-rule px-1.5 py-0.5">
        ⌘K
      </kbd>
    </button>
  );
}
