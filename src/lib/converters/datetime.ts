export interface EpochDetails {
  seconds: number;
  milliseconds: number;
  microseconds: string;
  nanoseconds: string;
  resolution: "seconds" | "milliseconds" | "microseconds" | "nanoseconds";
  utcIso: string;
  utcRfc2822: string;
  utcFormatted: string;
  localFormatted: string;
  localTimezone: string;
  relativeTime: string;
  dayOfWeek: string;
  dayOfYear: number;
  weekNumber: number;
  isLeapYear: boolean;
  rawDate: Date;
}

export interface DateDifference {
  totalDays: number;
  businessDays: number;
  weekendDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  humanized: string;
  isPast: boolean;
}

export interface TimezoneCity {
  id: string;
  city: string;
  country: string;
  timeZone: string;
  abbr: string;
  utcOffsetStr: string;
  currentLocalTime: string;
  hour: number;
  status: "workday" | "extended" | "night";
}

export interface CronScheduleResult {
  expression: string;
  isValid: boolean;
  explanation: string;
  nextRuns: Date[];
  error?: string;
}

export interface DateTimePreset {
  id: string;
  name: string;
  description: string;
  type: "epoch" | "math" | "tz" | "cron";
  value: string;
}

// Auto-detect resolution from digits count
export function detectEpochResolution(
  input: string | number
): "seconds" | "milliseconds" | "microseconds" | "nanoseconds" {
  const digits = String(input).replace(/[^\d]/g, "").length;
  if (digits <= 11) return "seconds";
  if (digits <= 14) return "milliseconds";
  if (digits <= 17) return "microseconds";
  return "nanoseconds";
}

// Leap year checker
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Day of year calculation
export function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ISO Week number calculation
export function getIsoWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
}

// Format relative human time (e.g. "in 3 hours", "2 days ago")
export function getRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffSeconds = Math.round((date.getTime() - baseDate.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const absDiff = Math.abs(diffSeconds);
  if (absDiff < 60) return rtf.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, "year");
}

/**
 * Parses any epoch string or number, automatically detecting resolution,
 * and produces formatted UTC and local date representations.
 */
export function parseEpoch(
  input: string | number,
  overrideResolution?: "seconds" | "milliseconds" | "microseconds" | "nanoseconds"
): EpochDetails {
  const cleanStr = String(input).trim();
  const num = parseFloat(cleanStr);
  if (isNaN(num)) {
    throw new Error(`Invalid numeric timestamp: "${cleanStr}"`);
  }

  const resolution = overrideResolution || detectEpochResolution(cleanStr);

  let ms = 0;
  let seconds = 0;
  let microseconds = "0";
  let nanoseconds = "0";

  switch (resolution) {
    case "seconds":
      seconds = Math.floor(num);
      ms = Math.round(num * 1000);
      microseconds = `${seconds}000000`;
      nanoseconds = `${seconds}000000000`;
      break;
    case "milliseconds":
      ms = Math.round(num);
      seconds = Math.floor(num / 1000);
      microseconds = `${ms}000`;
      nanoseconds = `${ms}000000`;
      break;
    case "microseconds":
      ms = Math.round(num / 1000);
      seconds = Math.floor(num / 1000000);
      microseconds = String(Math.floor(num));
      nanoseconds = `${Math.floor(num)}000`;
      break;
    case "nanoseconds":
      ms = Math.round(num / 1000000);
      seconds = Math.floor(num / 1000000000);
      microseconds = String(Math.floor(num / 1000));
      nanoseconds = String(Math.floor(num));
      break;
  }

  const date = new Date(ms);
  if (isNaN(date.getTime())) {
    throw new Error("Date is outside valid representable range.");
  }

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeek = days[date.getUTCDay()];
  const dayOfYear = getDayOfYear(date);
  const weekNumber = getIsoWeekNumber(date);
  const leap = isLeapYear(date.getUTCFullYear());

  const localTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";

  // UTC Formatted
  const utcIso = date.toISOString();
  const utcRfc2822 = date.toUTCString();
  const utcFormatted = `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")} ${String(
    date.getUTCHours()
  ).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}:${String(
    date.getUTCSeconds()
  ).padStart(2, "0")}.${String(date.getUTCMilliseconds()).padStart(3, "0")} UTC`;

  // Local Formatted
  const localFormatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  }).format(date);

  const relativeTime = getRelativeTime(date);

  return {
    seconds,
    milliseconds: ms,
    microseconds,
    nanoseconds,
    resolution,
    utcIso,
    utcRfc2822,
    utcFormatted,
    localFormatted,
    localTimezone,
    relativeTime,
    dayOfWeek,
    dayOfYear,
    weekNumber,
    isLeapYear: leap,
    rawDate: date,
  };
}

/**
 * Calculates interval difference between two dates, including business days.
 */
export function calculateDateDifference(
  startDate: Date,
  endDate: Date
): DateDifference {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const isPast = endMs < startMs;

  const earlier = isPast ? endDate : startDate;
  const later = isPast ? startDate : endDate;

  const diffMs = later.getTime() - earlier.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  // Business days calculation (skipping Sat=6 and Sun=0)
  let businessDays = 0;
  let weekendDays = 0;
  const cur = new Date(earlier.getTime());
  cur.setHours(0, 0, 0, 0);

  const endLimit = new Date(later.getTime());
  endLimit.setHours(0, 0, 0, 0);

  while (cur < endLimit) {
    const day = cur.getDay();
    if (day === 0 || day === 6) {
      weekendDays++;
    } else {
      businessDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  // Humanized breakdown
  const weeks = Math.floor(totalDays / 7);
  const remDays = totalDays % 7;
  const remHours = totalHours % 24;
  const remMins = totalMinutes % 60;
  const remSecs = totalSeconds % 60;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} ${weeks === 1 ? "week" : "weeks"}`);
  if (remDays > 0) parts.push(`${remDays} ${remDays === 1 ? "day" : "days"}`);
  if (remHours > 0) parts.push(`${remHours} ${remHours === 1 ? "hour" : "hours"}`);
  if (remMins > 0) parts.push(`${remMins} min`);
  if (remSecs > 0 || parts.length === 0) parts.push(`${remSecs} sec`);

  return {
    totalDays,
    businessDays,
    weekendDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    humanized: parts.join(", "),
    isPast,
  };
}

/**
 * Adds or subtracts duration units to a starting date.
 */
export function addDateDuration(
  startDate: Date,
  amount: number,
  unit: "days" | "businessDays" | "weeks" | "months" | "years" | "hours"
): Date {
  const result = new Date(startDate.getTime());

  if (unit === "businessDays") {
    let added = 0;
    const step = amount >= 0 ? 1 : -1;
    const target = Math.abs(amount);
    while (added < target) {
      result.setDate(result.getDate() + step);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return result;
  }

  switch (unit) {
    case "days":
      result.setDate(result.getDate() + amount);
      break;
    case "weeks":
      result.setDate(result.getDate() + amount * 7);
      break;
    case "months":
      result.setMonth(result.getMonth() + amount);
      break;
    case "years":
      result.setFullYear(result.getFullYear() + amount);
      break;
    case "hours":
      result.setHours(result.getHours() + amount);
      break;
  }

  return result;
}

export interface CompoundDuration {
  years: number;
  months: number;
  weeks: number;
  days: number;
  businessDays: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Parses natural language or shorthand duration strings like:
 * "4 days 3 hours, 27 min", "2 weeks 4 days", "5 business days 8 hours", "1 yr 2 mo"
 */
export function parseDurationString(input: string): CompoundDuration {
  const duration: CompoundDuration = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    businessDays: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (!input || !input.trim()) return duration;

  // Match business days first
  const bdayMatch = input.match(
    /(\d+)\s*(?:bd|bday|bdays|business\s*days?|biz\s*days?|working\s*days?)/i
  );
  if (bdayMatch) duration.businessDays = parseInt(bdayMatch[1], 10);

  const yrMatch = input.match(/(\d+)\s*(?:y|yr|yrs|year|years)/i);
  if (yrMatch) duration.years = parseInt(yrMatch[1], 10);

  const moMatch = input.match(/(\d+)\s*(?:mo|mos|month|months)/i);
  if (moMatch) duration.months = parseInt(moMatch[1], 10);

  const wkMatch = input.match(/(\d+)\s*(?:w|wk|wks|week|weeks)/i);
  if (wkMatch) duration.weeks = parseInt(wkMatch[1], 10);

  // Clean out business day tokens before matching calendar days
  const cleanedForDays = input.replace(
    /(?:bd|bday|bdays|business\s*days?|biz\s*days?|working\s*days?)/gi,
    ""
  );
  const dayMatch = cleanedForDays.match(/(\d+)\s*(?:d|day|days)/i);
  if (dayMatch) duration.days = parseInt(dayMatch[1], 10);

  const hrMatch = input.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)/i);
  if (hrMatch) duration.hours = parseInt(hrMatch[1], 10);

  const minMatch = input.match(/(\d+)\s*(?:m|min|mins|minute|minutes)/i);
  if (minMatch) duration.minutes = parseInt(minMatch[1], 10);

  const secMatch = input.match(/(\d+)\s*(?:s|sec|secs|second|seconds)/i);
  if (secMatch) duration.seconds = parseInt(secMatch[1], 10);

  return duration;
}

export function formatCompoundDuration(d: CompoundDuration): string {
  const parts: string[] = [];
  if (d.years) parts.push(`${d.years} ${d.years === 1 ? "year" : "years"}`);
  if (d.months) parts.push(`${d.months} ${d.months === 1 ? "month" : "months"}`);
  if (d.weeks) parts.push(`${d.weeks} ${d.weeks === 1 ? "week" : "weeks"}`);
  if (d.businessDays)
    parts.push(
      `${d.businessDays} ${d.businessDays === 1 ? "business day" : "business days"}`
    );
  if (d.days) parts.push(`${d.days} ${d.days === 1 ? "day" : "days"}`);
  if (d.hours) parts.push(`${d.hours} ${d.hours === 1 ? "hour" : "hours"}`);
  if (d.minutes) parts.push(`${d.minutes} ${d.minutes === 1 ? "min" : "mins"}`);
  if (d.seconds) parts.push(`${d.seconds} ${d.seconds === 1 ? "sec" : "secs"}`);
  return parts.join(", ") || "0 seconds";
}

/**
 * Adds or subtracts multiple compound duration values (years, months, weeks, days, business days, hours, mins, secs)
 * to a base date.
 */
export function addCompoundDuration(
  startDate: Date,
  duration: CompoundDuration,
  operation: "add" | "sub" = "add"
): Date {
  const result = new Date(startDate.getTime());
  const sign = operation === "add" ? 1 : -1;

  if (duration.years) {
    result.setFullYear(result.getFullYear() + sign * duration.years);
  }
  if (duration.months) {
    result.setMonth(result.getMonth() + sign * duration.months);
  }
  if (duration.weeks) {
    result.setDate(result.getDate() + sign * duration.weeks * 7);
  }
  if (duration.days) {
    result.setDate(result.getDate() + sign * duration.days);
  }
  if (duration.businessDays) {
    let added = 0;
    const step = sign;
    const target = duration.businessDays;
    while (added < target) {
      result.setDate(result.getDate() + step);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
  }
  if (duration.hours) {
    result.setHours(result.getHours() + sign * duration.hours);
  }
  if (duration.minutes) {
    result.setMinutes(result.getMinutes() + sign * duration.minutes);
  }
  if (duration.seconds) {
    result.setSeconds(result.getSeconds() + sign * duration.seconds);
  }

  return result;
}

export interface TimezoneCityConfig {
  id: string;
  city: string;
  country: string;
  timeZone: string;
}

// Standard Key Timezone Cities
export const KEY_TIMEZONE_CITIES: TimezoneCityConfig[] = [
  { id: "utc", city: "UTC", country: "Universal", timeZone: "UTC" },
  { id: "lon", city: "London", country: "United Kingdom", timeZone: "Europe/London" },
  { id: "par", city: "Paris / Berlin", country: "Europe", timeZone: "Europe/Paris" },
  { id: "nyc", city: "New York", country: "United States (East)", timeZone: "America/New_York" },
  { id: "sfo", city: "San Francisco", country: "United States (West)", timeZone: "America/Los_Angeles" },
  { id: "tyo", city: "Tokyo", country: "Japan", timeZone: "Asia/Tokyo" },
  { id: "dxb", city: "Dubai", country: "United Arab Emirates", timeZone: "Asia/Dubai" },
  { id: "syd", city: "Sydney", country: "Australia", timeZone: "Australia/Sydney" },
];

export const POPULAR_IANA_TIMEZONES: Array<{ timeZone: string; label: string }> = [
  { timeZone: "UTC", label: "UTC (Coordinated Universal Time)" },
  { timeZone: "America/New_York", label: "America/New_York (US Eastern Time)" },
  { timeZone: "America/Chicago", label: "America/Chicago (US Central Time)" },
  { timeZone: "America/Denver", label: "America/Denver (US Mountain Time)" },
  { timeZone: "America/Los_Angeles", label: "America/Los_Angeles (US Pacific Time)" },
  { timeZone: "America/Anchorage", label: "America/Anchorage (Alaska)" },
  { timeZone: "America/Honolulu", label: "America/Honolulu (Hawaii)" },
  { timeZone: "America/Toronto", label: "America/Toronto (Canada Eastern)" },
  { timeZone: "America/Vancouver", label: "America/Vancouver (Canada Pacific)" },
  { timeZone: "America/Sao_Paulo", label: "America/Sao_Paulo (Brazil)" },
  { timeZone: "America/Buenos_Aires", label: "America/Buenos_Aires (Argentina)" },
  { timeZone: "America/Mexico_City", label: "America/Mexico_City (Mexico)" },
  { timeZone: "Europe/London", label: "Europe/London (United Kingdom, GMT/BST)" },
  { timeZone: "Europe/Dublin", label: "Europe/Dublin (Ireland)" },
  { timeZone: "Europe/Paris", label: "Europe/Paris (France, CET)" },
  { timeZone: "Europe/Berlin", label: "Europe/Berlin (Germany, CET)" },
  { timeZone: "Europe/Amsterdam", label: "Europe/Amsterdam (Netherlands)" },
  { timeZone: "Europe/Rome", label: "Europe/Rome (Italy)" },
  { timeZone: "Europe/Madrid", label: "Europe/Madrid (Spain)" },
  { timeZone: "Europe/Stockholm", label: "Europe/Stockholm (Sweden)" },
  { timeZone: "Europe/Zurich", label: "Europe/Zurich (Switzerland)" },
  { timeZone: "Europe/Warsaw", label: "Europe/Warsaw (Poland)" },
  { timeZone: "Europe/Athens", label: "Europe/Athens (Greece, EET)" },
  { timeZone: "Europe/Istanbul", label: "Europe/Istanbul (Turkey)" },
  { timeZone: "Europe/Kyiv", label: "Europe/Kyiv (Ukraine)" },
  { timeZone: "Europe/Moscow", label: "Europe/Moscow (Russia, MSK)" },
  { timeZone: "Asia/Dubai", label: "Asia/Dubai (United Arab Emirates, GST)" },
  { timeZone: "Asia/Riyadh", label: "Asia/Riyadh (Saudi Arabia)" },
  { timeZone: "Asia/Jerusalem", label: "Asia/Jerusalem (Israel)" },
  { timeZone: "Asia/Kolkata", label: "Asia/Kolkata (India, IST)" },
  { timeZone: "Asia/Bangkok", label: "Asia/Bangkok (Thailand, Indochina)" },
  { timeZone: "Asia/Singapore", label: "Asia/Singapore (Singapore)" },
  { timeZone: "Asia/Hong_Kong", label: "Asia/Hong_Kong (Hong Kong)" },
  { timeZone: "Asia/Shanghai", label: "Asia/Shanghai (China Standard Time)" },
  { timeZone: "Asia/Tokyo", label: "Asia/Tokyo (Japan, JST)" },
  { timeZone: "Asia/Seoul", label: "Asia/Seoul (South Korea, KST)" },
  { timeZone: "Asia/Jakarta", label: "Asia/Jakarta (Indonesia)" },
  { timeZone: "Asia/Manila", label: "Asia/Manila (Philippines)" },
  { timeZone: "Asia/Taipei", label: "Asia/Taipei (Taiwan)" },
  { timeZone: "Australia/Sydney", label: "Australia/Sydney (Sydney, AEST)" },
  { timeZone: "Australia/Melbourne", label: "Australia/Melbourne (Melbourne)" },
  { timeZone: "Australia/Brisbane", label: "Australia/Brisbane (Brisbane)" },
  { timeZone: "Australia/Perth", label: "Australia/Perth (Perth, AWST)" },
  { timeZone: "Pacific/Auckland", label: "Pacific/Auckland (New Zealand)" },
  { timeZone: "Pacific/Fiji", label: "Pacific/Fiji (Fiji)" },
  { timeZone: "Africa/Cairo", label: "Africa/Cairo (Egypt)" },
  { timeZone: "Africa/Johannesburg", label: "Africa/Johannesburg (South Africa)" },
  { timeZone: "Africa/Lagos", label: "Africa/Lagos (Nigeria)" },
  { timeZone: "Africa/Nairobi", label: "Africa/Nairobi (Kenya)" },
];

export interface TimezoneOption {
  timeZone: string;
  label: string;
  region: string;
  citySuggestion: string;
  countrySuggestion: string;
}

export function getAllAvailableTimezones(): TimezoneOption[] {
  let rawList: string[] = [];
  if (
    typeof Intl !== "undefined" &&
    typeof (Intl as unknown as { supportedValuesOf?: (key: string) => string[] })
      .supportedValuesOf === "function"
  ) {
    try {
      rawList = (
        Intl as unknown as { supportedValuesOf: (key: string) => string[] }
      ).supportedValuesOf("timeZone");
    } catch {
      rawList = [];
    }
  }

  if (!rawList || rawList.length === 0) {
    rawList = POPULAR_IANA_TIMEZONES.map((p) => p.timeZone);
  }

  return rawList.map((tz) => {
    const popular = POPULAR_IANA_TIMEZONES.find((p) => p.timeZone === tz);
    const parts = tz.split("/");
    const rawRegion = parts.length > 1 ? parts[0] : "Universal";
    const rawCity =
      parts.length > 1 ? parts.slice(1).join(" / ").replace(/_/g, " ") : tz;

    let region = rawRegion;
    if (rawRegion === "America") region = "Americas";
    if (rawRegion === "Europe") region = "Europe";
    if (rawRegion === "Asia") region = "Asia & Middle East";
    if (rawRegion === "Australia" || rawRegion === "Pacific")
      region = "Australia & Pacific";
    if (rawRegion === "Africa") region = "Africa";
    if (rawRegion === "Etc" || tz === "UTC") region = "Universal / UTC";

    const label = popular ? popular.label : `${tz} (${rawCity})`;

    return {
      timeZone: tz,
      label,
      region,
      citySuggestion: rawCity,
      countrySuggestion: region,
    };
  });
}

export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates current time and 24-hour status for world timezone cities.
 */
export function calculateTimezonesMatrix(
  refDate: Date,
  cities: TimezoneCityConfig[] = KEY_TIMEZONE_CITIES
): TimezoneCity[] {
  return cities.map((c) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: c.timeZone,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        timeZoneName: "short",
      });

      const parts = formatter.formatToParts(refDate);
      const hourVal = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      const minVal = parts.find((p) => p.type === "minute")?.value || "00";
      const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "";

      let status: TimezoneCity["status"] = "night";
      if (hourVal >= 9 && hourVal < 17) {
        status = "workday";
      } else if ((hourVal >= 7 && hourVal < 9) || (hourVal >= 17 && hourVal < 21)) {
        status = "extended";
      }

      return {
        id: c.id,
        city: c.city,
        country: c.country,
        timeZone: c.timeZone,
        abbr: tzName,
        utcOffsetStr: tzName,
        currentLocalTime: `${String(hourVal).padStart(2, "0")}:${minVal}`,
        hour: hourVal,
        status,
      };
    } catch {
      return {
        id: c.id,
        city: c.city,
        country: c.country,
        timeZone: c.timeZone,
        abbr: "ERR",
        utcOffsetStr: "Invalid TZ",
        currentLocalTime: "--:--",
        hour: 0,
        status: "night",
      };
    }
  });
}

/**
 * Parses and validates a 5-part cron expression.
 * Returns natural English explanation and the next 10 occurrences.
 */
export function parseCronExpression(
  cronString: string,
  referenceDate: Date = new Date()
): CronScheduleResult {
  const parts = cronString.trim().split(/\s+/);
  if (parts.length < 5) {
    return {
      expression: cronString,
      isValid: false,
      explanation: "Cron must have at least 5 fields (minute, hour, dom, month, dow).",
      nextRuns: [],
      error: "Expected 5 fields: minute, hour, day-of-month, month, day-of-week",
    };
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Helper to parse individual field ranges
  function parseField(field: string, min: number, max: number): Set<number> {
    const allowed = new Set<number>();
    const tokens = field.split(",");

    for (const token of tokens) {
      if (token === "*") {
        for (let i = min; i <= max; i++) allowed.add(i);
      } else if (token.startsWith("*/")) {
        const step = parseInt(token.slice(2), 10);
        if (isNaN(step) || step <= 0) throw new Error(`Invalid step in ${token}`);
        for (let i = min; i <= max; i += step) allowed.add(i);
      } else if (token.includes("-")) {
        const [startStr, endStr] = token.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range in ${token}`);
        for (let i = start; i <= end; i++) {
          if (i >= min && i <= max) allowed.add(i);
        }
      } else {
        const val = parseInt(token, 10);
        if (isNaN(val) || val < min || val > max) {
          throw new Error(`Value ${token} out of range [${min}-${max}]`);
        }
        allowed.add(val);
      }
    }

    return allowed;
  }

  let allowedMinutes: Set<number>;
  let allowedHours: Set<number>;
  let allowedDom: Set<number>;
  let allowedMonths: Set<number>;
  let allowedDow: Set<number>;

  try {
    allowedMinutes = parseField(minStr, 0, 59);
    allowedHours = parseField(hourStr, 0, 23);
    allowedDom = parseField(domStr, 1, 31);
    allowedMonths = parseField(monthStr, 1, 12);
    allowedDow = parseField(dowStr, 0, 7); // 0 or 7 = Sunday
    if (allowedDow.has(7)) {
      allowedDow.add(0);
      allowedDow.delete(7);
    }
  } catch (err: unknown) {
    return {
      expression: cronString,
      isValid: false,
      explanation: "Syntax error in cron expression.",
      nextRuns: [],
      error: err instanceof Error ? err.message : "Syntax error",
    };
  }

  // Generate plain English explanation
  let minDesc = `at minute ${minStr}`;
  if (minStr === "*") minDesc = "every minute";
  else if (minStr.startsWith("*/")) minDesc = `every ${minStr.slice(2)} minutes`;

  let hourDesc = `past hour ${hourStr}`;
  if (hourStr === "*") hourDesc = "every hour";
  else if (hourStr.startsWith("*/")) hourDesc = `every ${hourStr.slice(2)} hours`;
  else if (hourStr === "9-17") hourDesc = "during business hours (09:00 - 17:00)";

  let dowDesc = "";
  if (dowStr === "1-5") dowDesc = "Monday through Friday";
  else if (dowStr === "0,6" || dowStr === "6,0") dowDesc = "on weekends";
  else if (dowStr !== "*") dowDesc = `on day-of-week ${dowStr}`;

  let domDesc = "";
  if (domStr !== "*") domDesc = `on day-of-month ${domStr}`;

  let monthDesc = "";
  if (monthStr !== "*") monthDesc = `in month ${monthStr}`;

  const explanationParts = [minDesc, hourDesc, domDesc, monthDesc, dowDesc].filter(Boolean);
  const explanation = `Runs ${explanationParts.join(", ")}.`;

  // Calculate next 10 runs
  const nextRuns: Date[] = [];
  const cur = new Date(referenceDate.getTime());
  cur.setSeconds(0, 0);
  cur.setMinutes(cur.getMinutes() + 1); // Start from next minute

  let iterations = 0;
  const maxIterations = 525600; // Max 1 year in minutes search limit

  while (nextRuns.length < 10 && iterations < maxIterations) {
    const minute = cur.getMinutes();
    const hour = cur.getHours();
    const dom = cur.getDate();
    const month = cur.getMonth() + 1;
    const dow = cur.getDay();

    if (
      allowedMinutes.has(minute) &&
      allowedHours.has(hour) &&
      allowedDom.has(dom) &&
      allowedMonths.has(month) &&
      allowedDow.has(dow)
    ) {
      nextRuns.push(new Date(cur.getTime()));
    }

    cur.setMinutes(cur.getMinutes() + 1);
    iterations++;
  }

  return {
    expression: cronString,
    isValid: true,
    explanation,
    nextRuns,
  };
}

// Built-in Presets
export const DATETIME_PRESETS: DateTimePreset[] = [
  {
    id: "multi-unit-duration",
    name: "Multi-Unit Duration (4d 3h 27m)",
    description: "Add multiple values (days, hours, minutes) simultaneously to calculate target deadlines.",
    type: "math",
    value: "4 days 3 hours 27 min",
  },
  {
    id: "business-days",
    name: "Sprint Deadline Math",
    description: "Calculate working days excluding weekends between dates.",
    type: "math",
    value: "sprint",
  },
  {
    id: "live-epoch",
    name: "Current Live Epoch",
    description: "Live UTC timestamp in seconds, milliseconds, microseconds, and nanoseconds.",
    type: "epoch",
    value: "current",
  },
  {
    id: "y2038-overflow",
    name: "Unix 2038 Problem (Y2038)",
    description: "32-bit signed integer epoch overflow boundary (2147483647).",
    type: "epoch",
    value: "2147483647",
  },
  {
    id: "cron-workdays",
    name: "Cron: Workday Hours",
    description: "Every 15 minutes between 9 AM and 5 PM, Monday through Friday.",
    type: "cron",
    value: "*/15 9-17 * * 1-5",
  },
  {
    id: "global-standup",
    name: "Global Meeting Matrix",
    description: "Multi-timezone workday overlap planner for remote engineering teams.",
    type: "tz",
    value: "matrix",
  },
];
