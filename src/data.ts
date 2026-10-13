/* Sample data and pure helpers for the CarePath patient prototype. */
export const D = 864e5
export const sod = (d: Date | number) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const at = (ago: number, h: number, m = 0) => { const x = sod(new Date()); x.setDate(x.getDate() - ago); x.setHours(h, m, 0, 0); return +x }
export const todayKey = () => sod(new Date()).toDateString()
export const fTime = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
export const fDate = (t: number) => new Date(t).toLocaleDateString([], { month: "short", day: "numeric" })
export function fDay(t: number) {
  const d = Math.round((+sod(new Date()) - +sod(t)) / D)
  if (d === 0) return "Today"
  if (d === 1) return "Yesterday"
  return new Date(t).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}
export function ago(t: number) {
  const m = Math.round((Date.now() - t) / 6e4)
  if (m < 1) return "Just now"
  if (m < 60) return m + " min ago"
  const h = Math.round(m / 60)
  if (h < 24) return h + " h ago"
  return fDay(t)
}
export const combine = (date: Date | undefined, hhmm: string) => { const d = new Date(date || new Date()); const [h, m] = hhmm.split(":").map(Number); d.setHours(h, m, 0, 0); return +d }
const rnd = (n: number) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }
export const initials = (name: string) => name.split(" ").map(x => x[0]).join("").slice(0, 2)

export const DR = { name: "Dr. Daniel Haile", short: "Dr. Haile", clinic: "Riverside Chronic Care Clinic", phone: "+31 174 000 000" }

export type MealPlan = { type: MealType; time: string; food: string; portion: string; note: string }
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack"
export type Exercise = { id: string; name: string; min: number; freq: string; days: string; desc: string; how: string; safety: string }

export const PLAN = {
  name: "Blood Sugar & Blood Pressure Plan",
  start: at(37, 9),
  end: +new Date(new Date().getFullYear(), 11, 30),
  meals: [
    { type: "Breakfast", time: "7:30 AM", food: "Oats with fruit and 1 boiled egg", portion: "1 cup cooked oats, ½ banana", note: "No added sugar. Tea or coffee without sugar." },
    { type: "Lunch", time: "12:30 PM", food: "Vegetables, lean protein, small grain portion", portion: "Half plate vegetables, ¼ protein, ¼ grains", note: "Use the plate method at every main meal." },
    { type: "Snack", time: "4:00 PM", food: "A handful of nuts or 1 fruit", portion: "About 30 g nuts or 1 apple", note: "Choose unsalted nuts." },
    { type: "Dinner", time: "7:00 PM", food: "Grilled fish or lentils with salad", portion: "Palm-size protein, 1–2 cups salad", note: "Finish eating at least 2 hours before bed." },
  ] as MealPlan[],
  eatMore: ["Vegetables and leafy greens", "Lentils, beans and chickpeas", "Whole grains", "Fish and skinless chicken", "Water"],
  limit: ["Sugary drinks and juice", "White bread and pastries", "Fried food", "Salty snacks", "Processed meat"],
  drNote: "Keep salt low: less than one teaspoon a day, including what is already in food. Walk after your biggest meal when you can.",
  exercises: [
    { id: "e1", name: "Brisk walk", min: 30, freq: "5 days a week", days: "Mon – Fri", desc: "Walk at a pace where you can talk but not sing.", how: "Start slowly for 5 minutes, walk briskly for 20, then slow down for 5.", safety: "Stop and rest if you feel dizzy, short of breath or have chest pain, and message me." },
    { id: "e2", name: "Chair squats & wall push-ups", min: 15, freq: "2 days a week", days: "Tue, Sat", desc: "Light strength exercises at home.", how: "2 rounds of 10 chair squats and 10 wall push-ups. Rest 1 minute between rounds.", safety: "Keep your back straight. Do not hold your breath." },
    { id: "e3", name: "Stretching", min: 10, freq: "Every day", days: "After your walk", desc: "Gentle stretches for legs, back and shoulders.", how: "Hold each stretch for 20 seconds. Never bounce.", safety: "" },
  ] as Exercise[],
}
export const exName = (id: string) => (PLAN.exercises.find(e => e.id === id) || { name: "Exercise" }).name

export type Metric = "weight" | "bp" | "glucose" | "hr"
export const METRICS: Metric[] = ["bp", "glucose", "weight", "hr"]
export const M: Record<Metric, { name: string; unit: string; target: string; freq: string; band: [number, number] | null }> = {
  weight: { name: "Weight", unit: "kg", target: "70 kg by Dec 30", freq: "Every morning, before breakfast", band: null },
  bp: { name: "Blood pressure", unit: "mmHg", target: "Below 130/80", freq: "Every morning, seated and rested", band: [80, 130] },
  glucose: { name: "Blood sugar", unit: "mg/dL", target: "80–130 before meals, under 180 after", freq: "Once a day, 2 hours after lunch", band: [80, 180] },
  hr: { name: "Heart rate", unit: "bpm", target: "60–100 at rest", freq: "With your blood pressure", band: [60, 100] },
}
export type Reading = { t: number; v: number; v2?: number; ctx?: string; note?: string }
export const fv = (m: Metric, r: Reading) => m === "bp" ? `${r.v}/${r.v2}` : m === "weight" ? (+r.v).toFixed(1) : String(Math.round(r.v))
export function needsReview(m: Metric, r: Reading) {
  if (m === "bp") return r.v >= 140 || (r.v2 ?? 0) >= 90 || r.v < 90
  if (m === "glucose") return r.v >= 180 || r.v < 70
  if (m === "hr") return r.v > 100 || r.v < 50
  return false
}

function seedReadings(): Record<Metric, Reading[]> {
  const R: Record<Metric, Reading[]> = { weight: [], bp: [], glucose: [], hr: [] }
  for (let i = 90; i >= 1; i--) {
    const k = (90 - i) / 90
    if (i % 3 === 1) R.weight.push({ t: at(i, 7, 5), v: +(78.6 - k * 2.5 + (rnd(i) - .5) * .6).toFixed(1) })
    if (i % 2 === 1) {
      R.bp.push({ t: at(i, 8, 0), v: Math.round(143 - k * 11 + (rnd(i + 3) - .5) * 8), v2: Math.round(92 - k * 7 + (rnd(i + 7) - .5) * 5) })
      R.hr.push({ t: at(i, 8, 1), v: Math.round(81 - k * 5 + (rnd(i + 9) - .5) * 6) })
    }
    if (i % 2 === 0) R.glucose.push({ t: at(i, 14, 30), v: Math.round(168 - k * 30 + (rnd(i + 11) - .5) * 24), ctx: "After meal" })
  }
  R.weight.push({ t: at(0, 7, 5), v: 76.3 })
  return R
}

export type TaskKind = "meal" | "health" | "exercise" | "checkin"
export type Task = { id: string; g: "Morning" | "Afternoon" | "Evening"; time: string; label: string; sub?: string; kind: TaskKind; metric?: Metric; meal?: MealType; ex?: string; st: "todo" | "done" | "skipped" }
export type Meal = { id: string; t: number; type: MealType; desc: string; portion?: string; notes?: string; photo?: string; status: "pending" | "good" | "improve" | "reviewed"; fb?: string }
export type ExLog = { id: string; t: number; ex: string; min: number; st: "Completed" | "Partial" | "Skipped"; note?: string }
export type Msg = { from: "dr" | "me"; text: string; img?: string; t: number; read: boolean }
export type Notif = { id: string; title: string; desc: string; t: number; read: boolean; icon: string; to: Route }
export type Route = { name: string; p?: Record<string, any> }

export const TASKS = (): Task[] => [
  { id: "t1", g: "Morning", time: "7:00", label: "Weigh yourself", kind: "health", metric: "weight", st: "done" },
  { id: "t2", g: "Morning", time: "7:30", label: "Breakfast", sub: "Oats with fruit, 1 boiled egg", kind: "meal", meal: "Breakfast", st: "done" },
  { id: "t3", g: "Morning", time: "8:00", label: "Check blood pressure", sub: "Sit and rest 5 minutes first", kind: "health", metric: "bp", st: "todo" },
  { id: "t4", g: "Afternoon", time: "12:30", label: "Lunch", sub: "Half plate vegetables", kind: "meal", meal: "Lunch", st: "todo" },
  { id: "t5", g: "Afternoon", time: "14:30", label: "Blood sugar after lunch", kind: "health", metric: "glucose", st: "todo" },
  { id: "t6", g: "Evening", time: "17:30", label: "Brisk walk", sub: "30 minutes", kind: "exercise", ex: "e1", st: "todo" },
  { id: "t7", g: "Evening", time: "19:00", label: "Dinner", sub: "Grilled fish or lentils with salad", kind: "meal", meal: "Dinner", st: "todo" },
  { id: "t8", g: "Evening", time: "21:00", label: "Daily check-in", sub: "2 minutes", kind: "checkin", st: "todo" },
]

export function initialState() {
  return {
    v: 3,
    loggedIn: false,
    remember: true,
    taskDay: todayKey(),
    user: { name: "Sara Ali", dob: "1979-04-12", phone: "+31 6 1234 5678", email: "sara.ali@example.com", address: "Westlandseweg 14, Naaldwijk", height: 162, conditions: "Type 2 diabetes, high blood pressure", emergency: "Yusuf Ali (husband) · +31 6 8765 4321" },
    tasks: TASKS(),
    readings: seedReadings(),
    meals: [
      { id: "m1", t: at(0, 7, 40), type: "Breakfast", desc: "Oatmeal with half a banana and a boiled egg, tea without sugar", portion: "1 bowl", status: "pending" },
      { id: "m2", t: at(1, 19, 15), type: "Dinner", desc: "Chicken stew with rice and a little salad", portion: "1 full plate", status: "improve", fb: "Good protein choice. Reduce the portion of rice next time and add more vegetables." },
      { id: "m3", t: at(1, 12, 45), type: "Lunch", desc: "Lentil soup with mixed salad and one slice of whole-grain bread", portion: "1 bowl + salad", status: "good", fb: "Great lunch. This is exactly the plate balance we want." },
      { id: "m4", t: at(1, 7, 30), type: "Breakfast", desc: "Two boiled eggs, tomato and cucumber, black coffee", portion: "Small plate", status: "good", fb: "Well done." },
      { id: "m5", t: at(2, 19, 30), type: "Dinner", desc: "Pasta with tomato sauce and cheese", portion: "Large plate", status: "improve", fb: "Try whole-grain pasta and keep it to a quarter of the plate, with vegetables on the side." },
    ] as Meal[],
    exLogs: [
      { id: "x1", t: at(1, 17, 40), ex: "e1", min: 30, st: "Completed" }, { id: "x2", t: at(1, 18, 15), ex: "e3", min: 10, st: "Completed" },
      { id: "x3", t: at(2, 17, 30), ex: "e1", min: 20, st: "Partial", note: "Rain, stopped early" }, { id: "x4", t: at(3, 10, 0), ex: "e2", min: 15, st: "Completed" },
      { id: "x5", t: at(4, 17, 45), ex: "e1", min: 30, st: "Completed" }, { id: "x6", t: at(5, 17, 30), ex: "e1", min: 0, st: "Skipped", note: "Felt tired" },
      { id: "x7", t: at(8, 17, 30), ex: "e1", min: 30, st: "Completed" }, { id: "x8", t: at(9, 17, 30), ex: "e1", min: 30, st: "Completed" },
    ] as ExLog[],
    checkins: [{ t: at(7, 21, 0), kind: "Weekly" }] as { t: number; kind: string; answers?: any }[],
    msgs: [
      { from: "dr", text: "Hello Sara, welcome to the app. You will see your full care plan under the Plan tab. Send your meals there and I will review them.", t: at(6, 9, 10), read: true },
      { from: "me", text: "Thank you doctor. Should I check my blood pressure before or after breakfast?", t: at(6, 10, 2), read: true },
      { from: "dr", text: "Before breakfast, after sitting quietly for 5 minutes. Same arm each time.", t: at(6, 11, 30), read: true },
      { from: "dr", text: "I reviewed yesterday's meals. Lunch was very good. For dinner, try a smaller rice portion and more vegetables.", t: at(0, 8, 50), read: false },
    ] as Msg[],
    group: [
      { t: at(5, 10, 0), text: "Welcome to the Thursday walking group. We meet at the park entrance at 6 PM. Bring water and comfortable shoes." },
      { t: at(2, 9, 0), text: "Tip of the week: read food labels. Anything with more than 1.5 g salt per 100 g is high in salt." },
      { t: at(0, 9, 30), text: "New recipe shared: lentil and spinach soup. Easy, filling and good for blood sugar." },
    ],
    groupRead: false,
    notifs: [
      { id: "n1", title: "Doctor feedback on your dinner", desc: "Dr. Haile reviewed yesterday's dinner.", t: at(0, 8, 52), read: false, icon: "meal", to: { name: "meals" } },
      { id: "n2", title: "Time to check your blood pressure", desc: "Your morning reading is not logged yet.", t: at(0, 8, 0), read: false, icon: "heart", to: { name: "addReading", p: { m: "bp" } } },
      { id: "n3", title: "New message from Dr. Haile", desc: "I reviewed yesterday's meals…", t: at(0, 8, 50), read: false, icon: "chat", to: { name: "chat" } },
      { id: "n4", title: "Group announcement", desc: "New recipe: lentil and spinach soup.", t: at(0, 9, 30), read: true, icon: "group", to: { name: "group" } },
      { id: "n5", title: "Care plan updated", desc: "Your walking target is now 30 minutes, 5 days a week.", t: at(3, 15, 0), read: true, icon: "plan", to: { name: "plan" } },
      { id: "n6", title: "Weekly check-in reminder", desc: "Tell your doctor how this week went.", t: at(7, 20, 0), read: true, icon: "clip", to: { name: "checkin" } },
    ] as Notif[],
    settings: { meal: true, exercise: true, health: true, messages: true, group: false },
  }
}
export type State = ReturnType<typeof initialState>
