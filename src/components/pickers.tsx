/** App-level compositions of shadcn primitives: Date Picker (Popover + Calendar) and Time Select (Select). */
import * as React from "react"
import { CalendarDaysIcon, ClockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function DatePicker({ id, value, onChange, disableFuture = true, className }: {
  id?: string; value?: Date; onChange: (d: Date | undefined) => void; disableFuture?: boolean; className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const today = new Date()
  const label = value
    ? value.toDateString() === today.toDateString() ? "Today, " + value.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : value.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "Pick a date"
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" data-empty={!value} className={cn("w-full justify-start text-left text-base font-normal data-[empty=true]:text-muted-foreground", className)}>
          <CalendarDaysIcon className="text-muted-foreground" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={d => { onChange(d); if (d) setOpen(false) }}
          disabled={disableFuture ? d => d > today : undefined}
          autoFocus
          className="[--cell-size:--spacing(10)]"
        />
      </PopoverContent>
    </Popover>
  )
}

const TIMES: string[] = []
for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) TIMES.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
export const fmt12 = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) }
export const nowSlot = () => { const d = new Date(); const m = Math.floor(d.getMinutes() / 15) * 15; return `${String(d.getHours()).padStart(2, "0")}:${String(m).padStart(2, "0")}` }

export function TimeSelect({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <span className="flex items-center gap-2"><ClockIcon className="size-4 text-muted-foreground" /><SelectValue placeholder="Time" /></span>
      </SelectTrigger>
      <SelectContent>
        {TIMES.map(t => <SelectItem key={t} value={t}>{fmt12(t)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
