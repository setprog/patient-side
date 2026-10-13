import * as React from "react"
import { CameraIcon, CheckIcon, CircleCheckIcon, ImageIcon, SendIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import { DatePicker, TimeSelect, nowSlot } from "@/components/pickers"
import { Field, Screen, TopBar, Unit } from "@/components/app-parts"
import { MetricSelect } from "@/screens/track"
import { DR, M, PLAN, combine, needsReview, type ExLog, type MealType, type Metric, type Reading } from "@/data"
import { last, markTask, useStore } from "@/store"

export function readImage(file: File, cb: (url: string) => void) {
  const r = new FileReader()
  r.onload = () => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement("canvas"), k = Math.min(1, 640 / Math.max(img.width, img.height))
      c.width = img.width * k; c.height = img.height * k
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height)
      cb(c.toDataURL("image/jpeg", .75))
    }
    img.onerror = () => cb(String(r.result))
    img.src = String(r.result)
  }
  r.readAsDataURL(file)
}

const ErrorText = ({ children }: { children: React.ReactNode }) => children ? <p role="alert" className="text-destructive text-sm font-bold">{children}</p> : null

/* ---------- Add meal ---------- */
export function AddMeal({ p }: { p?: { meal?: MealType } }) {
  const { update, replace } = useStore()
  const h = new Date().getHours()
  const [type, setType] = React.useState<string>(p?.meal || (h < 11 ? "Breakfast" : h < 16 ? "Lunch" : h < 18 ? "Snack" : "Dinner"))
  const [photo, setPhoto] = React.useState<string>()
  const [desc, setDesc] = React.useState("")
  const [portion, setPortion] = React.useState("")
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [time, setTime] = React.useState(nowSlot())
  const [notes, setNotes] = React.useState("")
  const [err, setErr] = React.useState("")
  const fileRef = React.useRef<HTMLInputElement>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!type) { setErr("Choose which meal this is."); return }
    if (!desc.trim() && !photo) { setErr("Add a photo or write what you ate."); return }
    update(d => {
      d.meals.unshift({ id: "m" + Date.now(), t: combine(date, time), type: type as MealType, desc: desc.trim() || "Photo only", portion: portion.trim(), notes: notes.trim(), photo, status: "pending" })
      markTask(d, t => t.kind === "meal" && t.meal === type)
    })
    toast.success(`Sent to ${DR.short}`, { description: "You'll see the feedback in your meal diary." })
    replace("meals")
  }
  return (
    <>
      <TopBar title="Add a meal" back right={null} />
      <form noValidate onSubmit={submit}><Screen>
        <Field label="Which meal?">
          <ToggleGroup type="single" variant="outline" spacing={2} className="flex-wrap" value={type} onValueChange={setType} aria-label="Meal">
            {["Breakfast", "Lunch", "Dinner", "Snack"].map(x => <ToggleGroupItem key={x} value={x} className="rounded-full px-4 data-[state=on]:border-primary">{x}</ToggleGroupItem>)}
          </ToggleGroup>
        </Field>
        <Field label="Photo">
          <input ref={fileRef} id="meal-photo" type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; if (f) readImage(f, setPhoto) }} />
          {photo ? (
            <div className="relative overflow-hidden rounded-xl border">
              <img src={photo} alt="Your meal photo" className="h-52 w-full object-cover" />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}><ImageIcon />Change</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setPhoto(undefined)}><XIcon />Remove</Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="bg-card text-muted-foreground hover:border-ring/50 focus-visible:ring-ring/50 grid min-h-38 place-items-center rounded-xl border-2 border-dashed p-4 text-center outline-none focus-visible:ring-[3px]">
              <span className="grid justify-items-center gap-1"><CameraIcon className="text-primary size-9" /><b className="text-foreground">Take or choose a photo</b><span className="text-sm">Your doctor sees the photo</span></span>
            </button>
          )}
        </Field>
        <Field label="What did you eat?" htmlFor="meal-desc"><Textarea id="meal-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="For example: grilled chicken, salad, half a cup of rice" /></Field>
        <Field label="Portion" htmlFor="meal-portion"><Input id="meal-portion" value={portion} onChange={e => setPortion(e.target.value)} placeholder="1 plate" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="meal-date"><DatePicker id="meal-date" value={date} onChange={setDate} /></Field>
          <Field label="Time" htmlFor="meal-time"><TimeSelect id="meal-time" value={time} onChange={setTime} /></Field>
        </div>
        <Field label="Notes" optional htmlFor="meal-notes"><Input id="meal-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything your doctor should know" /></Field>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" size="lg"><SendIcon />Send to {DR.short}</Button>
      </Screen></form>
    </>
  )
}

/* ---------- Add reading ---------- */
const LIMITS: Record<Metric, [number, number]> = { weight: [25, 300], bp: [60, 260], glucose: [20, 600], hr: [30, 220] }
export function AddReading({ p }: { p?: { m?: Metric } }) {
  const { s, update, replace } = useStore()
  const [m, setM] = React.useState<Metric>(p?.m || "bp")
  const [v, setV] = React.useState("")
  const [v2, setV2] = React.useState("")
  const [pulse, setPulse] = React.useState("")
  const [ctx, setCtx] = React.useState("After meal")
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [time, setTime] = React.useState(nowSlot())
  const [note, setNote] = React.useState("")
  const [err, setErr] = React.useState("")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseFloat(v), [lo, hi] = LIMITS[m]
    if (isNaN(n) || n < lo || n > hi) { setErr(`Enter a number between ${lo} and ${hi}.`); return }
    const r: Reading = { t: combine(date, time), v: m === "weight" ? +n.toFixed(1) : Math.round(n), note: note.trim() || undefined }
    if (m === "bp") {
      const n2 = parseFloat(v2)
      if (isNaN(n2) || n2 < 30 || n2 > 160 || n2 >= n) { setErr("Enter the bottom number. It should be lower than the top number."); return }
      r.v2 = Math.round(n2)
    }
    if (m === "glucose") r.ctx = ctx
    update(d => {
      d.readings[m].push(r); d.readings[m].sort((a, b) => a.t - b.t)
      const hr = parseFloat(pulse)
      if (m === "bp" && !isNaN(hr) && hr >= 30 && hr <= 220) { d.readings.hr.push({ t: r.t, v: Math.round(hr) }); d.readings.hr.sort((a, b) => a.t - b.t) }
      markTask(d, t => t.kind === "health" && t.metric === m)
    })
    if (needsReview(m, r)) toast.warning("Reading saved", { description: "This reading may require your doctor's review." })
    else toast.success("Reading saved")
    replace("health", { m })
  }
  return (
    <>
      <TopBar title="Add a reading" back right={null} />
      <form noValidate onSubmit={submit}><Screen>
        <Field label="What are you measuring?" htmlFor="rd-metric" hint={`${M[m].freq}.`}>
          <MetricSelect id="rd-metric" value={m} onChange={x => { setM(x); setErr("") }} />
        </Field>
        {m === "bp" ? <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Top number" htmlFor="rd-v" hint="Systolic"><Input id="rd-v" type="number" inputMode="numeric" placeholder="128" value={v} onChange={e => setV(e.target.value)} /></Field>
            <Field label="Bottom number" htmlFor="rd-v2" hint="Diastolic"><Input id="rd-v2" type="number" inputMode="numeric" placeholder="82" value={v2} onChange={e => setV2(e.target.value)} /></Field>
          </div>
          <Field label="Pulse" optional htmlFor="rd-hr"><Unit unit="bpm"><Input id="rd-hr" type="number" inputMode="numeric" placeholder="74" value={pulse} onChange={e => setPulse(e.target.value)} /></Unit></Field>
        </> : (
          <Field label={M[m].name} htmlFor="rd-v">
            <Unit unit={M[m].unit}><Input id="rd-v" type="number" inputMode="decimal" step={m === "weight" ? "0.1" : "1"} placeholder={m === "weight" ? String(last(s, "weight").v) : m === "glucose" ? "140" : "74"} value={v} onChange={e => setV(e.target.value)} /></Unit>
          </Field>
        )}
        {m === "glucose" && (
          <Field label="When did you measure?" htmlFor="rd-ctx">
            <Select value={ctx} onValueChange={setCtx}>
              <SelectTrigger id="rd-ctx" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Before meal">Before a meal (fasting)</SelectItem>
                <SelectItem value="After meal">2 hours after a meal</SelectItem>
                <SelectItem value="Bedtime">At bedtime</SelectItem>
                <SelectItem value="Other">Other time</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="rd-date"><DatePicker id="rd-date" value={date} onChange={setDate} /></Field>
          <Field label="Time" htmlFor="rd-time"><TimeSelect id="rd-time" value={time} onChange={setTime} /></Field>
        </div>
        <Field label="Notes" optional htmlFor="rd-note"><Input id="rd-note" value={note} onChange={e => setNote(e.target.value)} placeholder="For example: felt dizzy, measured after walking" /></Field>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" size="lg"><CheckIcon />Save reading</Button>
      </Screen></form>
    </>
  )
}

/* ---------- Log exercise ---------- */
export function LogExercise({ p }: { p?: { ex?: string } }) {
  const { update, replace } = useStore()
  const [ex, setEx] = React.useState(p?.ex || "e1")
  const [st, setSt] = React.useState<string>("Completed")
  const [min, setMin] = React.useState(String(PLAN.exercises.find(e => e.id === (p?.ex || "e1"))!.min))
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [note, setNote] = React.useState("")
  const plan = PLAN.exercises.find(e => e.id === ex)!
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = st === "Skipped" ? 0 : Math.max(0, parseInt(min) || 0)
    update(d => {
      d.exLogs.push({ id: "x" + Date.now(), t: combine(date, `${String(new Date().getHours()).padStart(2, "0")}:00`), ex, min: minutes, st: (st || "Completed") as ExLog["st"], note: note.trim() || undefined })
      markTask(d, t => t.kind === "exercise" && t.ex === ex, st === "Skipped" ? "skipped" : "done")
    })
    if (st === "Skipped") toast("Saved as skipped"); else toast.success("Great job! Exercise saved.")
    replace("exercise")
  }
  return (
    <>
      <TopBar title="Log exercise" back right={null} />
      <form noValidate onSubmit={submit}><Screen>
        <Field label="Exercise" htmlFor="ex-pick" hint={`Your plan: ${plan.min} min, ${plan.freq.toLowerCase()}`}>
          <Select value={ex} onValueChange={v => { setEx(v); setMin(String(PLAN.exercises.find(e => e.id === v)!.min)) }}>
            <SelectTrigger id="ex-pick" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{PLAN.exercises.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="How did it go?">
          <ToggleGroup type="single" variant="outline" spacing={2} className="flex-wrap" value={st} onValueChange={v => v && setSt(v)} aria-label="How did it go?">
            {["Completed", "Partial", "Skipped"].map(x => <ToggleGroupItem key={x} value={x} className="rounded-full px-4 data-[state=on]:border-primary">{x}</ToggleGroupItem>)}
          </ToggleGroup>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minutes" htmlFor="ex-min"><Input id="ex-min" type="number" inputMode="numeric" value={st === "Skipped" ? "0" : min} disabled={st === "Skipped"} onChange={e => setMin(e.target.value)} /></Field>
          <Field label="Date" htmlFor="ex-date"><DatePicker id="ex-date" value={date} onChange={setDate} /></Field>
        </div>
        <Field label="Notes" optional htmlFor="ex-note"><Input id="ex-note" value={note} onChange={e => setNote(e.target.value)} placeholder="For example: knee felt sore" /></Field>
        <Button type="submit" size="lg"><CheckIcon />Save</Button>
      </Screen></form>
    </>
  )
}

/* ---------- Check-in ---------- */
function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <ToggleGroup type="single" variant="outline" spacing={2} className="flex-wrap" value={value} onValueChange={onChange} aria-label={label}>
        {options.map(o => <ToggleGroupItem key={o} value={o} className="rounded-full px-4 data-[state=on]:border-primary">{o}</ToggleGroupItem>)}
      </ToggleGroup>
    </Field>
  )
}
export function Checkin() {
  const { s, update, replace } = useStore()
  const [a, setA] = React.useState<Record<string, string>>({})
  const set = (k: string) => (v: string) => setA(x => ({ ...x, [k]: v }))
  const [w, setW] = React.useState(""), [g, setG] = React.useState(""), [sy, setSy] = React.useState(""), [di, setDi] = React.useState("")
  const [hard, setHard] = React.useState(""), [other, setOther] = React.useState("")
  const [err, setErr] = React.useState("")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!a.nut || !a.energy || !a.feel) { setErr("Answer the meal plan, energy and feeling questions to submit."); return }
    const t = Date.now(), W = parseFloat(w), S = parseFloat(sy), Di = parseFloat(di), G = parseFloat(g)
    update(d => {
      if (!isNaN(W) && W > 25 && W < 300) d.readings.weight.push({ t, v: +W.toFixed(1) })
      if (!isNaN(S) && !isNaN(Di) && S > Di) d.readings.bp.push({ t, v: Math.round(S), v2: Math.round(Di) })
      if (!isNaN(G) && G > 20 && G < 600) d.readings.glucose.push({ t, v: Math.round(G), ctx: "Other" })
      d.checkins.push({ t, kind: "Daily", answers: { ...a, hard, other } })
      markTask(d, x => x.kind === "checkin")
    })
    replace("checkinDone")
  }
  return (
    <>
      <TopBar title="Check-in" back right={null} />
      <form noValidate onSubmit={submit}><Screen>
        <p className="text-muted-foreground">A few quick questions for {DR.short}. It takes about 2 minutes.</p>
        <Choice label="How well did you follow your meal plan?" value={a.nut || ""} onChange={set("nut")} options={["Not followed", "Partly", "Mostly", "Fully"]} />
        <Choice label="Did you do your exercise?" value={a.ex || ""} onChange={set("ex")} options={["Yes", "Partly", "No"]} />
        <Choice label="How did you sleep?" value={a.sleep || ""} onChange={set("sleep")} options={["Poorly", "Okay", "Well"]} />
        <Choice label="Your energy level" value={a.energy || ""} onChange={set("energy")} options={["Very low", "Low", "Normal", "Good", "Excellent"]} />
        <Choice label="How do you feel overall?" value={a.feel || ""} onChange={set("feel")} options={["Unwell", "Not great", "Okay", "Good"]} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight" optional htmlFor="ci-w"><Unit unit="kg"><Input id="ci-w" type="number" inputMode="decimal" step="0.1" placeholder={String(last(s, "weight").v)} value={w} onChange={e => setW(e.target.value)} /></Unit></Field>
          <Field label="Blood sugar" optional htmlFor="ci-g"><Unit unit="mg/dL"><Input id="ci-g" type="number" inputMode="numeric" value={g} onChange={e => setG(e.target.value)} /></Unit></Field>
          <Field label="BP top" optional htmlFor="ci-s"><Input id="ci-s" type="number" inputMode="numeric" placeholder="128" value={sy} onChange={e => setSy(e.target.value)} /></Field>
          <Field label="BP bottom" optional htmlFor="ci-d"><Input id="ci-d" type="number" inputMode="numeric" placeholder="82" value={di} onChange={e => setDi(e.target.value)} /></Field>
        </div>
        <Field label="Anything that was hard this week?" htmlFor="ci-hard"><Textarea id="ci-hard" value={hard} onChange={e => setHard(e.target.value)} placeholder="For example: I ate out twice, it was hard to walk in the rain" /></Field>
        <Field label="Other comments" optional htmlFor="ci-other"><Input id="ci-other" value={other} onChange={e => setOther(e.target.value)} /></Field>
        <ErrorText>{err}</ErrorText>
        <Button type="submit" size="lg"><SendIcon />Submit check-in</Button>
      </Screen></form>
    </>
  )
}

export function CheckinDone() {
  const { setTab } = useStore()
  return (
    <>
      <TopBar title="Check-in" back right={null} />
      <Screen>
        <Card><CardContent className="grid justify-items-center gap-3 py-8 text-center">
          <span className="bg-success-soft text-success grid size-21 place-items-center rounded-full"><CircleCheckIcon className="size-11" /></span>
          <h2 className="text-2xl">Check-in submitted</h2>
          <p className="text-muted-foreground">{DR.short} will review it and reply in Messages.</p>
        </CardContent></Card>
        <Button size="lg" onClick={() => setTab("home")}>Back to home</Button>
      </Screen>
    </>
  )
}
