import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button, IconButton } from "@/components/m3";
import { StatusBadge, formatCaseVsTitle, getNextEntry } from "@/components/app/caseDocketShared";
import { ChatButton } from "@/components/app/CaseChat";
import { formatDateTime } from "@/lib/dateUtils";
import type { LegalCase } from "@/types";

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

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateIso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: CalendarEvent[];
    }> = [];

    // Leading padding days from prev month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthDate = new Date(currentYear, currentMonth - 1, dayNum);
      const iso = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        dateIso: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        events: eventsByDate.get(iso) || [],
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateIso: iso,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: iso === todayIso,
        events: eventsByDate.get(iso) || [],
      });
    }

    // Trailing padding days to fill 35 or 42 slots
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
      const iso = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateIso: iso,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        events: eventsByDate.get(iso) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate, todayIso]);

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
              {eventsThisMonthCount} {eventsThisMonthCount === 1 ? "hearing scheduled" : "hearings scheduled"} in {MONTH_NAMES[currentMonth]} {currentYear}
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

      {/* ── Monthly Grid ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-2xs">
        {/* Days of week row */}
        <div className="grid grid-cols-7 border-b border-border/80 bg-muted/40 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-2.5">
              {day}
            </div>
          ))}
        </div>

        {/* 7-column calendar matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/50">
          {calendarDays.map((day) => {
            const isSelected = day.dateIso === selectedDate;
            const hasEvents = day.events.length > 0;

            return (
              <div
                key={day.dateIso}
                onClick={() => setSelectedDate(day.dateIso)}
                className={`relative min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col justify-between ${
                  !day.isCurrentMonth
                    ? "bg-muted/15 text-muted-foreground/50"
                    : "bg-surface hover:bg-muted/30"
                } ${
                  isSelected
                    ? "ring-2 ring-inset ring-primary bg-primary/[0.04]"
                    : ""
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      day.isToday
                        ? "bg-primary text-primary-foreground shadow-2xs font-extrabold"
                        : isSelected
                          ? "bg-primary/20 text-primary font-bold"
                          : day.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {hasEvents && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary border border-primary/20">
                      {day.events.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                  {day.events.slice(0, 2).map((ev) => {
                    const serialDisplay =
                      ev.caseItem.serialCaseNumber ||
                      ev.caseItem.serial_case_number ||
                      ev.caseItem.id;
                    return (
                      <div
                        key={ev.id}
                        className="group relative flex items-center gap-1 truncate rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary shadow-2xs hover:bg-primary/20"
                        title={`${serialDisplay} · ${ev.purpose}`}
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span className="truncate font-mono font-bold">
                          {serialDisplay}
                        </span>
                      </div>
                    );
                  })}
                  {day.events.length > 2 && (
                    <div className="text-[9.5px] font-semibold text-muted-foreground pl-1">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected Date Schedule Panel ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Hearings on {selectedDateFormatted}
            </h3>
            {selectedDate === todayIso && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary border border-primary/20 uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {selectedEvents.length} {selectedEvents.length === 1 ? "hearing found" : "hearings found"}
          </span>
        </div>

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
    </div>
  );
}
