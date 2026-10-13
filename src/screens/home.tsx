import * as React from "react"
import { EyeIcon, EyeOffIcon, HeartIcon, InfoIcon, MessageCircleIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "sonner"
import { BellButton, CountDot, Field, Ico, ListRow, METRIC_ICON, Screen, Section, TaskRow, ThemeButton, TopBar } from "@/components/app-parts"
import { DR, M, METRICS, fDay, fv, initials, needsReview, type Task } from "@/data"
import { last, progress, unreadMsgs, useStore } from "@/store"

/* ---------- Login ---------- */
export function Login() {
  const { update } = useStore()
  const [id, setId] = React.useState("sara.ali@example.com")
  const [pw, setPw] = React.useState("demo1234")
  const [show, setShow] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [err, setErr] = React.useState("")
  const [forgot, setForgot] = React.useState(false)
  return (
    <div className="mx-auto flex min-h-full max-w-[480px] flex-col justify-center gap-6 px-4 py-8">
      <div className="flex justify-end"><ThemeButton /></div>
      <div className="flex items-center gap-3">
        <span className="bg-primary text-primary-foreground grid size-13 place-items-center rounded-2xl"><HeartIcon className="size-7" /></span>
        <div><h1 className="text-2xl">CarePath</h1><p className="text-muted-foreground">Your care plan from {DR.clinic}</p></div>
      </div>
      <Card>
        <CardContent>
          <form className="grid gap-5" noValidate onSubmit={e => {
            e.preventDefault()
            if (!id.trim() || !pw) { setErr("Enter your phone number or email and your password."); return }
            update(d => { d.loggedIn = true; d.remember = remember })
          }}>
            <Field label="Phone number or email" htmlFor="lg-id"><Input id="lg-id" autoComplete="username" value={id} onChange={e => setId(e.target.value)} aria-invalid={!!err && !id.trim()} /></Field>
            <Field label="Password" htmlFor="lg-pw">
              <div className="relative">
                <Input id="lg-pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} className="pr-12" aria-invalid={!!err && !pw} />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 size-11" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
                  {show ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </Button>
              </div>
            </Field>
            <div className="flex items-center gap-3">
              <Checkbox id="lg-rem" checked={remember} onCheckedChange={c => setRemember(c === true)} />
              <Label htmlFor="lg-rem" className="font-semibold">Keep me logged in</Label>
            </div>
            {err && <p className="text-destructive text-sm font-bold" role="alert">{err}</p>}
            <Button type="submit" size="lg">Log in</Button>
            <Button type="button" variant="link" onClick={() => setForgot(true)}>Forgot your password?</Button>
            {forgot && <p className="text-muted-foreground text-sm">We sent a reset link to your phone and email. It may take a minute to arrive.</p>}
          </form>
        </CardContent>
      </Card>
      <Alert variant="info">
        <InfoIcon />
        <AlertDescription><p>Got an invitation from your doctor? Use the code in the SMS to set your password. Need help? Call the clinic at <b>{DR.phone}</b>.</p></AlertDescription>
      </Alert>
    </div>
  )
}

/* ---------- Task action sheet (shared) ---------- */
export function TaskSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { update, go } = useStore()
  const t = task
  const logLabel = t ? { meal: "Log this meal", health: "Add reading", exercise: "Log exercise", checkin: "Start check-in" }[t.kind] : ""
  const logIt = () => {
    if (!t) return
    onClose()
    if (t.kind === "meal") go("addMeal", { meal: t.meal })
    else if (t.kind === "health") go("addReading", { m: t.metric })
    else if (t.kind === "exercise") go("logEx", { ex: t.ex })
    else go("checkin")
  }
  const set = (st: Task["st"]) => { if (!t) return; update(d => { d.tasks.find(x => x.id === t.id)!.st = st }); onClose(); if (st === "done") toast.success(`${t.label} done`) }
  return (
    <Sheet open={!!t} onOpenChange={o => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="mx-auto max-w-[480px] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]">
        <div className="bg-muted mx-auto mt-2 h-1.5 w-12 rounded-full" aria-hidden="true" />
        {t && <>
          <SheetHeader className="pr-12"><SheetTitle className="text-lg">{t.label}</SheetTitle><SheetDescription>{t.sub ? `${t.sub} · ` : ""}{t.time}</SheetDescription></SheetHeader>
          <SheetFooter>
            <Button size="lg" onClick={logIt}>{logLabel}</Button>
            <Button size="lg" variant="secondary" onClick={() => set(t.st === "done" ? "todo" : "done")}>{t.st === "done" ? "Mark as not done" : "Mark as done"}</Button>
            <Button size="lg" variant="outline" onClick={() => set(t.st === "skipped" ? "todo" : "skipped")}>{t.st === "skipped" ? "Undo skip" : "Skip today"}</Button>
          </SheetFooter>
        </>}
      </SheetContent>
    </Sheet>
  )
}

/* ---------- Home ---------- */
export function Home() {
  const { s, go, setTab } = useStore()
  const [open, setOpen] = React.useState<Task | null>(null)
  const p = progress(s), C = 2 * Math.PI * 36, h = new Date().getHours()
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  const nm = unreadMsgs(s)
  const next = s.tasks.filter(t => t.st === "todo").slice(0, 3)
  return (
    <>
      <header className="bg-background sticky top-[env(safe-area-inset-top,0px)] z-20 flex items-center gap-2 px-4 pt-3.5 pb-2.5 backdrop-blur">
        <Avatar className="size-11"><AvatarFallback>{initials(s.user.name)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="text-muted-foreground text-sm">{greet},</p><h1 className="truncate text-xl">{s.user.name.split(" ")[0]}</h1></div>
        <ThemeButton />
        <Button variant="outline" size="icon" className="relative rounded-full" aria-label="Messages" onClick={() => setTab("messages")}><MessageCircleIcon className="size-5" />{nm > 0 && <CountDot n={nm} />}</Button>
        <BellButton />
      </header>
      <Screen>
        <section aria-label="Today's progress" className="bg-primary text-primary-foreground flex items-center gap-4 rounded-2xl p-4">
          <div className="relative size-21 shrink-0">
            <svg viewBox="0 0 84 84" className="size-21 -rotate-90"><circle cx="42" cy="42" r="36" fill="none" strokeWidth="9" stroke="currentColor" opacity=".25" /><circle cx="42" cy="42" r="36" fill="none" strokeWidth="9" stroke="currentColor" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p.p / 100)} style={{ transition: "stroke-dashoffset .5s" }} /></svg>
            <b className="font-heading absolute inset-0 grid place-items-center text-xl tabular-nums">{p.p}%</b>
          </div>
          <div className="grid gap-1.5">
            <h2 className="text-lg">{p.d === p.t ? "All done for today!" : `${p.d} of ${p.t} done today`}</h2>
            <p className="text-sm opacity-90">{p.d === p.t ? "Great work. See you tomorrow." : "Keep going, you are doing well."}</p>
            <div className="flex flex-wrap gap-1.5">
              {(["meal", "exercise", "health", "checkin"] as const).map(k => {
                const ts = s.tasks.filter(t => t.kind === k)
                return <Badge key={k} className="bg-white/20 text-current">{{ meal: "Meals", exercise: "Exercise", health: "Readings", checkin: "Check-in" }[k]} {ts.filter(t => t.st === "done").length}/{ts.length}</Badge>
              })}
            </div>
          </div>
        </section>

        <Section title="Up next" action={<Button variant="link" className="h-auto p-0" onClick={() => go("today")}>See full day</Button>}>
          <Card className="py-1"><CardContent>{next.length ? next.map(t => <TaskRow key={t.id} t={t} onOpen={setOpen} />) : <p className="text-muted-foreground py-3">Nothing left for today.</p>}</CardContent></Card>
        </Section>

        <Section title="Quick actions">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2.5">
            {([["camera", "Log meal", () => go("addMeal")], ["heart", "Add reading", () => go("addReading", { m: "bp" })], ["run", "Log exercise", () => go("logEx")], ["clip", "Check-in", () => go("checkin")], ["chat", "Message doctor", () => go("chat")]] as const).map(([i, l, fn]) => (
              <Button key={l} variant="outline" onClick={fn} className="h-auto flex-col gap-2 rounded-xl px-1.5 py-3.5 text-sm whitespace-normal">
                <span className="bg-accent text-accent-foreground grid size-11 place-items-center rounded-full"><Ico name={i === "camera" ? "meal" : i} className="size-5" /></span>{l}
              </Button>
            ))}
          </div>
        </Section>

        <Section title="From your doctor">
          <Card className="py-1"><CardContent>
            <ListRow icon="meal" title="Feedback on yesterday's dinner" sub="“Reduce the portion of rice next time and add more vegetables.”" onClick={() => go("meals")} />
            <ListRow icon="plan" title="Care plan updated" sub="Walking is now 30 minutes, 5 days a week" onClick={() => setTab("plan")} />
          </CardContent></Card>
        </Section>

        <Section title="Health snapshot" action={<Button variant="link" className="h-auto p-0" onClick={() => go("health")}>All readings</Button>}>
          <div className="grid grid-cols-2 gap-2.5">
            {METRICS.map(m => { const r = last(s, m); return (
              <button key={m} type="button" onClick={() => go("health", { m })} className="bg-card hover:border-ring/50 focus-visible:ring-ring/50 flex flex-col items-start gap-1 rounded-xl border p-4 text-left shadow-sm outline-none focus-visible:ring-[3px]">
                <span className="bg-accent text-accent-foreground mb-1 grid size-9 place-items-center rounded-lg"><Ico name={METRIC_ICON[m]} className="size-5" /></span>
                <span className="text-muted-foreground text-sm">{M[m].name}</span>
                <span className="font-heading text-[1.35rem] font-semibold tabular-nums">{fv(m, r)} <small className="text-muted-foreground font-sans text-xs font-semibold">{M[m].unit}</small></span>
                <span className="text-muted-foreground text-sm">{fDay(r.t)}</span>
                {needsReview(m, r) && <Badge variant="warning">Doctor may review</Badge>}
              </button>
            )})}
          </div>
        </Section>
      </Screen>
      <TaskSheet task={open} onClose={() => setOpen(null)} />
    </>
  )
}

/* ---------- Today ---------- */
export function Today() {
  const { s } = useStore()
  const [open, setOpen] = React.useState<Task | null>(null)
  const p = progress(s)
  return (
    <>
      <TopBar title="Today's plan" back />
      <Screen>
        <Card>
          <CardHeader>
            <CardTitle>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</CardTitle>
            <CardDescription>Tap the circle when you finish something. Tap the name to log details or skip it.</CardDescription>
            <CardAction><Badge variant="secondary" className="text-sm tabular-nums">{p.d}/{p.t}</Badge></CardAction>
          </CardHeader>
          <CardContent><Progress value={p.p} /></CardContent>
        </Card>
        {(["Morning", "Afternoon", "Evening"] as const).map(g => (
          <Section key={g} title={g}>
            <Card className="py-1"><CardContent>{s.tasks.filter(t => t.g === g).map(t => <TaskRow key={t.id} t={t} onOpen={setOpen} />)}</CardContent></Card>
          </Section>
        ))}
      </Screen>
      <TaskSheet task={open} onClose={() => setOpen(null)} />
    </>
  )
}
