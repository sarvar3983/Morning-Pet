import type { TabId } from '../lib/types'

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'pet', label: 'My Pet', icon: '🐾' },
  { id: 'league', label: 'League', icon: '🏆' },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

/**
 * Bottom tab bar on mobile, left side rail on md+ screens.
 * Same element, repositioned with responsive classes.
 */
export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur
                 md:inset-y-0 md:left-0 md:right-auto md:w-56 md:border-t-0 md:border-r md:pb-0"
    >
      <div className="hidden px-6 pt-8 pb-6 md:block">
        <span className="text-xl font-extrabold tracking-tight">
          Morning <span className="text-sun-strong">Pet</span>
        </span>
      </div>
      <ul className="mx-auto flex h-(--tabbar-h) max-w-md md:h-auto md:max-w-none md:flex-col md:gap-1 md:px-3">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <li key={tab.id} className="flex-1 md:flex-none">
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-full w-full flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors
                            md:flex-row md:gap-3 md:rounded-2xl md:px-4 md:py-3 md:text-base
                            ${isActive ? 'text-ink md:bg-surface-muted' : 'text-ink-muted hover:text-ink'}`}
              >
                <span
                  aria-hidden
                  className={`grid h-8 w-12 place-items-center rounded-full text-lg transition-colors md:h-auto md:w-auto
                              ${isActive ? 'bg-sun/30 md:bg-transparent' : ''}`}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
