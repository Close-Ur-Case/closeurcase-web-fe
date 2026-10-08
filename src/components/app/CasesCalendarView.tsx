import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  CalendarClock,
  Hash,
  Pencil,
  Eye,
  Paperclip,
  Landmark,
  User,
  Info,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  Check,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  IconButton,
  Switch,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";
import { StatusBadge, formatCaseVsTitle, getNextEntry } from "@/components/app/caseDocketShared";
import { ChatButton } from "@/components/app/CaseChat";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { AddDailyNoteModal } from "@/components/app/AddDailyNoteModal";
import { useAuth } from "@/context/useAuth";
import { dairyService } from "@/services/dairyService";
import { getDairyNotes, subscribeToStore } from "@/data/appStore";
import { formatDateTime } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { LegalCase, DairyNote } from "@/types";

export interface CasesCalendarViewProps {
  cases: LegalCase[];
  allCases: LegalCase[];
  role: "lawyer" | "citizen";
  onOpenEditModal: (c: LegalCase) => void;
  onOpenSerialModal: (c: LegalCase) => void;
  onOpenAttachments: (caseId: string) => void;
  onCaseUpdate?: (updatedCase: LegalCase) => void;
}

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  caseItem: LegalCase;
  purpose: string;
  time?: string;
  isUpcoming: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CasesCalendarView({
  cases,
  allCases,
  role,
  onOpenEditModal,
  onOpenSerialModal,
  onOpenAttachments,
}: CasesCalendarViewProps) {
  const navigate = useNavigate();
  const isLawyer = role === "lawyer";

  const todayIso = new Date().toISOString().slice(0, 10);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const { user } = useAuth();
  const currentUserId = user?.id || (user as any)?.lawyerId || (user as any)?.citizenId || "user_default";

  // ── Sub-tabs below calendars: "hearings" vs "daily" ─────────────────────────
  const [calendarSubTab, setCalendarSubTab] = useState<"hearings" | "daily">("hearings");
  const [dairyNotes, setDairyNotes] = useState<DairyNote[]>(() => getDairyNotes());
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DairyNote | null>(null);
  const [isRefreshingDairy, setIsRefreshingDairy] = useState(false);
  const [dailyViewFilter, setDailyViewFilter] = useState<"selectedDate" | "all">("selectedDate");

  // Sync dairy notes with local store and remote Supabase API (READ)
  const refreshDairyNotes = useCallback(async () => {
    setIsRefreshingDairy(true);
    try {
      const notes = await dairyService.listNotes({ userId: currentUserId });
      setDairyNotes(notes);
    } catch (err) {
      console.error("[CasesCalendarView] Failed to fetch notes from backend:", err);
    } finally {
      setIsRefreshingDairy(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    refreshDairyNotes();

    const unsub = subscribeToStore(() => {
      setDairyNotes(getDairyNotes());
    });
    return unsub;
  }, [refreshDairyNotes]);

  const notesByDate = useMemo(() => {
    const map = new Map<string, DairyNote[]>();
    dairyNotes.forEach((n) => {
      const list = map.get(n.entryDate) || [];
      list.push(n);
      map.set(n.entryDate, list);
    });
    return map;
  }, [dairyNotes]);

  const selectedDateNotes = useMemo(() => {
    return (notesByDate.get(selectedDate) || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notesByDate, selectedDate]);

  const displayedNotes = useMemo(() => {
    if (dailyViewFilter === "all") {
      return [...dairyNotes].sort(
        (a, b) =>
          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return selectedDateNotes;
  }, [dailyViewFilter, dairyNotes, selectedDateNotes]);

  // UPDATE (Toggle status): calls PATCH /api/v1/dairy/:id
  const handleToggleNoteCompleted = async (noteId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setDairyNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, isCompleted: nextStatus, updatedAt: new Date().toISOString() }
          : n,
      ),
    );
    try {
      await dairyService.toggleCompleted(noteId, nextStatus);
    } catch (err) {
      console.error("[CasesCalendarView] Failed to toggle note status:", err);
    }
  };

  // DELETE: calls DELETE /api/v1/dairy/:id
  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this daily note?")) {
      return;
    }
    const previous = [...dairyNotes];
    setDairyNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      const ok = await dairyService.deleteNote(noteId);
      if (!ok) {
        setDairyNotes(previous);
      }
    } catch (err) {
      console.error("[CasesCalendarView] Failed to delete note:", err);
      setDairyNotes(previous);
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  // Dynamic list of selectable years (past 10 to future 10 years + any case years)
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    const baseYear = new Date().getFullYear();
    for (let y = baseYear - 10; y <= baseYear + 10; y++) {
      years.add(y);
    }
    years.add(currentYear);

    cases.forEach((c) => {
      const dates = [
        c.caseDetails?.filingDate,
        c.createdAt,
        c.caseDetails?.registrationDate,
      ];
      dates.forEach((d) => {
        if (d) {
          const yr = parseInt(String(d).slice(0, 4), 10);
          if (!isNaN(yr) && yr >= 1990 && yr <= 2100) years.add(yr);
        }
      });
      if (Array.isArray(c.caseDetails?.historyOfCaseHearings)) {
        c.caseDetails.historyOfCaseHearings.forEach((h) => {
          const hDate = h.hearingDate || h.businessOnDate;
          if (hDate) {
            const yr = parseInt(String(hDate).slice(0, 4), 10);
            if (!isNaN(yr) && yr >= 1990 && yr <= 2100) years.add(yr);
          }
        });
      }
    });

    return Array.from(years).sort((a, b) => a - b);
  }, [cases, currentYear]);

  // Extract all hearing and docket events for every case
  const { eventsByDate, allEvents, eventsThisMonthCount } = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const list: CalendarEvent[] = [];
    let monthCount = 0;

    cases.forEach((c) => {
      const liveCase = allCases.find((ac) => ac.id === c.id) || c;
      const seenDates = new Set<string>();

      // 1. Next upcoming hearing
      const next = getNextEntry(liveCase);
      const nextHearingDate = next?.hearingDate ?? next?.businessOnDate;
      if (nextHearingDate) {
        const cleanDate = nextHearingDate.slice(0, 10);
        if (!seenDates.has(cleanDate)) {
          seenDates.add(cleanDate);
          const ev: CalendarEvent = {
            id: `${liveCase.id}_next`,
            date: cleanDate,
            caseItem: liveCase,
            purpose: next?.purposeOfListing || "Upcoming Hearing",
            time: next?.time,
            isUpcoming: cleanDate >= todayIso,
          };
          list.push(ev);
          const existing = map.get(cleanDate) || [];
          existing.push(ev);
          map.set(cleanDate, existing);
        }
      }

      // 2. Additional hearings in case hearing history
      if (Array.isArray(liveCase.caseDetails?.historyOfCaseHearings)) {
        liveCase.caseDetails.historyOfCaseHearings.forEach((h, idx) => {
          const hDate = (h.hearingDate || h.businessOnDate || "").slice(0, 10);
          if (hDate && !seenDates.has(hDate)) {
            seenDates.add(hDate);
            const ev: CalendarEvent = {
              id: `${liveCase.id}_h_${idx}`,
              date: hDate,
              caseItem: liveCase,
              purpose: h.purposeOfListing || (h as any).purpose || "Court Hearing",
              time: h.time,
              isUpcoming: hDate >= todayIso,
            };
            list.push(ev);
            const existing = map.get(hDate) || [];
            existing.push(ev);
            map.set(hDate, existing);
          }
        });
      }
    });

    // Count events in current month
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    map.forEach((evList, dateKey) => {
      if (dateKey.startsWith(monthPrefix)) {
        monthCount += evList.length;
      }
    });

    return { eventsByDate: map, allEvents: list, eventsThisMonthCount: monthCount };
  }, [cases, allCases, currentYear, currentMonth, todayIso]);

  // ── Helper to calculate 42 calendar slots for any month ───────────────────
  const getMonthSlots = (
    y: number,
    m: number,
    eventsMap: Map<string, CalendarEvent[]>,
    today: string,
  ) => {
    const firstDayOfWeek = new Date(y, m, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const days: Array<{
      dateIso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }> = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(y, m - 1, dayNum);
      const prevY = prevDate.getFullYear();
      const prevM = prevDate.getMonth();
      const iso = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dateIso: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: iso === today,
        events: eventsMap.get(iso) || [],
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateIso: iso,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: iso === today,
        events: eventsMap.get(iso) || [],
      });
    }

    // Trailing days up to 42 slots (6 weeks x 7 days)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(y, m + 1, i);
      const nextY = nextDate.getFullYear();
      const nextM = nextDate.getMonth();
      const iso = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateIso: iso,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: iso === today,
        events: eventsMap.get(iso) || [],
      });
    }

    return days;
  };

  // ── Multi-month list: 3 consecutive months starting from selected month ────
  const displayedMonths = useMemo(() => {
    const list: Array<{
      year: number;
      month: number;
      monthName: string;
      days: Array<{
        dateIso: string;
        dayNumber: number;
        isCurrentMonth: boolean;
        isToday: boolean;
        events: CalendarEvent[];
      }>;
      eventCount: number;
    }> = [];

    for (let offset = 0; offset < 3; offset++) {
      const d = new Date(currentYear, currentMonth + offset, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const mPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;

      let mEventCount = 0;
      eventsByDate.forEach((evList, dateKey) => {
        if (dateKey.startsWith(mPrefix)) {
          mEventCount += evList.length;
        }
      });

      list.push({
        year: y,
        month: m,
        monthName: MONTH_NAMES[m],
        days: getMonthSlots(y, m, eventsByDate, todayIso),
        eventCount: mEventCount,
      });
    }

    return list;
  }, [currentYear, currentMonth, eventsByDate, todayIso]);

  const totalEventsInVisibleMonths = useMemo(() => {
    return displayedMonths.reduce((acc, m) => acc + m.eventCount, 0);
  }, [displayedMonths]);

  // Selected date events
  const selectedEvents = eventsByDate.get(selectedDate) || [];
  const selectedDateFormatted = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleMonthChange = (newMonth: number) => {
    const newDate = new Date(currentYear, newMonth, 1);
    setCurrentDate(newDate);
    const yr = newDate.getFullYear();
    const mo = newDate.getMonth();
    const targetMonthPrefix = `${yr}-${String(mo + 1).padStart(2, "0")}`;
    if (todayIso.startsWith(targetMonthPrefix)) {
      setSelectedDate(todayIso);
    } else {
      setSelectedDate(`${targetMonthPrefix}-01`);
    }
  };

  const handleYearChange = (newYear: number) => {
    const newDate = new Date(newYear, currentMonth, 1);
    setCurrentDate(newDate);
    const yr = newDate.getFullYear();
    const mo = newDate.getMonth();
    const targetMonthPrefix = `${yr}-${String(mo + 1).padStart(2, "0")}`;
    if (todayIso.startsWith(targetMonthPrefix)) {
      setSelectedDate(todayIso);
    } else {
      setSelectedDate(`${targetMonthPrefix}-01`);
    }
  };

  const goToPrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(newDate);
    const yr = newDate.getFullYear();
    const mo = newDate.getMonth();
    const targetMonthPrefix = `${yr}-${String(mo + 1).padStart(2, "0")}`;
    if (todayIso.startsWith(targetMonthPrefix)) {
      setSelectedDate(todayIso);
    } else {
      setSelectedDate(`${targetMonthPrefix}-01`);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(newDate);
    const yr = newDate.getFullYear();
    const mo = newDate.getMonth();
    const targetMonthPrefix = `${yr}-${String(mo + 1).padStart(2, "0")}`;
    if (todayIso.startsWith(targetMonthPrefix)) {
      setSelectedDate(todayIso);
    } else {
      setSelectedDate(`${targetMonthPrefix}-01`);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(todayIso);
  };

  return (
    <div className="space-y-4">
      {/* ── Calendar Navigation Header ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Month Selector */}
              <div className="relative inline-block">
                <select
                  aria-label="Select month"
                  value={currentMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="h-8.5 cursor-pointer appearance-none rounded-xl border border-border/80 bg-background pl-3 pr-8 py-1 text-sm font-bold text-foreground shadow-2xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Year Selector */}
              <div className="relative inline-block">
                <select
                  aria-label="Select year"
                  value={currentYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="h-8.5 cursor-pointer appearance-none rounded-xl border border-border/80 bg-background pl-3 pr-8 py-1 font-mono text-sm font-bold text-foreground shadow-2xs transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {eventsThisMonthCount} in {MONTH_NAMES[currentMonth]} {currentYear} · {totalEventsInVisibleMonths} {totalEventsInVisibleMonths === 1 ? "hearing" : "hearings"} across visible months
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outlined"
            onClick={goToToday}
            className="text-xs h-8 px-3 font-semibold"
          >
            Today
          </Button>
          <div className="flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
            <IconButton
              variant="standard"
              title="Previous Month"
              ariaLabel="Previous Month"
              onClick={goToPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <IconButton
              variant="standard"
              title="Next Month"
              ariaLabel="Next Month"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* ── Multi-Month Grid (Desktop: 3 months, Tablet: 2 months, Mobile: 1 month) ── */}
      {/* Every calendar card is formatted in a perfect square (aspect-square) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 max-w-sm sm:max-w-md md:max-w-none mx-auto w-full">
        {displayedMonths.map((m, idx) => {
          // Responsive month visibility:
          // Mobile (< md): 1 month (index 0)
          // Tablet (md - lg): 2 months (index 0, 1)
          // Desktop (lg+): 3 months (index 0, 1, 2)
          const visibilityCls =
            idx === 1 ? "hidden md:flex" : idx === 2 ? "hidden lg:flex" : "flex";

          return (
            <div
              key={`${m.year}-${m.month}`}
              className={cn(
                "aspect-square flex-col justify-between rounded-2xl border border-border/80 bg-surface p-3 sm:p-3.5 shadow-2xs overflow-hidden transition-all",
                visibilityCls,
              )}
            >
              {/* Month Card Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-bold text-foreground truncate">
                    {m.monthName}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {m.year}
                  </span>
                </div>
                {m.eventCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{m.eventCount}</span>
                  </span>
                )}
              </div>

              {/* Weekday Row */}
              <div className="grid grid-cols-7 pt-1.5 text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="truncate">
                    {d.slice(0, 2)}
                  </div>
                ))}
              </div>

              {/* 7x6 Day Matrix */}
              <div className="grid grid-cols-7 grid-rows-6 flex-1 gap-0.5 sm:gap-1 pt-1 items-center justify-items-center">
                {m.days.map((day) => {
                  const isSelected = day.dateIso === selectedDate;
                  const hasEvents = day.events.length > 0;
                  const dayNotes = notesByDate.get(day.dateIso) || [];
                  const hasNotes = dayNotes.length > 0;

                  return (
                    <button
                      key={day.dateIso}
                      type="button"
                      onClick={() => setSelectedDate(day.dateIso)}
                      className={cn(
                        "aspect-square w-full h-full max-w-[32px] max-h-[32px] sm:max-w-[36px] sm:max-h-[36px] flex flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all relative cursor-pointer",
                        !day.isCurrentMonth
                          ? "text-muted-foreground/30 hover:text-muted-foreground/60"
                          : "text-foreground hover:bg-muted/60",
                        day.isToday && "ring-1 ring-primary font-extrabold text-primary bg-primary/5",
                        isSelected && "!bg-primary !text-primary-foreground font-bold shadow-2xs !ring-0",
                        (hasEvents || hasNotes) && !isSelected && "font-bold text-primary",
                      )}
                      title={`${day.dateIso}${hasEvents ? ` (${day.events.length} hearing${day.events.length > 1 ? "s" : ""})` : ""}${hasNotes ? ` (${dayNotes.length} note${dayNotes.length > 1 ? "s" : ""})` : ""}`}
                    >
                      <span>{day.dayNumber}</span>
                      {(hasEvents || hasNotes) && (
                        <div className="flex items-center gap-0.5 absolute bottom-1">
                          {hasEvents && (
                            <span
                              className={cn(
                                "h-1 w-1 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-primary",
                              )}
                            />
                          )}
                          {hasNotes && (
                            <span
                              className={cn(
                                "h-1 w-1 rounded-full",
                                isSelected ? "bg-primary-foreground" : "bg-amber-500",
                              )}
                            />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sub-tabs Below Calendars: [Hearings, Daily] ────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Sub-tabs Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <SegmentedControl
              value={calendarSubTab}
              onChange={setCalendarSubTab}
              options={[
                {
                  value: "hearings",
                  label: `Hearings (${selectedEvents.length})`,
                },
                {
                  value: "daily",
                  label: `Daily (${selectedDateNotes.length})`,
                },
              ]}
            />

            {/* Quick + Add Note Button for Daily Tab */}
            <button
              type="button"
              onClick={() => {
                setCalendarSubTab("daily");
                setIsAddNoteOpen(true);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all cursor-pointer shadow-2xs"
              title="Add Daily Note"
              aria-label="Add Daily Note"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium pl-2 border-l border-border/60">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>{selectedDateFormatted}</span>
              {selectedDate === todayIso && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary border border-primary/20 uppercase tracking-wider">
                  Today
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {calendarSubTab === "hearings"
                ? `${selectedEvents.length} ${selectedEvents.length === 1 ? "hearing found" : "hearings found"}`
                : `${selectedDateNotes.length} ${selectedDateNotes.length === 1 ? "note found" : "notes found"}`}
            </span>
          </div>
        </div>

        {/* ── Sub-tab 1: Hearings View ─────────────────────────────────────────── */}
        {calendarSubTab === "hearings" && (
          <div>
            {selectedEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground space-y-2">
                <Info className="h-6 w-6 mx-auto text-muted-foreground/60" />
                <p className="font-medium">No hearings scheduled for {selectedDateFormatted}.</p>
                <p className="text-[11px] text-muted-foreground/80">
                  Select any date with a badge above to inspect upcoming court hearings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                {selectedEvents.map((ev) => {
                  const liveCase = allCases.find((ac) => ac.id === ev.caseItem.id) || ev.caseItem;
                  const formattedTitle = formatCaseVsTitle(liveCase);
                  const titleVsParts = formattedTitle.split(/\s+vs\s+/i);
                  const attachmentCount = Array.isArray(liveCase.files)
                    ? liveCase.files.length
                    : (liveCase.files?.files?.length ?? 0);

                  const serialDisplay =
                    liveCase.serialCaseNumber ||
                    liveCase.serial_case_number ||
                    (liveCase.caseDetails?.caseNumber && liveCase.caseDetails.caseNumber !== liveCase.id
                      ? liveCase.caseDetails.caseNumber
                      : liveCase.id);

                  return (
                    <div
                      key={ev.id}
                      className="relative flex flex-col justify-between rounded-xl border border-border/80 bg-gradient-to-b from-surface to-surface/90 p-4 shadow-2xs space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Header: Title and Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-foreground text-sm line-clamp-1">
                              {titleVsParts.length === 2 ? (
                                <>
                                  <span>{titleVsParts[0]}</span>
                                  <span className="mx-1 inline-flex items-center rounded bg-primary/10 px-1 text-[9px] font-black uppercase text-primary">
                                    VS
                                  </span>
                                  <span className="text-foreground/90">{titleVsParts[1]}</span>
                                </>
                              ) : (
                                formattedTitle
                              )}
                            </h4>
                          </div>
                          <StatusBadge status={liveCase} />
                        </div>

                        {/* Metadata Chips: Serial No with Lawyer Edit Icon */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary shadow-2xs">
                            <Hash className="h-3 w-3 shrink-0" />
                            <span>Serial: {serialDisplay}</span>
                            {isLawyer && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenSerialModal(liveCase);
                                }}
                                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded text-primary hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                                title="Update Serial Case Number"
                                aria-label="Update Serial Case Number"
                              >
                                <Pencil className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </span>

                          {serialDisplay !== liveCase.id && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background/80 px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground shadow-2xs">
                              ID: {liveCase.id}
                            </span>
                          )}

                          {liveCase.caseDetails?.cnr && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background/80 px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground shadow-2xs">
                              CNR: {liveCase.caseDetails.cnr}
                            </span>
                          )}

                          {liveCase.citizenName && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-background/80 px-2 py-0.5 text-[10.5px] text-muted-foreground shadow-2xs">
                              <User className="h-3 w-3 text-primary/70" />
                              Client: {liveCase.citizenName}
                            </span>
                          )}
                        </div>

                        {/* Hearing Purpose Banner */}
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-foreground flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-foreground">
                              {ev.purpose}
                            </span>
                          </div>
                          {ev.time && (
                            <span className="font-mono text-[11px] text-primary font-bold">
                              {ev.time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-1 border-t border-border/50 pt-2.5">
                        <IconButton
                          variant="tonal"
                          title="View case details"
                          ariaLabel={`View case ${liveCase.title}`}
                          onClick={() =>
                            navigate({
                              to: isLawyer ? "/lawyer/cases/$id" : "/citizen/cases/$id",
                              params: { id: liveCase.id },
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </IconButton>

                        {isLawyer && (
                          <IconButton
                            variant="tonal"
                            title="Edit case stage or details"
                            ariaLabel={`Edit case ${liveCase.id}`}
                            onClick={() => onOpenEditModal(liveCase)}
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                        )}

                        <IconButton
                          variant="tonal"
                          title={`Attachments${attachmentCount > 0 ? ` (${attachmentCount})` : ""}`}
                          ariaLabel={`Manage attachments for case ${liveCase.id}`}
                          onClick={() => onOpenAttachments(liveCase.id)}
                        >
                          <Paperclip className="h-4 w-4" />
                        </IconButton>

                        {(isLawyer || liveCase.lawyerName) && (
                          <ChatButton caseItem={liveCase} role={role} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Sub-tab 2: Daily Notes View ──────────────────────────────────────── */}
        {calendarSubTab === "daily" && (
          <div className="space-y-3.5">
            {/* Filter toolbar and stats */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDailyViewFilter("selectedDate")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    dailyViewFilter === "selectedDate"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  This Date ({selectedDateNotes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDailyViewFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    dailyViewFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  All Notes ({dairyNotes.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshDairyNotes}
                  disabled={isRefreshingDairy}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer border border-border/40"
                  title="Refresh notes from server (GET)"
                  aria-label="Refresh notes from server"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRefreshingDairy && "animate-spin text-primary")} />
                </button>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {displayedNotes.filter((n) => n.isCompleted).length} of {displayedNotes.length} completed
                </span>
              </div>
            </div>

            {/* Note List / Empty state */}
            {displayedNotes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-xs text-muted-foreground space-y-3">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm">
                    {dailyViewFilter === "selectedDate"
                      ? `No daily notes for ${selectedDateFormatted}`
                      : "No daily notes recorded yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">
                    Click the + button next to Daily tab above to write a note for this date.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayedNotes.map((note) => {
                  return (
                    <div
                      key={note.id}
                      className={cn(
                        "relative flex flex-col justify-between rounded-xl border p-4 shadow-2xs space-y-3 transition-all",
                        note.isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-950/10"
                          : "border-border/80 bg-gradient-to-b from-surface to-surface/90 hover:border-primary/40",
                      )}
                    >
                      {/* Note Header: M3 Switch + Status badge + Edit + Delete */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            selected={note.isCompleted}
                            onChange={() => handleToggleNoteCompleted(note.id, note.isCompleted)}
                            ariaLabel="Toggle note completed status"
                          />
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border",
                              note.isCompleted
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                            )}
                          >
                            {note.isCompleted ? "Completed" : "Pending"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNote(note);
                              setIsAddNoteOpen(true);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                            title="Edit note remarks"
                            aria-label="Edit note remarks"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                            title="Delete note"
                            aria-label="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Note Metadata Badges: Category & Linked Case */}
                      {(note.category || note.caseId) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {note.category && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary shadow-2xs">
                              <span>{note.category}</span>
                            </span>
                          )}
                          {note.caseId && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground shadow-2xs font-mono">
                              <span>Case: {note.caseId}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Note Content */}
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm font-medium leading-relaxed whitespace-pre-wrap break-words",
                            note.isCompleted
                              ? "line-through text-muted-foreground/75 italic"
                              : "text-foreground",
                          )}
                        >
                          {note.notes}
                        </p>
                      </div>

                      {/* Note Footer: Date and Time stamp */}
                      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-mono font-medium">
                          <CalendarIcon className="h-3 w-3 text-primary/70" />
                          {note.entryDate}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/80">
                          {formatDateTime(note.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Daily Note Modal (100% Production Ready) ───────────────────── */}
      <AddDailyNoteModal
        open={isAddNoteOpen}
        onClose={() => {
          setIsAddNoteOpen(false);
          setEditingNote(null);
        }}
        userId={currentUserId}
        initialDate={selectedDate}
        noteToEdit={editingNote}
        cases={cases}
        onSuccess={() => {
          setDairyNotes(getDairyNotes());
          setCalendarSubTab("daily");
          setEditingNote(null);
        }}
      />
    </div>
  );
}
