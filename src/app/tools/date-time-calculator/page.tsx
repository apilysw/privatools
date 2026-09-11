"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Copy,
  Check,
  Trash2,
  Calendar,
  Globe,
  Sliders,
  Play,
  Pause,
  ArrowRight,
  ArrowRightLeft,
  Plus,
  Minus,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  CheckCircle2,
  CalendarDays,
  CalendarCheck,
  Timer,
  Info,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  parseEpoch,
  calculateDateDifference,
  addDateDuration,
  calculateTimezonesMatrix,
  parseCronExpression,
  DATETIME_PRESETS,
  DateTimePreset,
  EpochDetails,
} from "@/lib/converters/datetime";

type StudioTab = "epoch" | "math" | "tz" | "cron";

export default function DateTimeCalculatorPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("epoch");
  const [activePreset, setActivePreset] = useState<string | null>("live-epoch");

  // Live Ticker State
  const [tickerTime, setTickerTime] = useState<number>(Date.now());
  const [isTickerRunning, setIsTickerRunning] = useState<boolean>(true);

  // Epoch Converter State
  const [epochInput, setEpochInput] = useState<string>(String(Math.floor(Date.now() / 1000)));
  const [epochResolution, setEpochResolution] = useState<
    "auto" | "seconds" | "milliseconds" | "microseconds" | "nanoseconds"
  >("auto");
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // Reverse Date -> Epoch State
  const [reverseDate, setReverseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reverseTime, setReverseTime] = useState<string>("12:00:00");
  const [reverseTz, setReverseTz] = useState<"utc" | "local">("utc");

  // Date Math State
  const [mathMode, setMathMode] = useState<"diff" | "add">("diff");
  const [diffDateA, setDiffDateA] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [diffDateB, setDiffDateB] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [addStartDate, setAddStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [addAmount, setAddAmount] = useState<number>(10);
  const [addUnit, setAddUnit] = useState<
    "businessDays" | "days" | "weeks" | "months" | "years" | "hours"
  >("businessDays");
  const [addOperation, setAddOperation] = useState<"add" | "sub">("add");

  // Timezone Matrix State
  const [matrixHourScrubber, setMatrixHourScrubber] = useState<number>(new Date().getUTCHours());

  // Cron State
  const [cronInput, setCronInput] = useState<string>("*/15 9-17 * * 1-5");

  // Live Ticker Interval
  useEffect(() => {
    if (!isTickerRunning) return;
    const interval = setInterval(() => {
      setTickerTime(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [isTickerRunning]);

  // Calculate parsed epoch details
  const epochDetails = useMemo<{ details?: EpochDetails; error?: string }>(() => {
    try {
      const res =
        epochResolution === "auto" ? undefined : epochResolution;
      const details = parseEpoch(epochInput, res);
      return { details };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Invalid timestamp" };
    }
  }, [epochInput, epochResolution]);

  // Calculate reverse date to epoch
  const reverseEpoch = useMemo(() => {
    try {
      let iso = `${reverseDate}T${reverseTime}`;
      if (reverseTz === "utc") iso += "Z";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      return {
        seconds: Math.floor(d.getTime() / 1000),
        milliseconds: d.getTime(),
        iso: d.toISOString(),
      };
    } catch {
      return null;
    }
  }, [reverseDate, reverseTime, reverseTz]);

  // Calculate Date Difference
  const dateDiffResult = useMemo(() => {
    try {
      const dA = new Date(`${diffDateA}T00:00:00`);
      const dB = new Date(`${diffDateB}T00:00:00`);
      if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return null;
      return calculateDateDifference(dA, dB);
    } catch {
      return null;
    }
  }, [diffDateA, diffDateB]);

  // Calculate Date Addition / Subtraction
  const addResultDate = useMemo(() => {
    try {
      const d = new Date(`${addStartDate}T00:00:00`);
      if (isNaN(d.getTime())) return null;
      const signedAmount = addOperation === "add" ? addAmount : -addAmount;
      return addDateDuration(d, signedAmount, addUnit);
    } catch {
      return null;
    }
  }, [addStartDate, addAmount, addUnit, addOperation]);

  // Calculate Timezone Matrix for scrubbed hour
  const timezoneCities = useMemo(() => {
    const base = new Date();
    base.setUTCHours(matrixHourScrubber, 0, 0, 0);
    return calculateTimezonesMatrix(base);
  }, [matrixHourScrubber]);

  // Calculate Cron Result
  const cronResult = useMemo(() => {
    return parseCronExpression(cronInput);
  }, [cronInput]);

  // Copy helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Preset Selection
  const handleSelectPreset = (p: DateTimePreset) => {
    setActivePreset(p.id);
    switch (p.type) {
      case "epoch":
        setActiveTab("epoch");
        if (p.value === "current") {
          setEpochInput(String(Math.floor(Date.now() / 1000)));
          setEpochResolution("seconds");
        } else {
          setEpochInput(p.value);
          setEpochResolution("seconds");
        }
        break;
      case "math":
        setActiveTab("math");
        setMathMode("diff");
        setDiffDateA(new Date().toISOString().split("T")[0]);
        setDiffDateB(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
        break;
      case "tz":
        setActiveTab("tz");
        setMatrixHourScrubber(14); // 14:00 UTC (9 AM EST, 2 PM London, 11 PM Tokyo)
        break;
      case "cron":
        setActiveTab("cron");
        setCronInput(p.value);
        break;
    }
  };

  // Clear Input
  const handleClear = () => {
    setEpochInput("");
    setCronInput("");
    setActivePreset(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          title="Date, Time, Epoch & Cron Precision Studio"
          description="High-precision Unix epoch timestamp converter (s/ms/µs/ns), working days date math, 24-hour visual timezone meeting planner, and Cron expression explainer with next 10 runs calculation."
          badge="Zero Egress"
        />
      </div>

      {/* Sample Presets Card (matches all other tools) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Sample Presets:
          </span>
          {DATETIME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              title={p.description}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                activePreset === p.id
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleClear}
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Input</span>
        </button>
      </div>

      {/* Primary Studio Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab("epoch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "epoch"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Live Epoch & Timestamp Converter</span>
        </button>

        <button
          onClick={() => setActiveTab("math")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "math"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Date Math & Duration</span>
        </button>

        <button
          onClick={() => setActiveTab("tz")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "tz"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>World Timezone Meeting Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("cron")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "cron"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Cron Schedule Studio</span>
        </button>
      </div>

      {/* TAB 1: Live Epoch & Timestamp Converter */}
      {activeTab === "epoch" && (
        <div className="space-y-6">
          {/* Live Clock Ticker Strip */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      isTickerRunning ? "bg-emerald-400 opacity-75" : "bg-zinc-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isTickerRunning ? "bg-emerald-500" : "bg-zinc-500"
                    }`}
                  />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Live Unix Epoch Precision Clock
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTickerRunning(!isTickerRunning)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  {isTickerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTickerRunning ? "Pause Clock" : "Resume Clock"}</span>
                </button>
                <button
                  onClick={() => {
                    setEpochInput(String(Math.floor(tickerTime / 1000)));
                    setEpochResolution("seconds");
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                >
                  Insert Current
                </button>
              </div>
            </div>

            {/* Live Ticker Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Seconds */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase">
                  <span>Seconds (s)</span>
                  <button
                    onClick={() => handleCopy("sec", String(Math.floor(tickerTime / 1000)))}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {copyStatus["sec"] ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.floor(tickerTime / 1000)}
                </p>
                <span className="text-[10px] text-zinc-400">10 digits</span>
              </div>

              {/* Milliseconds */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase">
                  <span>Milliseconds (ms)</span>
                  <button
                    onClick={() => handleCopy("ms", String(tickerTime))}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {copyStatus["ms"] ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {tickerTime}
                </p>
                <span className="text-[10px] text-zinc-400">13 digits (JavaScript Date)</span>
              </div>

              {/* Microseconds */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase">
                  <span>Microseconds (µs)</span>
                  <button
                    onClick={() => handleCopy("us", `${tickerTime}000`)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {copyStatus["us"] ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {tickerTime}000
                </p>
                <span className="text-[10px] text-zinc-400">16 digits (Databases / C)</span>
              </div>

              {/* Nanoseconds */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase">
                  <span>Nanoseconds (ns)</span>
                  <button
                    onClick={() => handleCopy("ns", `${tickerTime}000000`)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {copyStatus["ns"] ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {tickerTime}000000
                </p>
                <span className="text-[10px] text-zinc-400">19 digits (Unix Timespec / Go)</span>
              </div>
            </div>
          </div>

          {/* Converter Input Area */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Epoch Timestamp Input</span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    Supports s (10d), ms (13d), µs (16d), ns (19d)
                  </span>
                </label>
                <input
                  type="text"
                  value={epochInput}
                  onChange={(e) => {
                    setEpochInput(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="1789166280 or 1789166280000"
                  className="w-full p-3 font-mono text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Resolution Detection
                </label>
                <select
                  value={epochResolution}
                  onChange={(e) =>
                    setEpochResolution(
                      e.target.value as
                        | "auto"
                        | "seconds"
                        | "milliseconds"
                        | "microseconds"
                        | "nanoseconds"
                    )
                  }
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="auto">Auto-Detect (by digit count)</option>
                  <option value="seconds">Seconds (10 digits)</option>
                  <option value="milliseconds">Milliseconds (13 digits)</option>
                  <option value="microseconds">Microseconds (16 digits)</option>
                  <option value="nanoseconds">Nanoseconds (19 digits)</option>
                </select>
              </div>
            </div>

            {/* Error banner */}
            {epochDetails.error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{epochDetails.error}</span>
              </div>
            )}

            {/* Formatted Epoch Results */}
            {epochDetails.details && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* UTC ISO-8601 */}
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      UTC ISO-8601
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                        {epochDetails.details.utcIso}
                      </span>
                      <button
                        onClick={() => handleCopy("iso", epochDetails.details!.utcIso)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {copyStatus["iso"] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-zinc-500">Standard API interchange format</span>
                  </div>

                  {/* UTC RFC-2822 */}
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      RFC-2822 / HTTP Header
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate">
                        {epochDetails.details.utcRfc2822}
                      </span>
                      <button
                        onClick={() => handleCopy("rfc", epochDetails.details!.utcRfc2822)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {copyStatus["rfc"] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-zinc-500">HTTP Date & email timestamp</span>
                  </div>

                  {/* Local Browser Time */}
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Local Browser Time ({epochDetails.details.localTimezone})
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {epochDetails.details.localFormatted}
                      </span>
                      <button
                        onClick={() => handleCopy("local", epochDetails.details!.localFormatted)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {copyStatus["local"] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {epochDetails.details.relativeTime}
                    </span>
                  </div>
                </div>

                {/* Calendar Metadata Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-zinc-400 mr-1.5">Day of Week:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {epochDetails.details.dayOfWeek}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 mr-1.5">Day of Year:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        Day {epochDetails.details.dayOfYear} of {epochDetails.details.isLeapYear ? 366 : 365}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 mr-1.5">ISO Week:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        Week {epochDetails.details.weekNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 mr-1.5">Leap Year:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {epochDetails.details.isLeapYear ? "Yes (366 days)" : "No (365 days)"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400">
                    Detected: {epochDetails.details.resolution}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reverse Date to Epoch Area */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Reverse Converter: Human Date/Time to Epoch
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Date</label>
                <input
                  type="date"
                  value={reverseDate}
                  onChange={(e) => setReverseDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Time (HH:mm:ss)</label>
                <input
                  type="time"
                  step="1"
                  value={reverseTime}
                  onChange={(e) => setReverseTime(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400">Timezone Context</label>
                <select
                  value={reverseTz}
                  onChange={(e) => setReverseTz(e.target.value as "utc" | "local")}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="utc">UTC (Coordinated Universal Time)</option>
                  <option value="local">Local Browser Timezone</option>
                </select>
              </div>
            </div>

            {reverseEpoch && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-400 block">Generated Epoch Seconds:</span>
                  <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                    {reverseEpoch.seconds}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-400 block">Generated Epoch Milliseconds:</span>
                  <span className="font-mono font-bold text-base text-zinc-800 dark:text-zinc-200">
                    {reverseEpoch.milliseconds}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEpochInput(String(reverseEpoch.seconds));
                      setEpochResolution("seconds");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    Load into Inspector
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Date Math & Duration */}
      {activeTab === "math" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <button
              onClick={() => setMathMode("diff")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                mathMode === "diff"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Difference Between Dates (Business Days)
            </button>
            <button
              onClick={() => setMathMode("add")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                mathMode === "add"
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Add / Subtract Duration to Date
            </button>
          </div>

          {/* Mode 1: Difference Between Two Dates */}
          {mathMode === "diff" && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Start Date (Date A)
                  </label>
                  <input
                    type="date"
                    value={diffDateA}
                    onChange={(e) => setDiffDateA(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    End Date (Date B)
                  </label>
                  <input
                    type="date"
                    value={diffDateB}
                    onChange={(e) => setDiffDateB(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {dateDiffResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                      Total Interval Breakdown
                    </span>
                    <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {dateDiffResult.humanized} {dateDiffResult.isPast ? "(in the past)" : ""}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Working Days
                      </span>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {dateDiffResult.businessDays} days
                      </p>
                      <span className="text-[10px] text-zinc-400">Mon - Fri only</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Calendar Days
                      </span>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {dateDiffResult.totalDays} days
                      </p>
                      <span className="text-[10px] text-zinc-400">Includes weekends</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Weekend Days
                      </span>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {dateDiffResult.weekendDays} days
                      </p>
                      <span className="text-[10px] text-zinc-400">Sat & Sun</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Total Hours
                      </span>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {dateDiffResult.totalHours.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Total Minutes
                      </span>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {dateDiffResult.totalMinutes.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        Total Seconds
                      </span>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {dateDiffResult.totalSeconds.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Add / Subtract Duration to Date */}
          {mathMode === "add" && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Starting Date
                  </label>
                  <input
                    type="date"
                    value={addStartDate}
                    onChange={(e) => setAddStartDate(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Operation
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <button
                      onClick={() => setAddOperation("add")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                        addOperation === "add"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add (+)
                    </button>
                    <button
                      onClick={() => setAddOperation("sub")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                        addOperation === "sub"
                          ? "bg-red-500 text-white shadow-xs"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" /> Subtract (-)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Amount
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={addAmount}
                    onChange={(e) => setAddAmount(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Duration Unit
                  </label>
                  <select
                    value={addUnit}
                    onChange={(e) =>
                      setAddUnit(
                        e.target.value as
                          | "businessDays"
                          | "days"
                          | "weeks"
                          | "months"
                          | "years"
                          | "hours"
                      )
                    }
                    className="w-full p-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="businessDays">Business Days (Mon-Fri)</option>
                    <option value="days">Calendar Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              {addResultDate && (
                <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                      Calculated Target Date
                    </span>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "full",
                      }).format(addResultDate)}
                    </p>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      ISO: {addResultDate.toISOString().split("T")[0]}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEpochInput(String(Math.floor(addResultDate.getTime() / 1000)));
                      setActiveTab("epoch");
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    Inspect in Epoch Tool →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: World Timezone Meeting Matrix */}
      {activeTab === "tz" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Interactive 24-Hour World Meeting Scrubber
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Drag the slider to preview working hours across global engineering hubs.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Workday (9-17)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Leisure (7-9, 17-21)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span className="text-zinc-600 dark:text-zinc-400">Night (21-7)</span>
                </span>
              </div>
            </div>

            {/* Scrubber Slider */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">UTC Reference Hour:</span>
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {String(matrixHourScrubber).padStart(2, "0")}:00 UTC
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                value={matrixHourScrubber}
                onChange={(e) => setMatrixHourScrubber(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Matrix Table / List */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                    <th className="p-3 font-semibold">City & Country</th>
                    <th className="p-3 font-semibold">Timezone / Abbr</th>
                    <th className="p-3 font-semibold">Local Time</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">24-Hour Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {timezoneCities.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="p-3">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                          {c.city}
                        </span>
                        <span className="text-[10px] text-zinc-400">{c.country}</span>
                      </td>
                      <td className="p-3 font-mono text-zinc-500">
                        {c.timeZone} ({c.abbr})
                      </td>
                      <td className="p-3 font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {c.currentLocalTime}
                      </td>
                      <td className="p-3">
                        {c.status === "workday" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            <Sun className="w-3 h-3 text-emerald-500" /> Workday
                          </span>
                        ) : c.status === "extended" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            <Sun className="w-3 h-3 text-amber-500" /> Leisure
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                            <Moon className="w-3 h-3 text-zinc-400" /> Night
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-0.5 h-3 w-48 bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
                          {Array.from({ length: 24 }).map((_, h) => {
                            const isCurrent = h === c.hour;
                            const isWork = h >= 9 && h < 17;
                            const isExt = (h >= 7 && h < 9) || (h >= 17 && h < 21);
                            let bg = "bg-zinc-300 dark:bg-zinc-700";
                            if (isWork) bg = "bg-emerald-500";
                            else if (isExt) bg = "bg-amber-500";

                            return (
                              <div
                                key={h}
                                className={`flex-1 h-full ${bg} ${
                                  isCurrent ? "ring-2 ring-white z-10 scale-125" : "opacity-80"
                                }`}
                                title={`${h}:00`}
                              />
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Cron Schedule Studio */}
      {activeTab === "cron" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Cron Expression (5-Field Standard)</span>
                <span className="text-[11px] font-normal text-zinc-400">
                  min hour dom month dow
                </span>
              </label>
              <input
                type="text"
                value={cronInput}
                onChange={(e) => {
                  setCronInput(e.target.value);
                  setActivePreset(null);
                }}
                placeholder="*/15 9-17 * * 1-5"
                className="w-full p-3 font-mono text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Quick Templates */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-zinc-400 mr-1 font-semibold">Templates:</span>
              {[
                { label: "Every minute", cron: "* * * * *" },
                { label: "Every 5 mins", cron: "*/5 * * * *" },
                { label: "Hourly", cron: "0 * * * *" },
                { label: "Daily at midnight", cron: "0 0 * * *" },
                { label: "Weekdays at 9 AM", cron: "0 9 * * 1-5" },
                { label: "Workday quarters", cron: "*/15 9-17 * * 1-5" },
                { label: "Monthly on 1st", cron: "0 0 1 * *" },
              ].map((tmpl) => (
                <button
                  key={tmpl.cron}
                  onClick={() => setCronInput(tmpl.cron)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-[11px] font-mono"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            {/* Natural English Explanation Banner */}
            {cronResult.isValid ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Plain English Schedule Translation
                </span>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {cronResult.explanation}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cronResult.error}</span>
              </div>
            )}

            {/* Next 10 Runs Table */}
            {cronResult.isValid && cronResult.nextRuns.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                  Next 10 Scheduled Executions (Local Time)
                </span>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3 font-semibold">#</th>
                        <th className="p-3 font-semibold">Execution Date & Time</th>
                        <th className="p-3 font-semibold">UTC ISO-8601</th>
                        <th className="p-3 font-semibold text-right">Countdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                      {cronResult.nextRuns.map((run, i) => {
                        const diffMins = Math.round((run.getTime() - Date.now()) / 60000);
                        const countdown =
                          diffMins < 60
                            ? `in ${diffMins} min`
                            : diffMins < 1440
                            ? `in ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
                            : `in ${Math.floor(diffMins / 1440)} days`;

                        return (
                          <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                            <td className="p-3 text-zinc-400">{i + 1}</td>
                            <td className="p-3 font-sans font-bold text-zinc-800 dark:text-zinc-200">
                              {new Intl.DateTimeFormat("en-US", {
                                dateStyle: "medium",
                                timeStyle: "medium",
                              }).format(run)}
                            </td>
                            <td className="p-3 text-zinc-500">{run.toISOString()}</td>
                            <td className="p-3 text-right font-sans font-bold text-emerald-600 dark:text-emerald-400">
                              {countdown}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
