import * as React from "react"
import { ClipboardListIcon, HouseIcon, ActivityIcon, MessageCircleIcon, UserIcon } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { CountDot } from "@/components/app-parts"
import { StoreProvider, unreadMsgs, useStore, type Tab } from "@/store"
import { Home, Login, Today } from "@/screens/home"
import { Goals, Plan } from "@/screens/plan"
import { ExerciseScreen, Health, Meals, Track } from "@/screens/track"
import { AddMeal, AddReading, Checkin, CheckinDone, LogExercise } from "@/screens/forms"
import { Chat, Group, Messages, Notifs, Profile } from "@/screens/social"
import { cn } from "@/lib/utils"

const SCREENS: Record<string, React.ComponentType<{ p?: any }>> = {
  home: Home, plan: Plan, track: Track, messages: Messages, profile: Profile,
  today: Today, goals: Goals, meals: Meals, health: Health, exercise: ExerciseScreen,
  addMeal: AddMeal, addReading: AddReading, logEx: LogExercise, checkin: Checkin, checkinDone: CheckinDone,
  chat: Chat, group: Group, notifs: Notifs,
}
const TABS: [Tab, string, React.ComponentType<{ className?: string }>][] = [
  ["home", "Home", HouseIcon], ["plan", "Plan", ClipboardListIcon], ["track", "Track", ActivityIcon], ["messages", "Messages", MessageCircleIcon], ["profile", "Profile", UserIcon],
]

function BottomNav() {
  const { s, tab, setTab } = useStore()
  const nm = unreadMsgs(s)
  return (
    <nav aria-label="Main" className="bg-card fixed bottom-0 left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 border-t px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom,0px))]">
      {TABS.map(([k, l, I]) => (
        <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}
          className={cn("focus-visible:ring-ring/50 flex flex-1 flex-col items-center gap-0.5 rounded-md py-1 text-xs font-bold outline-none focus-visible:ring-[3px]", tab === k ? "text-primary" : "text-muted-foreground")}>
          <span className={cn("relative grid place-items-center rounded-full px-4.5 py-1", tab === k && "bg-accent")}>
            <I className="size-6" />{k === "messages" && nm > 0 && <CountDot n={nm} className="-top-0.5 right-1.5" />}
          </span>
          {l}
        </button>
      ))}
    </nav>
  )
}

function Shell() {
  const { s, route } = useStore()
  if (!s.loggedIn) return <><Login /><Toaster position="bottom-center" /></>
  const Screen = SCREENS[route.name] || Home
  return (
    <div className="relative mx-auto min-h-full max-w-[480px] pb-24">
      <Screen key={route.name + JSON.stringify(route.p || {})} p={route.p} />
      {route.name !== "chat" && <BottomNav />}
      <Toaster position="bottom-center" offset={{ bottom: 96 }} mobileOffset={{ bottom: 96 }} />
    </div>
  )
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>
}
