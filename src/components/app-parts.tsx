import * as React from "react"
import {
  ActivityIcon, BellIcon, CircleHelpIcon, LockIcon, ShieldCheckIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardCheckIcon, ClipboardListIcon, DropletIcon,
  FootprintsIcon, HeartIcon, HeartPulseIcon, HouseIcon, MessageCircleIcon, MoonIcon, ScaleIcon, SunIcon, TargetIcon, UserIcon, UsersIcon, UtensilsIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { M, fDate, needsReview, type Meal, type Metric, type Reading, type Task } from "@/data"
import { unreadNotifs, useStore } from "@/store"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scale: ScaleIcon, heart: HeartIcon, drop: DropletIcon, pulse: HeartPulseIcon, meal: UtensilsIcon, run: FootprintsIcon,
  clip: ClipboardCheckIcon, chat: MessageCircleIcon, group: UsersIcon, plan: ClipboardListIcon, target: TargetIcon, activity: ActivityIcon,
  home: HouseIcon, user: UserIcon, lock: LockIcon, shield: ShieldCheckIcon, help: CircleHelpIcon,
}
export const METRIC_ICON: Record<Metric, string> = { weight: "scale", bp: "heart", glucose: "drop", hr: "pulse" }
export function Ico({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] || ActivityIcon
  return <C className={className} />
}
export function IconTile({ name, className }: { name: string; className?: string }) {
  return <span className={cn("bg-accent text-accent-foreground grid size-10 shrink-0 place-items-center rounded-lg", className)}><Ico name={name} className="size-5" /></span>
}

export function ThemeButton() {
  const { theme, setTheme } = useTheme()
  const sys = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches
  const dark = theme === "dark" || (theme === "system" && sys)
  return (
    <Button variant="outline" size="icon" className="rounded-full" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </Button>
  )
}

export function BellButton() {
  const { s, go } = useStore()
  const n = unreadNotifs(s)
  return (
    <Button variant="outline" size="icon" className="relative rounded-full" aria-label={`Notifications${n ? `, ${n} unread` : ""}`} onClick={() => go("notifs")}>
      <BellIcon className="size-5" />
      {n > 0 && <CountDot n={n} />}
    </Button>
  )
}
export const CountDot = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn("bg-destructive text-white absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold", className)}>{n}</span>
)

export function TopBar({ title, back, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  const { back: goBack } = useStore()
  return (
    <header className="bg-background sticky top-[env(safe-area-inset-top,0px)] z-20 flex items-center gap-2 px-4 pt-3.5 pb-2.5 backdrop-blur">
      {back && <Button variant="outline" size="icon" className="rounded-full" aria-label="Back" onClick={goBack}><ChevronLeftIcon className="size-5" /></Button>}
      <h1 className="min-w-0 flex-1 truncate text-xl">{title}</h1>
      {right === undefined ? <BellButton /> : right}
    </header>
  )
}

export const Screen = ({ className, ...props }: React.ComponentProps<"div">) => <div className={cn("flex flex-col gap-5 px-4 pt-1 pb-6", className)} {...props} />
export const Section = ({ title, action, children, className }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={cn("flex flex-col gap-2.5", className)}>
    <div className="flex items-baseline justify-between gap-2"><h2 className="text-[1.1rem]">{title}</h2>{action}</div>
    {children}
  </section>
)
export function Field({ label, htmlFor, hint, optional, children }: { label: string; htmlFor?: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 min-w-0">
      <Label htmlFor={htmlFor} className="text-[0.95rem] font-bold">{label}{optional && <span className="text-muted-foreground font-normal">(optional)</span>}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
    </div>
  )
}
export function Unit({ unit, children }: { unit: string; children: React.ReactNode }) {
  return <div className="relative [&_input]:pr-16">{children}<span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold">{unit}</span></div>
}

export function MealStatus({ status }: { status: Meal["status"] }) {
  if (status === "pending") return <Badge variant="warning">Waiting for review</Badge>
  if (status === "good") return <Badge variant="success">Good choice</Badge>
  if (status === "improve") return <Badge variant="danger">Needs improvement</Badge>
  return <Badge variant="secondary">Reviewed</Badge>
}

export function TaskRow({ t, onOpen }: { t: Task; onOpen: (t: Task) => void }) {
  const { update } = useStore()
  const done = t.st === "done"
  return (
    <div className="flex items-center gap-3 py-3 [&+&]:border-t">
      <button
        type="button" role="checkbox" aria-checked={done}
        aria-label={`${done ? "Mark not done" : "Mark done"}: ${t.label}`}
        onClick={() => update(d => { const x = d.tasks.find(y => y.id === t.id)!; x.st = x.st === "done" ? "todo" : "done" })}
        className={cn("focus-visible:ring-ring/50 grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors outline-none focus-visible:ring-[3px]",
          done ? "bg-success border-success text-white" : "border-input text-transparent", t.st === "skipped" && "border-dashed")}
      >
        <CheckIcon className="size-5" strokeWidth={3} />
      </button>
      <button type="button" onClick={() => onOpen(t)} className="focus-visible:ring-ring/50 min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-[3px]">
        <span className={cn("block font-bold", done && "text-muted-foreground line-through")}>{t.label}</span>
        {t.st === "skipped" ? <span className="text-muted-foreground text-sm">Skipped today</span> : t.sub && <span className="text-muted-foreground block truncate text-sm">{t.sub}</span>}
      </button>
      <span className="text-muted-foreground shrink-0 text-sm tabular-nums">{t.time}</span>
      <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
    </div>
  )
}

export function ListRow({ icon, title, sub, onClick, right }: { icon: string; title: React.ReactNode; sub?: React.ReactNode; onClick?: () => void; right?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="hover:bg-muted/60 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-md px-1 py-3 text-left outline-none focus-visible:ring-[3px] [&+&]:border-t [&+&]:rounded-none">
      <IconTile name={icon} />
      <span className="min-w-0 flex-1"><b className="block">{title}</b>{sub && <span className="text-muted-foreground block text-sm">{sub}</span>}</span>
      {right ?? <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />}
    </button>
  )
}

/* Line chart drawn with chart tokens (--chart-1, --chart-2), target band shaded. */
export function MetricChart({ m, readings, days }: { m: Metric; readings: Reading[]; days: number }) {
  const pts = readings.filter(r => r.t >= Date.now() - days * 864e5)
  if (pts.length < 2) return <p className="text-muted-foreground text-sm">Not enough readings yet for this period.</p>
  const W = 340, H = 180, L = 34, R = 10, T = 10, B = 26
  let vals = pts.map(r => r.v); if (m === "bp") vals = vals.concat(pts.map(r => r.v2 || 0))
  let lo = Math.min(...vals), hi = Math.max(...vals)
  const band = M[m].band
  if (band && m !== "bp") { lo = Math.min(lo, band[0]); hi = Math.max(hi, band[1]) }
  const pad = (hi - lo) * .12 || 1; lo -= pad; hi += pad
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t
  const x = (t: number) => L + (t - t0) / (t1 - t0 || 1) * (W - L - R), y = (v: number) => T + (hi - v) / (hi - lo) * (H - T - B)
  const ticks = [0, 1, 2, 3].map(i => lo + (hi - lo) * i / 3)
  const dec = m === "weight" ? 1 : 0
  const path = (k: "v" | "v2") => pts.map((r, i) => (i ? "L" : "M") + x(r.t).toFixed(1) + " " + y((r as any)[k]).toFixed(1)).join(" ")
  const lp = pts[pts.length - 1]
  const b0 = band ? Math.max(lo, band[0]) : 0, b1 = band ? Math.min(hi, band[1]) : 0
  return (
    <div data-slot="chart" className="grid gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${M[m].name} over the last ${days} days`}>
        {band && b1 > b0 && <rect x={L} width={W - L - R} y={y(b1)} height={y(b0) - y(b1)} fill="var(--band)" />}
        {ticks.map((v, i) => <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" /><text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{v.toFixed(dec)}</text></g>)}
        <path d={path("v")} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(lp.t)} cy={y(lp.v)} r="4.5" fill="var(--chart-1)" />
        {m === "bp" && <><path d={path("v2")} fill="none" stroke="var(--chart-2)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /><circle cx={x(lp.t)} cy={y(lp.v2 || 0)} r="4.5" fill="var(--chart-2)" /></>}
        <text x={L} y={H - 6} fontSize="10" fill="var(--muted-foreground)">{fDate(t0)}</text>
        <text x={W - R} y={H - 6} fontSize="10" textAnchor="end" fill="var(--muted-foreground)">{fDate(t1)}</text>
      </svg>
      <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
        {m === "bp" ? <>
          <span className="flex items-center gap-1.5"><i className="h-1 w-3 rounded" style={{ background: "var(--chart-1)" }} />Top (systolic)</span>
          <span className="flex items-center gap-1.5"><i className="h-1 w-3 rounded" style={{ background: "var(--chart-2)" }} />Bottom (diastolic)</span>
        </> : <span className="flex items-center gap-1.5"><i className="h-1 w-3 rounded" style={{ background: "var(--chart-1)" }} />{M[m].name}</span>}
        {band && <span className="flex items-center gap-1.5"><i className="size-3 rounded-sm" style={{ background: "var(--band)" }} />Target range</span>}
      </div>
    </div>
  )
}
export { needsReview }
