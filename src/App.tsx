import { useEffect, useState } from 'react'
import { TabBar, TABS } from './components/TabBar'
import type { TabId } from './lib/types'
import { LeagueScreen } from './screens/LeagueScreen'
import { MyPetScreen } from './screens/MyPetScreen'
import { TodayScreen } from './screens/TodayScreen'
import { ProgressProvider } from './state/ProgressContext'

function tabFromHash(): TabId {
  const id = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === id) ? (id as TabId) : 'today'
}

/** Hash-based tabs (#today, #pet, #league): back button and deep links work with no router dependency. */
function useHashTab() {
  const [tab, setTab] = useState<TabId>(tabFromHash)
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = (next: TabId) => {
    if (next !== tab) window.location.hash = next
    window.scrollTo({ top: 0 })
  }
  return [tab, go] as const
}

export default function App() {
  const [tab, setTab] = useHashTab()

  return (
    <ProgressProvider>
      <TabBar active={tab} onChange={setTab} />
      <div className="md:pl-56">
        <main className="mx-auto max-w-xl px-4 pt-6 pb-28 md:max-w-2xl md:px-10 md:pt-10 md:pb-10">
          {tab === 'today' && <TodayScreen />}
          {tab === 'pet' && <MyPetScreen />}
          {tab === 'league' && <LeagueScreen />}
        </main>
      </div>
    </ProgressProvider>
  )
}
