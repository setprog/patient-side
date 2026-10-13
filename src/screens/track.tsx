import * as React from "react"
import { CameraIcon, ClipboardCheckIcon, PlusIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ico, IconTile, ListRow, METRIC_ICON, MealStatus, MetricChart, Screen, Section, TopBar } from "@/components/app-parts"
import { KV } from "@/screens/plan"
import { DR, M, METRICS, PLAN, exName, fDay, fTime, fv, needsReview, type Metric } from "@/data"
import { goals, last, prev, useStore, weekEx, weekStart } from "@/store"

export function Track() {
  const { s, go } = useStore()
  type H = { t: number; icon: string; txt: string }
  const hist: H[] = []
  s.meals.forEach(m => { hist.push({ t: m.t, icon: "meal", txt: m.type + " submitted" }); if (m.status !== "pending") hist.push({ t: m.t + 3 * 36e5, icon: "chat", txt: `${DR.short} reviewed your ${m.type.toLowerCase()}` }) })
  s.exLogs.forEach(x => hist.push({ t: x.t, icon: "run", txt: `${exName(x.ex)} · ${x.st.toLowerCase()}` }))
  METRICS.forEach(m => s.readings[m].filter(r => r.t > Date.now() - 3 * 864e5).forEach(r => hist.push({ t: r.t, icon: METRIC_ICON[m], txt: `${M[m].name} ${fv(m, r)} ${M[m].unit}` })))
  s.checkins.forEach(c => hist.push({ t: c.t, icon: "clip", txt: `${c.kind} check-in submitted` }))
  hist.sort((a, b) => b.t - a.t)
  const groups: { day: string; items: H[] }[] = []
  hist.slice(0, 12).forEach(h => { const d = fDay(h.t); const g = groups[groups.length - 1]; if (g && g.day === d) g.items.push(h); else groups.push({ day: d, items: [h] }) })
  const tiles = [
    { icon: "meal", title: "Meal diary", sub: `${s.meals.filter(m => m.status === "pending").length} waiting for review`, to: "meals" },
    { icon: "heart", title: "Health readings", sub: `BP ${fv("bp", last(s, "bp"))} · ${fDay(last(s, "bp").t)}`, to: "health" },
    { icon: "run", title: "Exercise", sub: `${weekEx(s).length} of 4 this week`, to: "exercise" },
    { icon: "target", title: "Goals", sub: `${goals(s).length} active goals`, to: "goals" },
  ]
  return (
    <>
      <TopBar title="Track" />
      <Screen>
        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map(t => (
            <button key={t.to} type="button" onClick={() => go(t.to)} className="bg-card hover:border-ring/50 focus-visible:ring-ring/50 flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left shadow-sm outline-none focus-visible:ring-[3px]">
              <IconTile name={t.icon} className="size-9" /><b>{t.title}</b><span className="text-muted-foreground text-sm">{t.sub}</span>
            </button>
          ))}
        </div>
        <Button size="lg" onClick={() => go("checkin")}><ClipboardCheckIcon />Do my check-in</Button>
        <Section title="My history">
          <Card className="py-2"><CardContent className="grid gap-1">
            {groups.map(g => (
              <div key={g.day}>
                <p className="text-muted-foreground pt-2 text-xs font-bold tracking-wider uppercase">{g.day}</p>
                {g.items.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 [&+&]:border-t">
                    <IconTile name={h.icon} className="size-9" />
                    <span className="min-w-0 flex-1">{h.txt}</span>
                    <span className="text-muted-foreground text-sm tabular-nums">{fTime(h.t)}</span>
                  </div>
                ))}
              </div>
            ))}
          </CardContent></Card>
        </Section>
      </Screen>
    </>
  )
}

export function Meals() {
  const { s, go } = useStore()
  const sorted = [...s.meals].sort((a, b) => b.t - a.t)
  const days: string[] = []
  sorted.forEach(m => { const d = fDay(m.t); if (!days.includes(d)) days.push(d) })
  return (
    <>
      <TopBar title="Meal diary" back />
      <Screen>
        <Button size="lg" onClick={() => go("addMeal")}><CameraIcon />Add a meal</Button>
        {days.map(day => (
          <Section key={day} title={day}>
            {sorted.filter(m => fDay(m.t) === day).map(m => (
              <Card key={m.id}>
                <CardContent className="grid gap-3">
                  <div className="flex gap-3">
                    {m.photo ? <img src={m.photo} alt={`${m.type} photo`} className="size-19 shrink-0 rounded-lg object-cover" /> : <span className="bg-accent text-accent-foreground grid size-19 shrink-0 place-items-center rounded-lg"><Ico name="meal" className="size-7" /></span>}
                    <div className="grid min-w-0 flex-1 content-start gap-1">
                      <div className="flex items-baseline justify-between gap-2"><b>{m.type}</b><span className="text-muted-foreground text-sm tabular-nums">{fTime(m.t)}</span></div>
                      <p className="text-sm">{m.desc}</p>
                      {m.portion && <p className="text-muted-foreground text-sm">Portion: {m.portion}</p>}
                      <MealStatus status={m.status} />
                    </div>
                  </div>
                  {m.fb ? (
                    <div className="bg-muted rounded-lg px-3 py-2.5"><p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{DR.short}</p><p>{m.fb}</p></div>
                  ) : m.status === "pending" && <p className="text-muted-foreground text-sm">{DR.short} will review this meal and reply here.</p>}
                </CardContent>
              </Card>
            ))}
          </Section>
        ))}
      </Screen>
    </>
  )
}

export function MetricSelect({ value, onChange, id }: { value: Metric; onChange: (m: Metric) => void; id?: string }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as Metric)}>
      <SelectTrigger id={id} aria-label="Measurement" className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {METRICS.map(m => <SelectItem key={m} value={m}><Ico name={METRIC_ICON[m]} className="size-4" />{M[m].name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function Health({ p }: { p?: { m?: Metric } }) {
  const { s, go } = useStore()
  const [m, setM] = React.useState<Metric>(p?.m || "bp")
  const [days, setDays] = React.useState("30")
  const r = last(s, m), pr = prev(s, m)
  let chg = "–"
  if (pr) {
    if (m === "bp") { const a = r.v - pr.v, b = (r.v2 || 0) - (pr.v2 || 0); chg = `${a >= 0 ? "+" : ""}${a} / ${b >= 0 ? "+" : ""}${b}` }
    else { const d = r.v - pr.v; chg = (d >= 0 ? "+" : "") + (m === "weight" ? d.toFixed(1) : Math.round(d)) }
  }
  return (
    <>
      <TopBar title="Health readings" back />
      <Screen>
        <MetricSelect value={m} onChange={setM} />
        <Card>
          <CardHeader><CardDescription>Latest · {fDay(r.t)}, {fTime(r.t)}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{fv(m, r)} <small className="text-muted-foreground font-sans text-sm font-semibold">{M[m].unit}</small></CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <div><KV k="Previous" v={<span className="tabular-nums">{pr ? fv(m, pr) : "–"}</span>} /><KV k="Change" v={<span className="tabular-nums">{chg}</span>} /><KV k="Your target" v={M[m].target} /></div>
            {needsReview(m, r) && <Alert variant="warning"><TriangleAlertIcon /><AlertTitle>This reading may require your doctor's review.</AlertTitle><AlertDescription>{DR.short} can see it. If you feel unwell, contact the clinic.</AlertDescription></Alert>}
            <Button size="lg" onClick={() => go("addReading", { m })}><PlusIcon />Add a reading</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>History</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Tabs value={days} onValueChange={setDays}><TabsList className="w-full"><TabsTrigger value="7">7 days</TabsTrigger><TabsTrigger value="30">30 days</TabsTrigger><TabsTrigger value="90">3 months</TabsTrigger></TabsList></Tabs>
            <MetricChart m={m} readings={s.readings[m]} days={+days} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent readings</CardTitle></CardHeader>
          <CardContent>
            {s.readings[m].slice(-8).reverse().map(x => (
              <div key={x.t} className="flex items-center justify-between gap-3 py-2.5 [&+&]:border-t">
                <span className="text-muted-foreground text-sm">{fDay(x.t)}, {fTime(x.t)}{x.ctx ? ` · ${x.ctx}` : ""}</span>
                <span className="flex items-center gap-2 font-bold tabular-nums">{fv(m, x)}{needsReview(m, x) && <Badge variant="warning">Review</Badge>}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </Screen>
    </>
  )
}

export function ExerciseScreen() {
  const { s, go } = useStore()
  const wk = weekEx(s)
  const mins = s.exLogs.filter(x => x.t >= weekStart()).reduce((a, x) => a + x.min, 0)
  const missed = s.exLogs.filter(x => x.t >= Date.now() - 14 * 864e5 && x.st === "Skipped").length
  return (
    <>
      <TopBar title="Exercise" back />
      <Screen>
        <Card>
          <CardHeader><CardTitle>This week</CardTitle><CardAction><span className="font-heading font-semibold tabular-nums">{wk.length} of 4</span></CardAction></CardHeader>
          <CardContent className="grid gap-3">
            <Progress value={Math.min(100, wk.length * 25)} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Total time</span><br /><b className="tabular-nums">{mins} min</b></div>
              <div><span className="text-muted-foreground">Skipped (2 weeks)</span><br /><b className="tabular-nums">{missed}</b></div>
            </div>
          </CardContent>
        </Card>
        <Button size="lg" onClick={() => go("logEx")}><PlusIcon />Log exercise</Button>
        <Section title="From my plan">
          <Card className="py-1"><CardContent>
            {PLAN.exercises.map(e => <ListRow key={e.id} icon="run" title={e.name} sub={`${e.min} min · ${e.freq}`} onClick={() => go("logEx", { ex: e.id })} right={<Badge variant="secondary">Log</Badge>} />)}
          </CardContent></Card>
        </Section>
        <Section title="History">
          <Card className="py-1"><CardContent>
            {[...s.exLogs].sort((a, b) => b.t - a.t).slice(0, 10).map(x => (
              <div key={x.id} className="flex items-center justify-between gap-3 py-3 [&+&]:border-t">
                <span className="min-w-0"><b className="block">{exName(x.ex)}</b><span className="text-muted-foreground text-sm">{fDay(x.t)}{x.note ? ` · ${x.note}` : ""}</span></span>
                <span className="grid justify-items-end gap-1"><span className="tabular-nums">{x.min} min</span><Badge variant={x.st === "Completed" ? "success" : x.st === "Partial" ? "warning" : "muted"}>{x.st}</Badge></span>
              </div>
            ))}
          </CardContent></Card>
        </Section>
      </Screen>
    </>
  )
}
