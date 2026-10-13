import * as React from "react"
import { CheckIcon, ClipboardCheckIcon, InfoIcon, PlusIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricChart, Screen, TopBar } from "@/components/app-parts"
import { DR, M, METRICS, PLAN, fDate, fDay, fv, needsReview } from "@/data"
import { goals, last, useStore } from "@/store"

export function KV({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3 py-2.5 [&+&]:border-t"><span className="text-muted-foreground">{k}</span><span className="text-right font-bold">{v}</span></div>
}

export function GoalCards() {
  const { s } = useStore()
  return <>{goals(s).map(g => (
    <Card key={g.name}>
      <CardHeader><CardTitle>{g.name}</CardTitle><CardAction><span className="font-heading font-semibold tabular-nums">{g.p}%</span></CardAction></CardHeader>
      <CardContent className="grid gap-2">
        <Progress value={g.p} />
        <p className="text-muted-foreground text-sm">Now: <b className="text-foreground">{g.cur}</b> · Target: {g.target} · {g.due}</p>
      </CardContent>
    </Card>
  ))}</>
}

export function Plan() {
  const { s, go } = useStore()
  const [sec, setSec] = React.useState("meals")
  const g = goals(s), avg = Math.round(g.reduce((a, x) => a + x.p, 0) / g.length)
  return (
    <>
      <TopBar title="My care plan" />
      <Screen>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{PLAN.name}</CardTitle>
            <CardDescription>By {DR.name} · {fDate(PLAN.start)} – {fDate(PLAN.end)}</CardDescription>
            <CardAction><Badge variant="success">Active</Badge></CardAction>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex justify-between text-sm"><span>Overall progress</span><b className="tabular-nums">{avg}%</b></div>
            <Progress value={avg} />
          </CardContent>
        </Card>
        <Button variant="outline" size="lg" onClick={() => go("today")}><ClipboardCheckIcon />See today's plan</Button>

        <Tabs value={sec} onValueChange={setSec} className="gap-4">
          <TabsList className="h-12 w-full">
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="exercise">Exercise</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="grid gap-3">
            {PLAN.meals.map(m => (
              <Card key={m.type}>
                <CardHeader><CardTitle>{m.type}</CardTitle><CardAction><Badge variant="muted">{m.time}</Badge></CardAction></CardHeader>
                <CardContent className="grid gap-1.5">
                  <p className="font-bold">{m.food}</p>
                  <p className="text-muted-foreground text-sm">Portion: {m.portion}</p>
                  <p className="text-sm">{m.note}</p>
                </CardContent>
              </Card>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <Card><CardHeader><CardTitle className="text-success">Eat more</CardTitle></CardHeader><CardContent><ul className="grid list-disc gap-1 pl-5 text-sm">{PLAN.eatMore.map(x => <li key={x}>{x}</li>)}</ul></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-destructive">Limit</CardTitle></CardHeader><CardContent><ul className="grid list-disc gap-1 pl-5 text-sm">{PLAN.limit.map(x => <li key={x}>{x}</li>)}</ul></CardContent></Card>
            </div>
            <Alert variant="info"><InfoIcon /><AlertDescription><p><b>{DR.short}:</b> {PLAN.drNote}</p></AlertDescription></Alert>
          </TabsContent>

          <TabsContent value="exercise" className="grid gap-3">
            {PLAN.exercises.map(e => (
              <Card key={e.id}>
                <CardHeader><CardTitle>{e.name}</CardTitle><CardDescription>{e.freq} · {e.days}</CardDescription><CardAction><Badge variant="muted">{e.min} min</Badge></CardAction></CardHeader>
                <CardContent className="grid gap-2">
                  <p>{e.desc}</p>
                  <p className="text-sm"><b>How:</b> {e.how}</p>
                  {e.safety && <Alert variant="warning"><TriangleAlertIcon /><AlertDescription>{e.safety}</AlertDescription></Alert>}
                </CardContent>
                <CardFooter><Button variant="secondary" className="w-full" onClick={() => go("logEx", { ex: e.id })}><CheckIcon />Log this exercise</Button></CardFooter>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tracking" className="grid gap-3">
            {METRICS.map(m => { const r = last(s, m); return (
              <Card key={m}>
                <CardHeader><CardTitle>{M[m].name}</CardTitle>{needsReview(m, r) && <CardAction><Badge variant="warning">Doctor may review</Badge></CardAction>}</CardHeader>
                <CardContent>
                  <KV k="How often" v={M[m].freq} />
                  <KV k="Target" v={M[m].target} />
                  <KV k="Last reading" v={<span className="tabular-nums">{fv(m, r)} {M[m].unit} · {fDay(r.t)}</span>} />
                </CardContent>
                <CardFooter><Button variant="secondary" className="w-full" onClick={() => go("addReading", { m })}><PlusIcon />Add {M[m].name.toLowerCase()}</Button></CardFooter>
              </Card>
            )})}
          </TabsContent>

          <TabsContent value="goals" className="grid gap-3"><GoalCards /></TabsContent>
        </Tabs>
      </Screen>
    </>
  )
}

export function Goals() {
  const { s } = useStore()
  return (
    <>
      <TopBar title="Goals & progress" back />
      <Screen>
        <GoalCards />
        <Card><CardHeader><CardTitle>Weight over 3 months</CardTitle></CardHeader><CardContent><MetricChart m="weight" readings={s.readings.weight} days={90} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Blood pressure over 3 months</CardTitle></CardHeader><CardContent><MetricChart m="bp" readings={s.readings.bp} days={90} /></CardContent></Card>
      </Screen>
    </>
  )
}
export { Separator }
