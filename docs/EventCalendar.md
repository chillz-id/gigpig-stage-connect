// EventCalendar - DatePicker-style mini-calendar for Stand Up Sydney events
// Displays a month view with show dates highlighted and clickable for Humanitix popup
// Supports filtering by tag to show multiple related events on one calendar
// Festival mode shows a fixed date range (e.g., full MICF run) without month navigation
// Auto-fetches festival config from Supabase events_htx table based on eventTag
import {
    useState,
    useEffect,
    useMemo,
    startTransition,
    useCallback,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface Session {
    session_start: string
    url_tickets_popup: string
}

interface FestivalConfig {
    displayMode: "monthly" | "festival"
    festivalName: string
    festivalStart: string
    festivalEnd: string
}

interface EventCalendarProps {
    eventSlug: string
    eventTag: string
    supabaseUrl: string
    supabaseKey: string
    // Manual overrides (used if Supabase config not found)
    displayMode: string
    festivalName: string
    festivalStart: string
    festivalEnd: string
    backgroundColor: string
    showDateColor: string
    textColor: string
    showDateTextColor: string
    accentColor: string
    borderRadius: number
    highlightToday: boolean
    todayColor: string
    font: CSSProperties
    style?: CSSProperties
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function getToday(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null
    // Handle ISO date strings (from CMS date fields or Supabase)
    if (dateStr.includes("T")) {
        const d = new Date(dateStr)
        return isNaN(d.getTime())
            ? null
            : new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
    // Handle YYYY-MM-DD format
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
}

function formatDateRange(start: Date, end: Date): string {
    const startMonth = start.toLocaleString("en-AU", { month: "long" })
    const endMonth = end.toLocaleString("en-AU", { month: "long" })
    const year = end.getFullYear()

    if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`
}

function getWeeksBetween(start: Date, end: Date): Date[][] {
    const weeks: Date[][] = []
    const current = new Date(start)
    current.setDate(current.getDate() - current.getDay())

    while (current <= end) {
        const week: Date[] = []
        for (let i = 0; i < 7; i++) {
            week.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }
        weeks.push(week)
    }
    return weeks
}

/**
 * Event Calendar
 *
 * DatePicker-style mini-calendar showing a month view.
 * Show dates are highlighted and open Humanitix popup on click.
 *
 * IMPORTANT: Add this script to your site's <head> for the popup widget:
 * <script src="https://cdn.humanitix.com/widget/popup.js"></script>
 *
 * Use eventTag to show multiple related events (e.g., tour dates)
 * on one calendar. Use eventSlug for single-event pages.
 *
 * Query priority: First tries slug match, then falls back to tags.
 * This ensures events like "magicmiccomedy" work whether the value
 * is in the slug field or in the tags array.
 *
 * Festival Mode: Automatically detected from Supabase events_htx
 * table based on calendar_group matching eventTag. Shows a fixed
 * date range without month navigation - perfect for multi-week festivals.
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function EventCalendar(props: EventCalendarProps) {
    const {
        eventSlug = "",
        eventTag = "",
        supabaseUrl = "",
        supabaseKey = "",
        displayMode: propDisplayMode = "monthly",
        festivalName: propFestivalName = "Festival",
        festivalStart: propFestivalStart = "",
        festivalEnd: propFestivalEnd = "",
        backgroundColor = "#111111",
        showDateColor = "#FF5500",
        textColor = "#FFFFFF",
        showDateTextColor = "#FFFFFF",
        accentColor = "#FF5500",
        borderRadius = 12,
        highlightToday = true,
        todayColor = "#333333",
        font,
        style,
    } = props

    const [sessions, setSessions] = useState<Session[]>([])
    const [festivalConfig, setFestivalConfig] = useState<FestivalConfig | null>(
        null
    )
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const isStatic = useIsStaticRenderer()

    const today = useMemo(getToday, [])
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [currentYear, setCurrentYear] = useState(today.getFullYear())

    // Fetch festival config from Supabase events_htx based on calendar_group
    useEffect(() => {
        if (!supabaseUrl || !supabaseKey || !eventTag) {
            setFestivalConfig(null)
            return
        }

        const fetchFestivalConfig = async () => {
            try {
                const response = await fetch(
                    `${supabaseUrl}/rest/v1/events_htx?calendar_group=eq.${encodeURIComponent(eventTag)}&select=display_mode,festival_name,festival_start,festival_end&limit=1`,
                    {
                        headers: {
                            apikey: supabaseKey,
                            Authorization: `Bearer ${supabaseKey}`,
                        },
                    }
                )

                if (!response.ok) {
                    setFestivalConfig(null)
                    return
                }

                const data = await response.json()
                if (data.length > 0 && data[0].display_mode) {
                    const row = data[0]
                    setFestivalConfig({
                        displayMode: (
                            row.display_mode || "monthly"
                        ).toLowerCase() as "monthly" | "festival",
                        festivalName: row.festival_name || "Festival",
                        festivalStart: row.festival_start || "",
                        festivalEnd: row.festival_end || "",
                    })
                } else {
                    setFestivalConfig(null)
                }
            } catch {
                setFestivalConfig(null)
            }
        }

        fetchFestivalConfig()
    }, [eventTag, supabaseUrl, supabaseKey])

    // Use Supabase config if available, otherwise fall back to props
    const displayMode =
        festivalConfig?.displayMode ||
        ((propDisplayMode || "monthly").toLowerCase() as "monthly" | "festival")
    const festivalName = festivalConfig?.festivalName || propFestivalName
    const festivalStart = festivalConfig?.festivalStart || propFestivalStart
    const festivalEnd = festivalConfig?.festivalEnd || propFestivalEnd

    const festivalStartDate = useMemo(
        () => parseDate(festivalStart),
        [festivalStart]
    )
    const festivalEndDate = useMemo(() => parseDate(festivalEnd), [festivalEnd])

    useEffect(() => {
        if (!supabaseUrl || !supabaseKey) {
            setLoading(false)
            return
        }
        if (!eventTag && !eventSlug) {
            setLoading(false)
            return
        }

        const fetchSessions = async () => {
            try {
                // Determine the lookup value (eventTag takes priority, falls back to eventSlug)
                const lookupValue = eventTag || eventSlug

                // Strategy: Try slug first, then fall back to tags
                // This ensures events work whether the calendar_group matches slug or tags

                // First: Try matching by slug
                const slugQuery = `slug=eq.${encodeURIComponent(lookupValue)}&is_past=eq.false&order=session_start.asc`
                const slugResponse = await fetch(
                    `${supabaseUrl}/rest/v1/session_complete?${slugQuery}&select=session_start,url_tickets_popup`,
                    {
                        headers: {
                            apikey: supabaseKey,
                            Authorization: `Bearer ${supabaseKey}`,
                        },
                    }
                )

                if (!slugResponse.ok)
                    throw new Error("Failed to fetch sessions")

                let data = await slugResponse.json()

                // If no results from slug, try tags
                if (data.length === 0 && eventTag) {
                    const tagsQuery = `tags=cs.{${encodeURIComponent(eventTag)}}&is_past=eq.false&order=session_start.asc`
                    const tagsResponse = await fetch(
                        `${supabaseUrl}/rest/v1/session_complete?${tagsQuery}&select=session_start,url_tickets_popup`,
                        {
                            headers: {
                                apikey: supabaseKey,
                                Authorization: `Bearer ${supabaseKey}`,
                            },
                        }
                    )

                    if (tagsResponse.ok) {
                        data = await tagsResponse.json()
                    }
                }

                startTransition(() => {
                    setSessions(data)
                    setLoading(false)
                    if (displayMode === "monthly" && data.length > 0) {
                        const firstShowDate = new Date(data[0].session_start)
                        setCurrentMonth(firstShowDate.getMonth())
                        setCurrentYear(firstShowDate.getFullYear())
                    }
                })
            } catch (err) {
                startTransition(() => {
                    setError(
                        err instanceof Error ? err.message : "Unknown error"
                    )
                    setLoading(false)
                })
            }
        }

        fetchSessions()
    }, [eventSlug, eventTag, supabaseUrl, supabaseKey, displayMode])

    const showDatesMap = useMemo(() => {
        const map = new Map<string, Session>()
        sessions.forEach((session) => {
            const d = new Date(session.session_start)
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            if (!map.has(key)) map.set(key, session)
        })
        return map
    }, [sessions])

    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = []
        for (let i = 0; i < firstDay; i++) days.push(null)
        for (let d = 1; d <= daysInMonth; d++) days.push(d)
        while (days.length % 7 !== 0) days.push(null)
        return days
    }, [firstDay, daysInMonth])

    const festivalWeeks = useMemo(() => {
        if (!festivalStartDate || !festivalEndDate) return []
        return getWeeksBetween(festivalStartDate, festivalEndDate)
    }, [festivalStartDate, festivalEndDate])

    const monthName = useMemo(
        () =>
            new Date(currentYear, currentMonth, 1).toLocaleString("en-AU", {
                month: "long",
                year: "numeric",
            }),
        [currentMonth, currentYear]
    )

    const handlePrevMonth = useCallback(() => {
        startTransition(() => {
            if (currentMonth === 0) {
                setCurrentMonth(11)
                setCurrentYear(currentYear - 1)
            } else {
                setCurrentMonth(currentMonth - 1)
            }
        })
    }, [currentMonth, currentYear])

    const handleNextMonth = useCallback(() => {
        startTransition(() => {
            if (currentMonth === 11) {
                setCurrentMonth(0)
                setCurrentYear(currentYear + 1)
            } else {
                setCurrentMonth(currentMonth + 1)
            }
        })
    }, [currentMonth, currentYear])

    // Open ticket URL - works for multiple platforms:
    // - Humanitix URLs with ?widget=popup are intercepted by popup.js for modal
    // - Eventbrite and other URLs open directly in new tab
    const handleDateClick = (dateObj: Date) => {
        if (isStatic) return
        const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`
        const session = showDatesMap.get(key)
        if (session?.url_tickets_popup && typeof window !== "undefined") {
            window.open(session.url_tickets_popup, '_blank', 'noopener,noreferrer')
        }
    }

    const isInFestivalRange = (date: Date): boolean => {
        if (!festivalStartDate || !festivalEndDate) return false
        return date >= festivalStartDate && date <= festivalEndDate
    }

    if (loading) {
        return (
            <div
                style={{
                    ...containerStyle,
                    ...style,
                    background: backgroundColor,
                    borderRadius,
                    ...font,
                }}
            >
                <p style={{ color: textColor, textAlign: "center" }}>
                    Loading dates...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div
                style={{
                    ...containerStyle,
                    ...style,
                    background: backgroundColor,
                    borderRadius,
                    ...font,
                }}
            >
                <p style={{ color: textColor, textAlign: "center" }}>
                    Unable to load dates
                </p>
            </div>
        )
    }

    if (
        displayMode === "festival" &&
        (!festivalStartDate || !festivalEndDate)
    ) {
        return (
            <div
                style={{
                    ...containerStyle,
                    ...style,
                    background: backgroundColor,
                    borderRadius,
                    ...font,
                }}
            >
                <p
                    style={{
                        color: textColor,
                        textAlign: "center",
                        fontSize: 13,
                        opacity: 0.7,
                    }}
                >
                    Festival mode: configure dates in Supabase events_htx
                </p>
            </div>
        )
    }

    const noShows = sessions.length === 0

    // Festival Mode
    if (displayMode === "festival" && festivalStartDate && festivalEndDate) {
        return (
            <div
                style={{
                    ...containerStyle,
                    ...style,
                    background: backgroundColor,
                    borderRadius,
                    ...font,
                }}
            >
                <div style={festivalHeaderStyle}>
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: 18,
                            color: textColor,
                        }}
                    >
                        {festivalName}
                    </span>
                    <span
                        style={{
                            fontSize: 14,
                            color: textColor,
                            opacity: 0.7,
                            marginTop: 4,
                        }}
                    >
                        {formatDateRange(festivalStartDate, festivalEndDate)}
                    </span>
                </div>
                <div style={calendarWrapperStyle}>
                    <div style={gridStyle}>
                        {WEEKDAYS.map((wd) => (
                            <div key={wd} style={weekdayCellStyle}>
                                <span
                                    style={{
                                        color: accentColor,
                                        fontWeight: 500,
                                        fontSize: 12,
                                    }}
                                >
                                    {wd}
                                </span>
                            </div>
                        ))}
                    </div>
                    {festivalWeeks.map((week, weekIdx) => (
                        <div key={weekIdx} style={gridStyle}>
                            {week.map((dateObj, dayIdx) => {
                                const inRange = isInFestivalRange(dateObj)
                                const isToday =
                                    highlightToday && isSameDay(dateObj, today)
                                const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`
                                const hasShow = showDatesMap.has(key)
                                return (
                                    <div key={dayIdx} style={dayCellStyle}>
                                        <button
                                            aria-label={
                                                hasShow
                                                    ? `Book tickets for ${dateObj.toDateString()}`
                                                    : dateObj.toDateString()
                                            }
                                            onClick={() =>
                                                handleDateClick(dateObj)
                                            }
                                            type="button"
                                            disabled={!inRange}
                                            style={{
                                                ...dayButtonStyle,
                                                background: hasShow
                                                    ? showDateColor
                                                    : isToday
                                                      ? todayColor
                                                      : "transparent",
                                                color: hasShow
                                                    ? showDateTextColor
                                                    : isToday
                                                      ? accentColor
                                                      : textColor,
                                                fontWeight:
                                                    hasShow || isToday
                                                        ? 700
                                                        : 400,
                                                cursor:
                                                    hasShow && !isStatic
                                                        ? "pointer"
                                                        : "default",
                                                opacity: inRange
                                                    ? hasShow
                                                        ? 1
                                                        : 0.6
                                                    : 0.2,
                                            }}
                                        >
                                            {dateObj.getDate()}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
                {noShows && supabaseUrl && (
                    <p
                        style={{
                            color: textColor,
                            textAlign: "center",
                            fontSize: 13,
                            marginTop: 12,
                            opacity: 0.7,
                        }}
                    >
                        No shows scheduled
                    </p>
                )}
            </div>
        )
    }

    // Monthly Mode
    return (
        <div
            style={{
                ...containerStyle,
                ...style,
                background: backgroundColor,
                borderRadius,
                ...font,
            }}
        >
            <div style={headerStyle}>
                <button
                    aria-label="Previous month"
                    onClick={handlePrevMonth}
                    style={{ ...navButtonStyle, color: accentColor }}
                    type="button"
                >
                    &#8592;
                </button>
                <span
                    style={{ fontWeight: 600, fontSize: 18, color: textColor }}
                >
                    {monthName}
                </span>
                <button
                    aria-label="Next month"
                    onClick={handleNextMonth}
                    style={{ ...navButtonStyle, color: accentColor }}
                    type="button"
                >
                    &#8594;
                </button>
            </div>
            <div style={calendarWrapperStyle}>
                <div style={gridStyle}>
                    {WEEKDAYS.map((wd) => (
                        <div key={wd} style={weekdayCellStyle}>
                            <span
                                style={{
                                    color: accentColor,
                                    fontWeight: 500,
                                    fontSize: 12,
                                }}
                            >
                                {wd}
                            </span>
                        </div>
                    ))}
                </div>
                <div style={gridStyle}>
                    {calendarDays.map((day, i) => {
                        if (day === null)
                            return <div key={i} style={dayCellStyle} />
                        const dateObj = new Date(currentYear, currentMonth, day)
                        const isToday =
                            highlightToday && isSameDay(dateObj, today)
                        const key = `${currentYear}-${currentMonth}-${day}`
                        const hasShow = showDatesMap.has(key)
                        return (
                            <div key={i} style={dayCellStyle}>
                                <button
                                    aria-label={
                                        hasShow
                                            ? `Book tickets for ${dateObj.toDateString()}`
                                            : dateObj.toDateString()
                                    }
                                    onClick={() => handleDateClick(dateObj)}
                                    type="button"
                                    style={{
                                        ...dayButtonStyle,
                                        background: hasShow
                                            ? showDateColor
                                            : isToday
                                              ? todayColor
                                              : "transparent",
                                        color: hasShow
                                            ? showDateTextColor
                                            : isToday
                                              ? accentColor
                                              : textColor,
                                        fontWeight:
                                            hasShow || isToday ? 700 : 400,
                                        cursor:
                                            hasShow && !isStatic
                                                ? "pointer"
                                                : "default",
                                        opacity: hasShow ? 1 : 0.6,
                                    }}
                                >
                                    {day}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
            {noShows && supabaseUrl && (
                <p
                    style={{
                        color: textColor,
                        textAlign: "center",
                        fontSize: 13,
                        marginTop: 12,
                        opacity: 0.7,
                    }}
                >
                    No upcoming shows
                </p>
            )}
            {!supabaseUrl && (
                <p
                    style={{
                        color: textColor,
                        textAlign: "center",
                        fontSize: 13,
                        marginTop: 12,
                        opacity: 0.7,
                    }}
                >
                    Configure Supabase connection
                </p>
            )}
        </div>
    )
}

const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    padding: 24,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
}

const headerStyle: CSSProperties = {
    width: "100%",
    maxWidth: 280,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
}

const festivalHeaderStyle: CSSProperties = {
    width: "100%",
    maxWidth: 280,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 16,
}

const navButtonStyle: CSSProperties = {
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
    transition: "background 0.15s",
}

const calendarWrapperStyle: CSSProperties = {
    width: 280,
    display: "flex",
    flexDirection: "column",
    gap: 4,
}

const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 40px)",
    justifyContent: "center",
}

const weekdayCellStyle: CSSProperties = {
    width: 40,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const dayCellStyle: CSSProperties = {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const dayButtonStyle: CSSProperties = {
    width: 36,
    height: 36,
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s",
}

addPropertyControls(EventCalendar, {
    eventTag: {
        type: ControlType.String,
        title: "Event Tag",
        defaultValue: "",
        placeholder: "e.g., neel-kolhatkar",
        description: "Calendar group - tries slug match first, then tags",
    },
    eventSlug: {
        type: ControlType.String,
        title: "Event Slug",
        defaultValue: "",
        placeholder: "e.g., magicmiccomedy",
        description: "Show single event (used if Event Tag is empty)",
    },
    supabaseUrl: {
        type: ControlType.String,
        title: "Supabase URL",
        defaultValue: "",
        placeholder: "https://xxx.supabase.co",
    },
    supabaseKey: {
        type: ControlType.String,
        title: "Supabase Key",
        defaultValue: "",
        placeholder: "Your anon key",
        obscured: true,
    },
    displayMode: {
        type: ControlType.String,
        title: "Display Mode",
        defaultValue: "monthly",
        placeholder: "monthly or festival",
        description:
            "Override: 'monthly' or 'festival' (auto-detected from Supabase if eventTag set)",
    },
    festivalName: {
        type: ControlType.String,
        title: "Festival Name",
        defaultValue: "",
        placeholder: "e.g., MICF 2026",
        description: "Override: auto-loaded from Supabase if eventTag set",
    },
    festivalStart: {
        type: ControlType.String,
        title: "Festival Start",
        defaultValue: "",
        placeholder: "YYYY-MM-DD",
        description: "Override: auto-loaded from Supabase if eventTag set",
    },
    festivalEnd: {
        type: ControlType.String,
        title: "Festival End",
        defaultValue: "",
        placeholder: "YYYY-MM-DD",
        description: "Override: auto-loaded from Supabase if eventTag set",
    },
    highlightToday: {
        type: ControlType.Boolean,
        title: "Highlight Today",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    showDateColor: {
        type: ControlType.Color,
        title: "Show Date",
        defaultValue: "#FF5500",
    },
    showDateTextColor: {
        type: ControlType.Color,
        title: "Show Text",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#FF5500",
    },
    todayColor: {
        type: ControlType.Color,
        title: "Today BG",
        defaultValue: "#333333",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
        },
    },
})
