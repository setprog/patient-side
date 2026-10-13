import * as React from "react"
import { D, PLAN, initialState, todayKey, TASKS, type Metric, type Route, type State, type Task } from "@/data"

const KEY = "carepath-patient-v3"
export type Tab = "home" | "plan" | "track" | "messages" | "profile"

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.v === 3) {
        if (s.taskDay !== todayKey()) { s.tasks = TASKS().map(t => ({ ...t, st: "todo" })); s.taskDay = todayKey() }
        if (!s.remember) s.loggedIn = false
        return s
      }
    }
  } catch { /* storage unavailable */ }
  return initialState()
}

type Ctx = {
  s: State
  update: (fn: (d: State) => void) => void
  tab: Tab
  route: Route
  depth: number
  go: (name: string, p?: Record<string, any>) => void
  replace: (name: string, p?: Record<string, any>) => void
  back: () => void
  setTab: (t: Tab) => void
  reset: () => void
}
const StoreCtx = React.createContext<Ctx>(null as any)
export const useStore = () => React.useContext(StoreCtx)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = React.useState<State>(load)
  const [tab, setTabState] = React.useState<Tab>("home")
  const [stack, setStack] = React.useState<Route[]>([])
  const update = React.useCallback((fn: (d: State) => void) => setS(prev => { const d = structuredClone(prev); fn(d); return d }), [])
  React.useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ } }, [s])
  const top = () => window.scrollTo(0, 0)
  const value: Ctx = {
    s, update, tab,
    route: stack.length ? stack[stack.length - 1] : { name: tab },
    depth: stack.length,
    go: (name, p) => { setStack(st => [...st, { name, p }]); top() },
    replace: (name, p) => { setStack(st => [...st.slice(0, -1), { name, p }]); top() },
    back: () => { setStack(st => st.slice(0, -1)); top() },
    setTab: t => { setTabState(t); setStack([]); top() },
    reset: () => { try { localStorage.removeItem(KEY) } catch { /* ignore */ } const f = initialState(); f.loggedIn = true; setS(f); setStack([]); setTabState("home") },
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

/* ---------- derived values ---------- */
export const last = (s: State, m: Metric) => s.readings[m][s.readings[m].length - 1]
export const prev = (s: State, m: Metric) => s.readings[m][s.readings[m].length - 2]
export const unreadMsgs = (s: State) => s.msgs.filter(m => m.from === "dr" && !m.read).length + (s.groupRead ? 0 : 1)
export const unreadNotifs = (s: State) => s.notifs.filter(n => !n.read).length
export function progress(s: State) { const t = s.tasks.length, d = s.tasks.filter(x => x.st === "done").length; return { t, d, p: Math.round(d / t * 100) } }
export function weekStart() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return +d }
export const weekEx = (s: State) => s.exLogs.filter(x => x.t >= weekStart() && x.st !== "Skipped" && (x.ex === "e1" || x.ex === "e2"))
export function markTask(d: State, pred: (t: Task) => boolean, st: Task["st"] = "done") { const t = d.tasks.find(pred); if (t && t.st !== "done") t.st = st }

export function goals(s: State) {
  const w = last(s, "weight").v, start = 78.6, target = 70
  const we = weekEx(s).length
  const wk = s.readings.bp.filter(r => r.t >= Date.now() - 7 * D)
  const avgS = Math.round(wk.reduce((a, r) => a + r.v, 0) / Math.max(1, wk.length))
  const avgD = Math.round(wk.reduce((a, r) => a + (r.v2 || 0), 0) / Math.max(1, wk.length))
  const days = Math.round((Date.now() - weekStart()) / D) + 1
  const expected = Math.min(21, days * 3)
  const ml = s.meals.filter(m => m.t >= weekStart() && m.type !== "Snack").length
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  return [
    { name: "Reach a healthy weight", icon: "scale", cur: w.toFixed(1) + " kg", target: target + " kg", due: "Dec 30", p: clamp((start - w) / (start - target) * 100) },
    { name: "Exercise 4 times a week", icon: "run", cur: we + " of 4 this week", target: "4 sessions", due: "Every week", p: clamp(we * 25) },
    { name: "Blood pressure below 130/80", icon: "heart", cur: `${avgS}/${avgD} avg (7 days)`, target: "130/80", due: "Dec 30", p: clamp((145 - avgS) / 15 * 100) },
    { name: "Log every main meal", icon: "meal", cur: `${ml} of ${expected} this week`, target: "21 meals", due: "Every week", p: clamp(ml / expected * 100) },
  ]
}
export const planName = PLAN.name
