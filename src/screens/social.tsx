import * as React from "react"
import { CameraIcon, LockIcon, LogOutIcon, MonitorIcon, MoonIcon, RotateCcwIcon, SendIcon, SunIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import { ListRow, Screen, Section, TopBar } from "@/components/app-parts"
import { KV } from "@/screens/plan"
import { readImage } from "@/screens/forms"
import { DR, ago, fDay, fTime, initials } from "@/data"
import { useTheme } from "@/components/theme-provider"
import { last, unreadNotifs, useStore } from "@/store"
import { cn } from "@/lib/utils"

export function Messages() {
  const { s, go } = useStore()
  const lastDr = s.msgs[s.msgs.length - 1], un = s.msgs.filter(m => m.from === "dr" && !m.read).length, lg = s.group[s.group.length - 1]
  return (
    <>
      <TopBar title="Messages" />
      <Screen>
        <Card className="py-1"><CardContent>
          <ListRow icon="user" title={DR.name} sub={<span className="line-clamp-1">{(lastDr.from === "me" ? "You: " : "") + (lastDr.text || "Photo")}</span>} onClick={() => go("chat")}
            right={<span className="grid shrink-0 justify-items-end gap-1 text-sm"><span className="text-muted-foreground">{ago(lastDr.t)}</span>{un > 0 && <Badge>{un}</Badge>}</span>} />
          <ListRow icon="group" title="Diabetes & BP walking group" sub={<span className="line-clamp-1">{lg.text}</span>} onClick={() => go("group")}
            right={<span className="grid shrink-0 justify-items-end gap-1 text-sm"><span className="text-muted-foreground">{ago(lg.t)}</span>{!s.groupRead && <Badge>New</Badge>}</span>} />
        </CardContent></Card>
        <Alert variant="info"><LockIcon /><AlertDescription>Questions about your own health go to {DR.short} privately. Group members cannot see them.</AlertDescription></Alert>
      </Screen>
    </>
  )
}

export function Chat() {
  const { s, update } = useStore()
  const [text, setText] = React.useState("")
  const fileRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { update(d => { d.msgs.forEach(m => { if (m.from === "dr") m.read = true }); d.notifs.forEach(n => { if (n.to.name === "chat") n.read = true }) }) }, [])
  React.useEffect(() => { window.scrollTo(0, document.body.scrollHeight) }, [s.msgs.length])
  const send = (t: string, img?: string) => update(d => { d.msgs.push({ from: "me", text: t, img, t: Date.now(), read: false }) })
  let day = ""
  return (
    <>
      <TopBar title={DR.name} back right={null} />
      <div className="flex flex-col gap-2 px-4 pt-1 pb-28">
        {s.msgs.map((m, i) => {
          const d = fDay(m.t), sep = d !== day; day = d
          return (
            <React.Fragment key={i}>
              {sep && <span className="text-muted-foreground self-center py-1.5 text-xs font-bold">{d}</span>}
              <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm", m.from === "me" ? "bg-primary text-primary-foreground self-end rounded-br-md" : "bg-card self-start rounded-bl-md border")}>
                {m.img && <img src={m.img} alt="Photo you sent" className="mb-1 max-h-52 rounded-xl" />}
                {m.text}
                <time className="mt-0.5 block text-right text-[0.72rem] opacity-75">{fTime(m.t)}{m.from === "me" ? (m.read ? " · Seen" : " · Sent") : ""}</time>
              </div>
            </React.Fragment>
          )
        })}
      </div>
      <form className="bg-background fixed bottom-0 left-1/2 z-30 flex w-full max-w-[480px] -translate-x-1/2 gap-2 border-t px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
        onSubmit={e => { e.preventDefault(); if (text.trim()) { send(text.trim()); setText("") } }}>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) readImage(f, url => send("", url)) }} />
        <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Send a photo" onClick={() => fileRef.current?.click()}><CameraIcon className="size-5" /></Button>
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Write a message" aria-label="Message" autoComplete="off" className="rounded-full" />
        <Button type="submit" size="icon" className="rounded-full" aria-label="Send"><SendIcon className="size-5" /></Button>
      </form>
    </>
  )
}

export function Group() {
  const { s, update } = useStore()
  React.useEffect(() => { update(d => { d.groupRead = true }) }, [])
  return (
    <>
      <TopBar title="Walking group" back right={null} />
      <Screen>
        <Card><CardHeader><CardTitle>Diabetes & BP walking group</CardTitle><CardDescription>Run by {DR.name} · 24 members</CardDescription></CardHeader>
          <CardContent><p className="text-sm">Announcements, tips and recipes from your doctor. Only the doctor can post here.</p></CardContent></Card>
        {[...s.group].reverse().map(g => (
          <Card key={g.t}><CardContent className="grid gap-1.5">
            <div className="flex justify-between gap-2"><span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">{DR.short}</span><span className="text-muted-foreground text-sm">{fDay(g.t)}</span></div>
            <p>{g.text}</p>
          </CardContent></Card>
        ))}
      </Screen>
    </>
  )
}

export function Notifs() {
  const { s, update, go, setTab } = useStore()
  return (
    <>
      <TopBar title="Notifications" back right={unreadNotifs(s) ? <Button variant="link" className="px-0" onClick={() => update(d => d.notifs.forEach(n => { n.read = true }))}>Mark all read</Button> : null} />
      <Screen>
        <Card className="py-1"><CardContent>
          {[...s.notifs].sort((a, b) => b.t - a.t).map(n => (
            <ListRow key={n.id} icon={n.icon} title={n.title} sub={`${n.desc} · ${ago(n.t)}`}
              right={n.read ? undefined : <span className="bg-primary size-2.5 shrink-0 rounded-full" aria-label="Unread" />}
              onClick={() => {
                update(d => { d.notifs.find(x => x.id === n.id)!.read = true })
                if (["plan", "home", "track", "messages", "profile"].includes(n.to.name)) setTab(n.to.name as any)
                else go(n.to.name, n.to.p)
              }} />
          ))}
        </CardContent></Card>
      </Screen>
    </>
  )
}

const REMINDERS: [keyof ReturnType<typeof useStore>["s"]["settings"], string][] = [["meal", "Meal reminders"], ["exercise", "Exercise reminders"], ["health", "Reading reminders"], ["messages", "Doctor messages"], ["group", "Group announcements"]]

export function Profile() {
  const { s, update, reset } = useStore()
  const { theme, setTheme } = useTheme()
  const [confirm, setConfirm] = React.useState<null | "logout" | "reset">(null)
  const u = s.user
  return (
    <>
      <TopBar title="Profile" />
      <Screen>
        <Card><CardContent className="flex items-center gap-4">
          <Avatar className="size-19"><AvatarFallback className="text-2xl">{initials(u.name)}</AvatarFallback></Avatar>
          <div><h2 className="text-lg">{u.name}</h2><p className="text-muted-foreground text-sm">Patient of {DR.name}</p></div>
        </CardContent></Card>

        <Section title="My details"><Card className="py-2"><CardContent>
          <KV k="Date of birth" v={new Date(u.dob).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })} />
          <KV k="Phone" v={u.phone} /><KV k="Email" v={<span className="break-all">{u.email}</span>} />
          <KV k="Address" v={u.address} /><KV k="Emergency contact" v={u.emergency} />
        </CardContent></Card></Section>

        <Section title="Health information"><Card className="py-2"><CardContent>
          <KV k="Height" v={`${u.height} cm`} /><KV k="Current weight" v={<span className="tabular-nums">{last(s, "weight").v} kg</span>} /><KV k="Conditions" v={u.conditions} />
        </CardContent></Card></Section>

        <Section title="Appearance">
          <ToggleGroup type="single" variant="outline" spacing={2} value={theme} onValueChange={v => v && setTheme(v as typeof theme)} aria-label="Appearance" className="grid w-full grid-cols-3">
            <ToggleGroupItem value="light" className="w-full"><SunIcon />Light</ToggleGroupItem>
            <ToggleGroupItem value="dark" className="w-full"><MoonIcon />Dark</ToggleGroupItem>
            <ToggleGroupItem value="system" className="w-full"><MonitorIcon />Phone</ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section title="Reminders"><Card className="py-1"><CardContent>
          {REMINDERS.map(([k, l]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-3 [&+&]:border-t">
              <Label htmlFor={`sw-${k}`} className="font-semibold">{l}</Label>
              <Switch id={`sw-${k}`} checked={!!s.settings[k]} onCheckedChange={c => { update(d => { (d.settings as any)[k] = c }); toast(c ? `${l} on` : `${l} off`) }} />
            </div>
          ))}
        </CardContent></Card></Section>

        <Section title="Account"><Card className="py-1"><CardContent>
          <ListRow icon="lock" title="Change password" onClick={() => toast.info("Reset link sent", { description: "Check your phone for the link." })} />
          <ListRow icon="shield" title="Privacy" sub="Only your care team can see your health data" onClick={() => toast.info("Your data is shared only with your care team.")} />
          <ListRow icon="help" title="Help" sub={`Call the clinic: ${DR.phone}`} onClick={() => toast.info(`Clinic phone: ${DR.phone}`)} />
        </CardContent></Card></Section>

        <Button variant="outline" size="lg" className="text-destructive" onClick={() => setConfirm("logout")}><LogOutIcon />Log out</Button>
        <Button variant="ghost" className="text-muted-foreground" onClick={() => setConfirm("reset")}><RotateCcwIcon />Reset demo data</Button>
      </Screen>

      <AlertDialog open={!!confirm} onOpenChange={o => { if (!o) setConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "reset" ? "Reset demo data?" : "Log out?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirm === "reset" ? "This removes everything you added in this demo and brings back the sample data." : "You will need your phone number or email and password to log in again."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant={confirm === "logout" ? "destructive" : "default"}
              onClick={() => { if (confirm === "reset") { reset(); toast.success("Demo data reset") } else update(d => { d.loggedIn = false }) }}>
              {confirm === "reset" ? "Reset" : "Log out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
