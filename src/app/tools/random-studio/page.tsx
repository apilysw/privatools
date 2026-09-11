"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dices,
  Shuffle,
  KeyRound,
  Binary,
  Activity,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  HelpCircle,
  ArrowRight,
  Download,
  Trash2,
  Sliders,
  Hash,
  Lock,
  Percent,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  getRandomBytes,
  bytesToHex,
  getRandomInt,
  getRandomFloat,
  generateSecretServerSeed,
  computeCommitmentHash,
  computeRollHmac,
  deriveNumberFromHmac,
  verifyProvablyFairRoll,
  ProvablyFairRoll,
  VerificationAuditResult,
  parseAndRollDice,
  DiceRollResult,
  PolyhedralDie,
  generateRandomNumberBatch,
  RangeOptions,
  generateNormalDistribution,
  GaussianResult,
  shuffleList,
  pickWinners,
  splitIntoGroups,
  generateDicewarePassphrase,
  DicewareOptions,
  generateCryptographicPassword,
  PasswordOptions,
  generateUuidV4,
  generateUuidV7,
  generateNanoId,
  auditRandomness,
  RandomnessAudit,
} from "@/lib/converters/random";

type StudioTab = "provable" | "numbers" | "dice" | "shuffle" | "crypto" | "audit";

interface PresetItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const PRESETS: PresetItem[] = [
  {
    id: "dnd-ability",
    name: "D&D Ability Scores",
    description: "4d6 drop lowest (4d6k3) rolled 6 times for character ability scores.",
    icon: "🎲",
  },
  {
    id: "provable-roll",
    name: "Provably Fair 1–100",
    description: "Cryptographic SHA-256 pre-committed roll with client seed & nonce.",
    icon: "🛡️",
  },
  {
    id: "lottery-649",
    name: "Lottery Draw 6/49",
    description: "6 unique numbers from 1 to 49, sorted ascending.",
    icon: "🎟️",
  },
  {
    id: "eff-diceware",
    name: "EFF 6-Word Diceware",
    description: "6-word high-entropy passphrase (~77.5 bits) for password managers.",
    icon: "🔑",
  },
  {
    id: "gaussian-bell",
    name: "Gaussian Bell Curve",
    description: "1,000 Box-Muller normal distribution samples (μ=100, σ=15).",
    icon: "📊",
  },
  {
    id: "uuid-v7",
    name: "UUID v7 Generator",
    description: "5 time-ordered RFC 9562 UUIDs with millisecond precision.",
    icon: "🆔",
  },
];

const SAMPLE_NAMES = [
  "Alice Smith",
  "Bob Johnson",
  "Charlie Brown",
  "Diana Prince",
  "Evan Wright",
  "Fiona Gallagher",
  "George Clark",
  "Hannah Abbott",
  "Ian Malcolm",
  "Julia Roberts",
  "Kevin Bacon",
  "Luna Lovegood",
];

const SAMPLE_DECK = [
  "Ace of Spades",
  "King of Hearts",
  "Queen of Diamonds",
  "Jack of Clubs",
  "10 of Spades",
  "9 of Hearts",
  "8 of Diamonds",
  "7 of Clubs",
  "6 of Spades",
  "5 of Hearts",
];

export default function RandomStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("provable");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ==========================================================================
  // TAB 1: PROVABLY FAIR COMMIT-REVEAL STATE
  // ==========================================================================
  const [serverSeed, setServerSeed] = useState<string>("");
  const [commitmentHash, setCommitmentHash] = useState<string>("");
  const [isServerSeedRevealed, setIsServerSeedRevealed] = useState<boolean>(false);
  const [clientSeed, setClientSeed] = useState<string>("privatools-lucky-client");
  const [nonce, setNonce] = useState<number>(1);
  const [provableMin, setProvableMin] = useState<number>(1);
  const [provableMax, setProvableMax] = useState<number>(100);
  const [provableIsFloat, setProvableIsFloat] = useState<boolean>(false);
  const [provableDecimals, setProvableDecimals] = useState<number>(2);
  const [lastRoll, setLastRoll] = useState<ProvablyFairRoll | null>(null);
  const [rollHistory, setRollHistory] = useState<ProvablyFairRoll[]>([]);

  // Verifier State
  const [verifyServerSeed, setVerifyServerSeed] = useState<string>("");
  const [verifyClientSeed, setVerifyClientSeed] = useState<string>("");
  const [verifyNonce, setVerifyNonce] = useState<number>(1);
  const [verifyExpectedCommitment, setVerifyExpectedCommitment] = useState<string>("");
  const [verifyMin, setVerifyMin] = useState<number>(1);
  const [verifyMax, setVerifyMax] = useState<number>(100);
  const [verifyResult, setVerifyResult] = useState<VerificationAuditResult | null>(null);

  // Initialize server seed on mount
  useEffect(() => {
    const seed = generateSecretServerSeed();
    setServerSeed(seed);
    computeCommitmentHash(seed).then((h) => setCommitmentHash(h));
  }, []);

  const handleRegenerateServerSeed = useCallback(async () => {
    const seed = generateSecretServerSeed();
    setServerSeed(seed);
    const hash = await computeCommitmentHash(seed);
    setCommitmentHash(hash);
    setIsServerSeedRevealed(false);
  }, []);

  const handleProvableRoll = useCallback(async () => {
    if (!serverSeed) return;
    const hmacHash = await computeRollHmac(serverSeed, clientSeed, nonce);
    const resultNumber = deriveNumberFromHmac(
      hmacHash,
      provableMin,
      provableMax,
      provableIsFloat,
      provableDecimals
    );

    const roll: ProvablyFairRoll = {
      rollIndex: rollHistory.length + 1,
      nonce,
      clientSeed,
      serverSeed,
      commitmentHash,
      hmacHash,
      resultNumber,
      timestamp: new Date().toLocaleTimeString(),
    };

    setLastRoll(roll);
    setRollHistory((prev) => [roll, ...prev]);
    setNonce((prev) => prev + 1);
  }, [
    serverSeed,
    clientSeed,
    nonce,
    provableMin,
    provableMax,
    provableIsFloat,
    provableDecimals,
    rollHistory.length,
    commitmentHash,
  ]);

  const handleRunVerification = useCallback(async () => {
    if (!verifyServerSeed || !verifyExpectedCommitment) return;
    const res = await verifyProvablyFairRoll(
      verifyServerSeed,
      verifyClientSeed,
      verifyNonce,
      verifyExpectedCommitment,
      verifyMin,
      verifyMax
    );
    setVerifyResult(res);
  }, [
    verifyServerSeed,
    verifyClientSeed,
    verifyNonce,
    verifyExpectedCommitment,
    verifyMin,
    verifyMax,
  ]);

  const populateVerifierFromRoll = useCallback((r: ProvablyFairRoll) => {
    setVerifyServerSeed(r.serverSeed);
    setVerifyClientSeed(r.clientSeed);
    setVerifyNonce(r.nonce);
    setVerifyExpectedCommitment(r.commitmentHash);
    setVerifyMin(provableMin);
    setVerifyMax(provableMax);
    setVerifyResult(null);
  }, [provableMin, provableMax]);

  // ==========================================================================
  // TAB 2: CONFIGURABLE NUMBERS & GAUSSIAN DISTRIBUTION STATE
  // ==========================================================================
  const [numMode, setNumMode] = useState<"uniform" | "gaussian">("uniform");
  const [uniformMin, setUniformMin] = useState<number>(1);
  const [uniformMax, setUniformMax] = useState<number>(100);
  const [uniformCount, setUniformCount] = useState<number>(10);
  const [uniformIsFloat, setUniformIsFloat] = useState<boolean>(false);
  const [uniformDecimals, setUniformDecimals] = useState<number>(2);
  const [uniformUnique, setUniformUnique] = useState<boolean>(false);
  const [uniformSort, setUniformSort] = useState<"none" | "asc" | "desc">("none");
  const [uniformResults, setUniformResults] = useState<number[]>([]);

  // Gaussian state
  const [gaussMean, setGaussMean] = useState<number>(100);
  const [gaussStdDev, setGaussStdDev] = useState<number>(15);
  const [gaussCount, setGaussCount] = useState<number>(500);
  const [gaussDecimals, setGaussDecimals] = useState<number>(2);
  const [gaussResult, setGaussResult] = useState<GaussianResult | null>(null);

  const handleGenerateUniform = useCallback(() => {
    const res = generateRandomNumberBatch({
      min: uniformMin,
      max: uniformMax,
      count: uniformCount,
      isFloat: uniformIsFloat,
      decimalPlaces: uniformDecimals,
      unique: uniformUnique,
      sort: uniformSort,
    });
    setUniformResults(res);
  }, [
    uniformMin,
    uniformMax,
    uniformCount,
    uniformIsFloat,
    uniformDecimals,
    uniformUnique,
    uniformSort,
  ]);

  const handleGenerateGaussian = useCallback(() => {
    const res = generateNormalDistribution(
      gaussCount,
      gaussMean,
      gaussStdDev,
      gaussDecimals
    );
    setGaussResult(res);
  }, [gaussCount, gaussMean, gaussStdDev, gaussDecimals]);

  // Compute stats on uniform results
  const uniformStats = useMemo(() => {
    if (uniformResults.length === 0) return null;
    let sum = 0;
    let min = uniformResults[0];
    let max = uniformResults[0];
    for (const v of uniformResults) {
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const mean = Number((sum / uniformResults.length).toFixed(2));
    return { count: uniformResults.length, min, max, sum: Number(sum.toFixed(2)), mean };
  }, [uniformResults]);

  // ==========================================================================
  // TAB 3: TABLETOP POLYHEDRAL DICE ROLLER STATE
  // ==========================================================================
  const [diceNotation, setDiceNotation] = useState<string>("1d20");
  const [lastDiceRoll, setLastDiceRoll] = useState<DiceRollResult | null>(null);
  const [diceHistory, setDiceHistory] = useState<DiceRollResult[]>([]);

  const handleRollDice = useCallback((notationToRoll?: string) => {
    const target = notationToRoll || diceNotation;
    const res = parseAndRollDice(target);
    setLastDiceRoll(res);
    setDiceHistory((prev) => [res, ...prev.slice(0, 49)]);
  }, [diceNotation]);

  const handleQuickDieClick = useCallback((die: PolyhedralDie) => {
    const sides =
      die === "d4"
        ? 4
        : die === "d6"
        ? 6
        : die === "d8"
        ? 8
        : die === "d10"
        ? 10
        : die === "d12"
        ? 12
        : die === "d20"
        ? 20
        : 100;
    const res = parseAndRollDice(`1d${sides}`);
    setDiceNotation(`1d${sides}`);
    setLastDiceRoll(res);
    setDiceHistory((prev) => [res, ...prev.slice(0, 49)]);
  }, []);

  // ==========================================================================
  // TAB 4: FISHER-YATES LIST SHUFFLER & RAFFLE STATE
  // ==========================================================================
  const [shuffleMode, setShuffleMode] = useState<"shuffle" | "raffle" | "teams">("shuffle");
  const [shuffleInputText, setShuffleInputText] = useState<string>(SAMPLE_NAMES.join("\n"));
  const [raffleWinnerCount, setRaffleWinnerCount] = useState<number>(3);
  const [raffleWithReplacement, setRaffleWithReplacement] = useState<boolean>(false);
  const [teamCount, setTeamCount] = useState<number>(3);
  const [shuffledList, setShuffledList] = useState<string[]>([]);
  const [raffleWinners, setRaffleWinners] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[][]>([]);

  const parseInputItems = useCallback(() => {
    return shuffleInputText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [shuffleInputText]);

  const handleExecuteShuffle = useCallback(() => {
    const items = parseInputItems();
    if (items.length === 0) return;

    if (shuffleMode === "shuffle") {
      setShuffledList(shuffleList(items));
    } else if (shuffleMode === "raffle") {
      setRaffleWinners(pickWinners(items, raffleWinnerCount, raffleWithReplacement));
    } else if (shuffleMode === "teams") {
      setTeams(splitIntoGroups(items, teamCount));
    }
  }, [parseInputItems, shuffleMode, raffleWinnerCount, raffleWithReplacement, teamCount]);

  // ==========================================================================
  // TAB 5: DICEWARE & CRYPTOGRAPHIC TOKENS STATE
  // ==========================================================================
  const [cryptoMode, setCryptoMode] = useState<"diceware" | "password" | "uuid">("diceware");

  // Diceware
  const [diceWordCount, setDiceWordCount] = useState<number>(5);
  const [diceSeparator, setDiceSeparator] = useState<"-" | "_" | "." | " " | "/">("-");
  const [diceCapitalize, setDiceCapitalize] = useState<"lower" | "title" | "upper">("title");
  const [diceIncludeNumber, setDiceIncludeNumber] = useState<boolean>(true);
  const [dicewareResult, setDicewareResult] = useState<{
    passphrase: string;
    entropyBits: number;
  } | null>(null);

  // Password
  const [passLength, setPassLength] = useState<number>(16);
  const [passUpper, setPassUpper] = useState<boolean>(true);
  const [passLower, setPassLower] = useState<boolean>(true);
  const [passNumbers, setPassNumbers] = useState<boolean>(true);
  const [passSymbols, setPassSymbols] = useState<boolean>(true);
  const [passExcludeAmbiguous, setPassExcludeAmbiguous] = useState<boolean>(false);
  const [passwordResult, setPasswordResult] = useState<{
    password: string;
    entropyBits: number;
  } | null>(null);

  // UUIDs & Tokens
  const [uuidType, setUuidType] = useState<"v7" | "v4" | "nanoid">("v7");
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);

  const handleGenerateDiceware = useCallback(() => {
    const res = generateDicewarePassphrase({
      wordCount: diceWordCount,
      separator: diceSeparator,
      capitalize: diceCapitalize,
      includeNumber: diceIncludeNumber,
    });
    setDicewareResult(res);
  }, [diceWordCount, diceSeparator, diceCapitalize, diceIncludeNumber]);

  const handleGeneratePassword = useCallback(() => {
    const res = generateCryptographicPassword({
      length: passLength,
      includeUppercase: passUpper,
      includeLowercase: passLower,
      includeNumbers: passNumbers,
      includeSymbols: passSymbols,
      excludeAmbiguous: passExcludeAmbiguous,
    });
    setPasswordResult(res);
  }, [passLength, passUpper, passLower, passNumbers, passSymbols, passExcludeAmbiguous]);

  const handleGenerateTokens = useCallback(() => {
    const tokens: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      if (uuidType === "v7") tokens.push(generateUuidV7());
      else if (uuidType === "v4") tokens.push(generateUuidV4());
      else tokens.push(generateNanoId());
    }
    setGeneratedTokens(tokens);
  }, [uuidType, uuidCount]);

  // Initialize crypto results on first mount
  useEffect(() => {
    handleGenerateDiceware();
    handleGeneratePassword();
    handleGenerateTokens();
    handleGenerateUniform();
  }, [
    handleGenerateDiceware,
    handleGeneratePassword,
    handleGenerateTokens,
    handleGenerateUniform,
  ]);

  // ==========================================================================
  // TAB 6: STATISTICAL RANDOMNESS AUDIT STATE
  // ==========================================================================
  const [auditRawInput, setAuditRawInput] = useState<string>("");
  const [auditMin, setAuditMin] = useState<number>(1);
  const [auditMax, setAuditMax] = useState<number>(100);
  const [auditResult, setAuditResult] = useState<RandomnessAudit | null>(null);

  const handleRunAudit = useCallback(() => {
    const tokens = auditRawInput
      .replace(/,/g, " ")
      .split(/\s+/)
      .map((t) => parseFloat(t))
      .filter((n) => !isNaN(n));

    if (tokens.length === 0) return;
    const res = auditRandomness(tokens, auditMin, auditMax);
    setAuditResult(res);
  }, [auditRawInput, auditMin, auditMax]);

  const handleGenerateAuditSample = useCallback((count = 1000) => {
    const samples = generateRandomNumberBatch({
      min: auditMin,
      max: auditMax,
      count,
      isFloat: false,
    });
    setAuditRawInput(samples.join(", "));
    const res = auditRandomness(samples, auditMin, auditMax);
    setAuditResult(res);
  }, [auditMin, auditMax]);

  // Send Uniform Batch to Audit
  const handleSendToAudit = useCallback(() => {
    if (uniformResults.length === 0) return;
    setAuditMin(uniformMin);
    setAuditMax(uniformMax);
    setAuditRawInput(uniformResults.join(", "));
    const res = auditRandomness(uniformResults, uniformMin, uniformMax);
    setAuditResult(res);
    setActiveTab("audit");
  }, [uniformResults, uniformMin, uniformMax]);

  // ==========================================================================
  // PRESET HANDLERS
  // ==========================================================================
  const handleApplyPreset = useCallback((presetId: string) => {
    if (presetId === "dnd-ability") {
      setActiveTab("dice");
      setDiceNotation("4d6k3");
      const results: DiceRollResult[] = [];
      for (let i = 0; i < 6; i++) {
        results.push(parseAndRollDice("4d6k3"));
      }
      setLastDiceRoll(results[0]);
      setDiceHistory(results);
    } else if (presetId === "provable-roll") {
      setActiveTab("provable");
      setProvableMin(1);
      setProvableMax(100);
      setClientSeed("d20-lucky-roll");
      setNonce(1);
    } else if (presetId === "lottery-649") {
      setActiveTab("numbers");
      setNumMode("uniform");
      setUniformMin(1);
      setUniformMax(49);
      setUniformCount(6);
      setUniformUnique(true);
      setUniformSort("asc");
      const res = generateRandomNumberBatch({
        min: 1,
        max: 49,
        count: 6,
        unique: true,
        sort: "asc",
      });
      setUniformResults(res);
    } else if (presetId === "eff-diceware") {
      setActiveTab("crypto");
      setCryptoMode("diceware");
      setDiceWordCount(6);
      setDiceSeparator("-");
      setDiceCapitalize("title");
      setDiceIncludeNumber(true);
      const res = generateDicewarePassphrase({
        wordCount: 6,
        separator: "-",
        capitalize: "title",
        includeNumber: true,
      });
      setDicewareResult(res);
    } else if (presetId === "gaussian-bell") {
      setActiveTab("numbers");
      setNumMode("gaussian");
      setGaussMean(100);
      setGaussStdDev(15);
      setGaussCount(1000);
      setGaussDecimals(1);
      const res = generateNormalDistribution(1000, 100, 15, 1);
      setGaussResult(res);
    } else if (presetId === "uuid-v7") {
      setActiveTab("crypto");
      setCryptoMode("uuid");
      setUuidType("v7");
      setUuidCount(5);
      const tokens: string[] = [];
      for (let i = 0; i < 5; i++) tokens.push(generateUuidV7());
      setGeneratedTokens(tokens);
    }
  }, []);

  const handleResetToDefault = useCallback(() => {
    setActiveTab("provable");
    handleRegenerateServerSeed();
    setClientSeed("privatools-lucky-client");
    setNonce(1);
    setProvableMin(1);
    setProvableMax(100);
    setProvableIsFloat(false);
    setProvableDecimals(2);
    setLastRoll(null);
    setRollHistory([]);

    setNumMode("uniform");
    setUniformMin(1);
    setUniformMax(100);
    setUniformCount(10);
    setUniformIsFloat(false);
    setUniformDecimals(2);
    setUniformUnique(false);
    setUniformSort("none");
    setUniformResults([]);
    setGaussResult(null);

    setDiceNotation("1d20");
    setLastDiceRoll(null);
    setDiceHistory([]);

    setShuffleInputText(SAMPLE_NAMES.join("\n"));
    setShuffledList([]);
    setRaffleWinners([]);
    setTeams([]);

    setDiceWordCount(5);
    setDiceSeparator("-");
    setDiceCapitalize("title");
    setDiceIncludeNumber(true);

    setPassLength(16);
    setUuidType("v7");
    setUuidCount(5);

    setAuditRawInput("");
    setAuditResult(null);
  }, [handleRegenerateServerSeed]);

  // Copy helper
  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="print:hidden">
        <ToolHeader
          title="Provably Fair & Configurable Random Number Studio"
          description="Zero-egress client-side randomness studio. SHA-256 / HMAC-SHA256 provably fair commit-reveal scheme, uniform & Box-Muller Gaussian normal distributions, tabletop polyhedral dice roller, Fisher-Yates list shuffler, EFF Diceware passphrases, UUID v4/v7 tokens, and real-time Chi-Square & Shannon entropy statistical audit."
          badge="Zero Egress"
        />
      </div>

      {/* Top Presets Bar with Right-Aligned, Vertically Centered Reset Button */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              title={p.description}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleResetToDefault}
          className="shrink-0 whitespace-nowrap self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          title="Reset all settings to default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab("provable")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "provable"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Provably Fair Console</span>
        </button>

        <button
          onClick={() => setActiveTab("numbers")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "numbers"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Numbers & Gaussian</span>
        </button>

        <button
          onClick={() => setActiveTab("dice")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "dice"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Dices className="w-4 h-4" />
          <span>Tabletop Dice Roller</span>
        </button>

        <button
          onClick={() => setActiveTab("shuffle")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "shuffle"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Shuffler & Raffle</span>
        </button>

        <button
          onClick={() => setActiveTab("crypto")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "crypto"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Diceware & Tokens</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "audit"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Statistical Audit</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PROVABLY FAIR COMMIT-REVEAL CONSOLE */}
      {/* ==================================================================== */}
      {activeTab === "provable" && (
        <div className="space-y-6">
          {/* How Provably Fair Works Explanation Card */}
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-zinc-800 dark:text-zinc-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                  How Provably Fair Verification Works (Cryptographic Guarantee)
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  1. <strong>Pre-Commitment:</strong> Privatools generates a 256-bit secret and publishes its <code>SHA-256</code> hash before you roll. This commits the seed without revealing it.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  2. <strong>Client Input:</strong> You provide your own client seed and an incrementing nonce. Privatools cannot predict or alter your roll because the outcome is derived from <code>HMAC-SHA256(ServerSeed, ClientSeed:Nonce)</code>.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  3. <strong>Post-Roll Audit:</strong> Reveal the secret seed at any time to verify that the pre-commitment hash was never changed and that every roll was mathematically deterministic.
                </p>
              </div>
            </div>
          </div>

          {/* Server Seed Commitment & Roll Console Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Seed Card */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Server Seed & Pre-Commitment
                  </h3>
                </div>
                <button
                  onClick={handleRegenerateServerSeed}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  title="Generate a new server seed and re-commit"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate Seed</span>
                </button>
              </div>

              {/* Commitment Hash */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium">SHA-256 Pre-Commitment Hash:</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    Public & Locked
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all flex-1 select-all">
                    {commitmentHash || "Generating hash..."}
                  </code>
                  <button
                    onClick={() => copyToClipboard(commitmentHash, "commitment-hash")}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    title="Copy Commitment Hash"
                  >
                    {copiedKey === "commitment-hash" ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Secret Server Seed Reveal Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium">Secret Server Seed (256-bit):</span>
                  <button
                    onClick={() => setIsServerSeedRevealed(!isServerSeedRevealed)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {isServerSeedRevealed ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Hide Secret
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Reveal to Audit
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all flex-1 select-all">
                    {isServerSeedRevealed
                      ? serverSeed
                      : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                  </code>
                  {isServerSeedRevealed && (
                    <button
                      onClick={() => copyToClipboard(serverSeed, "server-seed")}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Copy Secret Server Seed"
                    >
                      {copiedKey === "server-seed" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {isServerSeedRevealed && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Revealed! Rotating seed is recommended for subsequent uncompromised rolls.
                  </p>
                )}
              </div>
            </div>

            {/* Roll Parameters & Trigger Card */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Dices className="w-4 h-4 text-emerald-500" />
                Roll Parameters
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Client Seed:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={clientSeed}
                      onChange={(e) => setClientSeed(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      onClick={() => setClientSeed(bytesToHex(getRandomBytes(8)))}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                      title="Generate random client seed"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Nonce (Counter):</label>
                  <input
                    type="number"
                    min={0}
                    value={nonce}
                    onChange={(e) => setNonce(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Min Value:</label>
                  <input
                    type="number"
                    value={provableMin}
                    onChange={(e) => setProvableMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Max Value:</label>
                  <input
                    type="number"
                    value={provableMax}
                    onChange={(e) => setProvableMax(parseFloat(e.target.value) || 100)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={provableIsFloat}
                    onChange={(e) => setProvableIsFloat(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Generate Floating Point</span>
                </label>

                {provableIsFloat && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span>Decimals:</span>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={provableDecimals}
                      onChange={(e) => setProvableDecimals(parseInt(e.target.value, 10) || 2)}
                      className="w-12 px-1.5 py-0.5 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleProvableRoll}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Dices className="w-4 h-4" />
                <span>Roll Provably Fair Number</span>
              </button>
            </div>
          </div>

          {/* Latest Roll Result Banner */}
          {lastRoll && (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                    Latest Provable Outcome (Nonce #{lastRoll.nonce})
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
                    {lastRoll.resultNumber}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-md w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">HMAC-SHA256 Signature:</span>
                    <button
                      onClick={() => copyToClipboard(lastRoll.hmacHash, "last-hmac")}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                    >
                      {copiedKey === "last-hmac" ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy HMAC
                    </button>
                  </div>
                  <code className="block p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono break-all select-all">
                    {lastRoll.hmacHash}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Roll Ledger Table */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Hash className="w-4 h-4 text-zinc-400" />
                Roll History & Audit Ledger ({rollHistory.length})
              </h3>
              {rollHistory.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const json = JSON.stringify(rollHistory, null, 2);
                      const blob = new Blob([json], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `provably-fair-ledger-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => setRollHistory([])}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-red-500/10 hover:text-red-500 text-zinc-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            {rollHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400">
                No rolls recorded yet. Press "Roll Provably Fair Number" above to start your ledger.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-medium">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">Nonce</th>
                      <th className="py-2 px-2">Result</th>
                      <th className="py-2 px-2">Client Seed</th>
                      <th className="py-2 px-2">HMAC-SHA256</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                    {rollHistory.map((r) => (
                      <tr key={`${r.rollIndex}-${r.nonce}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-2 text-zinc-400">{r.rollIndex}</td>
                        <td className="py-2 px-2 font-bold text-zinc-700 dark:text-zinc-300">{r.nonce}</td>
                        <td className="py-2 px-2 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          {r.resultNumber}
                        </td>
                        <td className="py-2 px-2 text-zinc-500 max-w-[120px] truncate">{r.clientSeed}</td>
                        <td className="py-2 px-2 text-zinc-400 max-w-[180px] truncate" title={r.hmacHash}>
                          {r.hmacHash.slice(0, 16)}...
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() => populateVerifierFromRoll(r)}
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-sans"
                          >
                            Verify in Auditor
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Independent 3rd-Party Verification Form */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Independent 3rd-Party Verifier
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Input any revealed server seed, client seed, nonce, and commitment hash to independently recompute the cryptographic HMAC and derived outcome.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Revealed Server Seed:</label>
                <input
                  type="text"
                  value={verifyServerSeed}
                  onChange={(e) => setVerifyServerSeed(e.target.value)}
                  placeholder="Paste 64-character hex server seed"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Expected Commitment Hash:</label>
                <input
                  type="text"
                  value={verifyExpectedCommitment}
                  onChange={(e) => setVerifyExpectedCommitment(e.target.value)}
                  placeholder="Paste pre-commitment SHA-256 hash"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Client Seed:</label>
                <input
                  type="text"
                  value={verifyClientSeed}
                  onChange={(e) => setVerifyClientSeed(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Nonce:</label>
                  <input
                    type="number"
                    value={verifyNonce}
                    onChange={(e) => setVerifyNonce(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Min:</label>
                  <input
                    type="number"
                    value={verifyMin}
                    onChange={(e) => setVerifyMin(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Max:</label>
                  <input
                    type="number"
                    value={verifyMax}
                    onChange={(e) => setVerifyMax(parseFloat(e.target.value) || 100)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleRunVerification}
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Verify Cryptographic Authenticity
            </button>

            {verifyResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  verifyResult.isValidCommitment
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                    : "border-red-500/30 bg-red-500/5 text-red-950 dark:text-red-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verifyResult.isValidCommitment ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>100% Cryptographic Match Verified!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Verification Failed: Commitment Hash Mismatch!</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-zinc-400 block font-sans">Derived Result Number:</span>
                    <span className="font-extrabold text-sm">{verifyResult.derivedNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-sans">Recomputed HMAC-SHA256:</span>
                    <span className="break-all">{verifyResult.computedHmac.slice(0, 24)}...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CONFIGURABLE NUMBERS & GAUSSIAN DISTRIBUTION */}
      {/* ==================================================================== */}
      {activeTab === "numbers" && (
        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
            <button
              onClick={() => setNumMode("uniform")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                numMode === "uniform"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Uniform Range Distribution
            </button>
            <button
              onClick={() => {
                setNumMode("gaussian");
                if (!gaussResult) handleGenerateGaussian();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                numMode === "gaussian"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Gaussian Normal Distribution (Box-Muller)
            </button>
          </div>

          {numMode === "uniform" ? (
            /* Uniform Controls & Results */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Min:</label>
                    <input
                      type="number"
                      value={uniformMin}
                      onChange={(e) => setUniformMin(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Max:</label>
                    <input
                      type="number"
                      value={uniformMax}
                      onChange={(e) => setUniformMax(parseFloat(e.target.value) || 100)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Quantity (Count):</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={uniformCount}
                      onChange={(e) => setUniformCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Sort Order:</label>
                    <select
                      value={uniformSort}
                      onChange={(e) => setUniformSort(e.target.value as "none" | "asc" | "desc")}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="none">Unsorted (Generated Order)</option>
                      <option value="asc">Ascending (Low → High)</option>
                      <option value="desc">Descending (High → Low)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uniformUnique}
                        onChange={(e) => setUniformUnique(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                      />
                      <span>Unique (No Duplicates)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uniformIsFloat}
                        onChange={(e) => setUniformIsFloat(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                      />
                      <span>Floating Point</span>
                    </label>

                    {uniformIsFloat && (
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <span>Decimals:</span>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={uniformDecimals}
                          onChange={(e) => setUniformDecimals(parseInt(e.target.value, 10) || 2)}
                          className="w-12 px-1 py-0.5 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateUniform}
                    className="py-2 px-5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate Numbers</span>
                  </button>
                </div>
              </div>

              {/* Uniform Results Grid & Export */}
              {uniformResults.length > 0 && (
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Generated Sample ({uniformResults.length})
                      </h3>
                      {uniformStats && (
                        <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500 font-mono">
                          <span>Min: {uniformStats.min}</span>
                          <span>Max: {uniformStats.max}</span>
                          <span>Mean: {uniformStats.mean}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSendToAudit}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        title="Send sample to Statistical Auditor"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Audit Sample</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(uniformResults.join(", "), "uniform-csv")}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      >
                        {copiedKey === "uniform-csv" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Copy CSV</span>
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(JSON.stringify(uniformResults), "uniform-json")
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      >
                        {copiedKey === "uniform-json" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-1 font-mono">
                    {uniformResults.map((num, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-emerald-500/50 transition-colors"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Gaussian Normal Distribution Controls & Bell Curve */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Mean (μ):</label>
                    <input
                      type="number"
                      value={gaussMean}
                      onChange={(e) => setGaussMean(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Std Dev (σ):</label>
                    <input
                      type="number"
                      min={0.1}
                      value={gaussStdDev}
                      onChange={(e) => setGaussStdDev(parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Sample Size (N):</label>
                    <input
                      type="number"
                      min={50}
                      max={5000}
                      value={gaussCount}
                      onChange={(e) => setGaussCount(parseInt(e.target.value, 10) || 100)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Decimals:</label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={gaussDecimals}
                      onChange={(e) => setGaussDecimals(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleGenerateGaussian}
                    className="py-2 px-5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Generate Gaussian Bell Curve</span>
                  </button>
                </div>
              </div>

              {gaussResult && (
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                      Box-Muller Normal Distribution Histogram
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                      <span>Empirical μ: {gaussResult.empiricalMean}</span>
                      <span>Empirical σ: {gaussResult.empiricalStdDev}</span>
                    </div>
                  </div>

                  {/* SVG Bell Curve Histogram */}
                  <div className="relative h-56 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-end justify-between gap-1.5">
                    {(() => {
                      const maxFreq = Math.max(...gaussResult.histogramBins.map((b) => b.count), 1);
                      return gaussResult.histogramBins.map((bin, i) => {
                        const heightPct = (bin.count / maxFreq) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative"
                          >
                            {/* Bar */}
                            <div
                              style={{ height: `${Math.max(4, heightPct)}%` }}
                              className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-500 transition-all cursor-pointer"
                            />
                            {/* Bin label */}
                            <span className="text-[9px] font-mono text-zinc-400 mt-1 truncate max-w-full">
                              {bin.min}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 p-2 rounded-lg bg-zinc-900 text-white text-[10px] font-mono whitespace-nowrap shadow-lg">
                              Range: {bin.min} – {bin.max}
                              <br />
                              Count: {bin.count} ({(bin.freq * 100).toFixed(1)}%)
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(gaussResult.samples.join(", "), "gauss-samples")
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {copiedKey === "gauss-samples" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy All Samples</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TABLETOP POLYHEDRAL DICE ROLLER */}
      {/* ==================================================================== */}
      {activeTab === "dice" && (
        <div className="space-y-6">
          {/* Quick Dice Click Bar */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Tabletop Polyhedral Set (Single-Click Roll)
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {(["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as PolyhedralDie[]).map((die) => (
                <button
                  key={die}
                  onClick={() => handleQuickDieClick(die)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95 transition-all text-zinc-800 dark:text-zinc-200 group"
                >
                  <Dices className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform mb-1" />
                  <span className="text-xs font-bold uppercase font-mono">{die}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dice Notation Formula Input */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Custom Dice Notation Formula
                </h3>
                <p className="text-xs text-zinc-500">
                  Supports tabletop standards: <code>3d6+2</code>, <code>4d6k3</code> (keep highest 3), <code>2d20d1</code> (drop lowest 1 / disadvantage), <code>1d100</code>.
                </p>
              </div>

              {/* Quick Formula Pill Shortcuts */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  onClick={() => {
                    setDiceNotation("4d6k3");
                    handleRollDice("4d6k3");
                  }}
                  className="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                >
                  4d6k3 (Ability)
                </button>
                <button
                  onClick={() => {
                    setDiceNotation("2d20k1");
                    handleRollDice("2d20k1");
                  }}
                  className="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                >
                  2d20k1 (Advantage)
                </button>
                <button
                  onClick={() => {
                    setDiceNotation("8d6");
                    handleRollDice("8d6");
                  }}
                  className="px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                >
                  8d6 (Fireball)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={diceNotation}
                onChange={(e) => setDiceNotation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRollDice();
                }}
                placeholder="e.g. 4d6k3 or 1d20+5"
                className="flex-1 px-3 py-2 text-sm font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              <button
                onClick={() => handleRollDice()}
                className="py-2 px-5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
              >
                <Dices className="w-4 h-4" />
                <span>Roll</span>
              </button>
            </div>
          </div>

          {/* Active Roll Display */}
          {lastDiceRoll && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono text-zinc-400">
                      Formula: {lastDiceRoll.notation}
                    </span>
                    {lastDiceRoll.isNatural20 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-black animate-bounce shadow-md">
                        CRITICAL HIT! (Natural 20)
                      </span>
                    )}
                    {lastDiceRoll.isNatural1 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white animate-pulse shadow-md">
                        CRITICAL FUMBLE! (Natural 1)
                      </span>
                    )}
                  </div>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-zinc-900 dark:text-zinc-50">
                    {lastDiceRoll.total}
                  </div>
                </div>

                {/* Individual Dice Tray */}
                <div className="space-y-1.5 max-w-md">
                  <span className="text-xs text-zinc-500">Dice Breakdown:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {lastDiceRoll.individualRolls.map((dieRoll, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                          dieRoll.isDropped
                            ? "line-through opacity-40 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                            : dieRoll.value === dieRoll.sides
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                            : dieRoll.value === 1
                            ? "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400"
                            : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                        }`}
                        title={dieRoll.isDropped ? "Dropped die" : `Rolled on ${dieRoll.die}`}
                      >
                        {dieRoll.value}
                      </div>
                    ))}
                    {lastDiceRoll.modifier !== 0 && (
                      <div className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">
                        {lastDiceRoll.modifier > 0 ? `+${lastDiceRoll.modifier}` : lastDiceRoll.modifier}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roll History */}
          {diceHistory.length > 0 && (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Recent Rolls ({diceHistory.length})
                </h4>
                <button
                  onClick={() => setDiceHistory([])}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear History
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {diceHistory.map((roll, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-[11px]">{roll.timestamp}</span>
                      <span className="text-zinc-600 dark:text-zinc-300 font-semibold">
                        {roll.notation}
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        [{roll.individualRolls.map((r) => (r.isDropped ? `(${r.value})` : r.value)).join(", ")}]
                        {roll.modifier !== 0 && (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`)}
                      </span>
                    </div>
                    <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      = {roll.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: FISHER-YATES LIST SHUFFLER & RAFFLE */}
      {/* ==================================================================== */}
      {activeTab === "shuffle" && (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
            <button
              onClick={() => setShuffleMode("shuffle")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                shuffleMode === "shuffle"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Shuffle Full List
            </button>
            <button
              onClick={() => setShuffleMode("raffle")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                shuffleMode === "raffle"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Draw Raffle Winners
            </button>
            <button
              onClick={() => setShuffleMode("teams")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                shuffleMode === "teams"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Split into Teams/Groups
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Items Area */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Items to Shuffle (1 per line):
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    onClick={() => setShuffleInputText(SAMPLE_NAMES.join("\n"))}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Names
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setShuffleInputText(SAMPLE_DECK.join("\n"))}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Deck
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setShuffleInputText("")}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                rows={8}
                value={shuffleInputText}
                onChange={(e) => setShuffleInputText(e.target.value)}
                placeholder="Alice&#10;Bob&#10;Charlie..."
                className="w-full p-3 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />

              {/* Mode-specific options */}
              {shuffleMode === "raffle" && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">Winners to Pick:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={raffleWinnerCount}
                      onChange={(e) => setRaffleWinnerCount(parseInt(e.target.value, 10) || 1)}
                      className="w-16 px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={raffleWithReplacement}
                      onChange={(e) => setRaffleWithReplacement(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                    />
                    <span>Allow Duplicates (Replacement)</span>
                  </label>
                </div>
              )}

              {shuffleMode === "teams" && (
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="text-zinc-500">Number of Teams:</span>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={teamCount}
                    onChange={(e) => setTeamCount(parseInt(e.target.value, 10) || 2)}
                    className="w-16 px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  />
                </div>
              )}

              <button
                onClick={handleExecuteShuffle}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                <span>
                  {shuffleMode === "shuffle"
                    ? "Shuffle List (Fisher-Yates)"
                    : shuffleMode === "raffle"
                    ? "Pick Random Winners"
                    : "Partition into Teams"}
                </span>
              </button>
            </div>

            {/* Results Display Area */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {shuffleMode === "shuffle"
                    ? "Shuffled Order"
                    : shuffleMode === "raffle"
                    ? "Selected Winners"
                    : "Assigned Teams"}
                </h3>
                {((shuffleMode === "shuffle" && shuffledList.length > 0) ||
                  (shuffleMode === "raffle" && raffleWinners.length > 0) ||
                  (shuffleMode === "teams" && teams.length > 0)) && (
                  <button
                    onClick={() => {
                      const text =
                        shuffleMode === "shuffle"
                          ? shuffledList.join("\n")
                          : shuffleMode === "raffle"
                          ? raffleWinners.join("\n")
                          : teams.map((t, idx) => `Team ${idx + 1}:\n${t.join("\n")}`).join("\n\n");
                      copyToClipboard(text, "shuffle-result");
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedKey === "shuffle-result" ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Results</span>
                  </button>
                )}
              </div>

              {shuffleMode === "shuffle" && (
                shuffledList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    Click "Shuffle List" to randomize order using Fisher-Yates algorithm.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {shuffledList.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs font-mono"
                      >
                        <span className="w-6 text-zinc-400 text-right">{idx + 1}.</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {shuffleMode === "raffle" && (
                raffleWinners.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    Click "Pick Random Winners" to run raffle draw.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {raffleWinners.map((winner, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs font-mono"
                      >
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {idx === 0 ? "🥇 1st Place:" : idx === 1 ? "🥈 2nd Place:" : idx === 2 ? "🥉 3rd Place:" : `Winner #${idx + 1}:`}
                        </span>
                        <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          {winner}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {shuffleMode === "teams" && (
                teams.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-400">
                    Click "Partition into Teams" to evenly distribute members.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {teams.map((group, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-2 text-xs"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <Users className="w-3.5 h-3.5" />
                          <span>Team {idx + 1} ({group.length} members)</span>
                        </div>
                        <ul className="space-y-1 font-mono text-zinc-700 dark:text-zinc-300">
                          {group.map((member, mIdx) => (
                            <li key={mIdx} className="truncate">• {member}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: DICEWARE & CRYPTOGRAPHIC TOKENS */}
      {/* ==================================================================== */}
      {activeTab === "crypto" && (
        <div className="space-y-6">
          {/* Submode Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
            <button
              onClick={() => setCryptoMode("diceware")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                cryptoMode === "diceware"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              EFF Diceware Passphrase
            </button>
            <button
              onClick={() => setCryptoMode("password")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                cryptoMode === "password"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Cryptographic Password
            </button>
            <button
              onClick={() => setCryptoMode("uuid")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                cryptoMode === "uuid"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              UUID v4 / v7 & NanoID
            </button>
          </div>

          {/* EFF Diceware Section */}
          {cryptoMode === "diceware" && (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-medium">Word Count ({diceWordCount}):</label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={diceWordCount}
                    onChange={(e) => setDiceWordCount(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-medium">Separator:</label>
                  <select
                    value={diceSeparator}
                    onChange={(e) => setDiceSeparator(e.target.value as "-" | "_" | "." | " " | "/")}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=".">Period (.)</option>
                    <option value=" ">Space ( )</option>
                    <option value="/">Slash (/)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 font-medium">Capitalization:</label>
                  <select
                    value={diceCapitalize}
                    onChange={(e) => setDiceCapitalize(e.target.value as "lower" | "title" | "upper")}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="title">Title Case (Word)</option>
                    <option value="lower">lowercase (word)</option>
                    <option value="upper">UPPERCASE (WORD)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={diceIncludeNumber}
                      onChange={(e) => setDiceIncludeNumber(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                    />
                    <span>Append Number</span>
                  </label>
                </div>
              </div>

              {dicewareResult && (
                <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Entropy: ~{dicewareResult.entropyBits} bits
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Cryptographically Uncrackable
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateDiceware}
                        className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        title="Regenerate Passphrase"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(dicewareResult.passphrase, "diceware-pass")}
                        className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        title="Copy Passphrase"
                      >
                        {copiedKey === "diceware-pass" ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-zinc-50 break-all select-all">
                    {dicewareResult.passphrase}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Password Section */}
          {cryptoMode === "password" && (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Password Length:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{passLength} characters</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={passLength}
                  onChange={(e) => setPassLength(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passUpper}
                    onChange={(e) => setPassUpper(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                  />
                  <span>Uppercase (A–Z)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passLower}
                    onChange={(e) => setPassLower(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                  />
                  <span>Lowercase (a–z)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passNumbers}
                    onChange={(e) => setPassNumbers(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                  />
                  <span>Numbers (0–9)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passSymbols}
                    onChange={(e) => setPassSymbols(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                  />
                  <span>Symbols (!@#$)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passExcludeAmbiguous}
                    onChange={(e) => setPassExcludeAmbiguous(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-500"
                  />
                  <span>Exclude Ambiguous (0, O, 1, l)</span>
                </label>
              </div>

              {passwordResult && (
                <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Entropy: ~{passwordResult.entropyBits} bits
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGeneratePassword}
                        className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        title="Regenerate Password"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(passwordResult.password, "password-copy")}
                        className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                        title="Copy Password"
                      >
                        {copiedKey === "password-copy" ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-zinc-50 break-all select-all">
                    {passwordResult.password}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UUIDs & NanoID Section */}
          {cryptoMode === "uuid" && (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Identifier Format:</label>
                    <select
                      value={uuidType}
                      onChange={(e) => setUuidType(e.target.value as "v7" | "v4" | "nanoid")}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="v7">RFC 9562 UUID v7 (Time-Ordered Monotonic)</option>
                      <option value="v4">RFC 4122 UUID v4 (Random 122-bit)</option>
                      <option value="nanoid">NanoID (21-character URL-safe)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500 font-medium">Batch Count:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={uuidCount}
                      onChange={(e) => setUuidCount(parseInt(e.target.value, 10) || 1)}
                      className="w-16 px-2 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateTokens}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Tokens</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedTokens.join("\n"), "tokens-all")}
                    className="py-2 px-3 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {copiedKey === "tokens-all" ? "Copied!" : "Copy All"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {generatedTokens.map((token, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 font-mono text-xs"
                  >
                    <span className="text-zinc-800 dark:text-zinc-200 select-all">{token}</span>
                    <button
                      onClick={() => copyToClipboard(token, `token-${idx}`)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copiedKey === `token-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: STATISTICAL RANDOMNESS AUDIT */}
      {/* ==================================================================== */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Input & Range Configuration */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Statistical Uniformity & Entropy Auditor
                </h3>
                <p className="text-xs text-zinc-500">
                  Performs real-time Chi-Square ($\chi^2$) goodness-of-fit hypothesis testing and Shannon Entropy calculation.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleGenerateAuditSample(1000)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                >
                  Load 1,000 CSPRNG Samples
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-medium">Domain Min:</label>
                <input
                  type="number"
                  value={auditMin}
                  onChange={(e) => setAuditMin(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-500 font-medium">Domain Max:</label>
                <input
                  type="number"
                  value={auditMax}
                  onChange={(e) => setAuditMax(parseFloat(e.target.value) || 100)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div className="col-span-2 flex items-end">
                <button
                  onClick={handleRunAudit}
                  className="w-full py-2 px-4 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Execute Statistical Audit</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">
                Sample Values (comma or space separated):
              </label>
              <textarea
                rows={3}
                value={auditRawInput}
                onChange={(e) => setAuditRawInput(e.target.value)}
                placeholder="42, 17, 88, 3, 99..."
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>
          </div>

          {/* Audit Metrics Dashboard */}
          {auditResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Status Card */}
                <div
                  className={`p-4 rounded-2xl border ${
                    auditResult.status.includes("Pass")
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
                      : "border-red-500/30 bg-red-500/5 text-red-950 dark:text-red-200"
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider opacity-70 block font-semibold">
                    Overall Verdict
                  </span>
                  <div className="text-lg font-bold mt-1 flex items-center gap-1.5">
                    {auditResult.status.includes("Pass") ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <span>{auditResult.status}</span>
                  </div>
                </div>

                {/* Shannon Entropy */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">
                    Shannon Entropy
                  </span>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    {auditResult.shannonEntropy} / {auditResult.maxTheoreticalEntropy}
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    {auditResult.entropyEfficiency}% Efficiency
                  </span>
                </div>

                {/* Chi-Square */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">
                    Chi-Square (χ²)
                  </span>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    {auditResult.chiSquare}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    df = {auditResult.degreesOfFreedom}, p ≈ {auditResult.pValueEstimate}
                  </span>
                </div>

                {/* Mean Comparison */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">
                    Empirical vs Expected Mean
                  </span>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    {auditResult.empiricalMean}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    Theoretical: {auditResult.theoreticalMean}
                  </span>
                </div>
              </div>

              {/* Bucket Frequency Bar Chart */}
              <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Frequency Distribution (Observed vs Expected Uniformity)
                </h3>

                <div className="space-y-2">
                  {auditResult.buckets.map((b, i) => {
                    const maxObs = Math.max(...auditResult.buckets.map((item) => item.observed), 1);
                    const obsPct = (b.observed / maxObs) * 100;
                    const expPct = (b.expected / maxObs) * 100;

                    return (
                      <div key={i} className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between text-[11px] text-zinc-500">
                          <span>Bucket {b.label}</span>
                          <span>
                            Obs: <strong>{b.observed}</strong> | Exp: {b.expected}
                          </span>
                        </div>
                        <div className="relative h-4 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden">
                          {/* Expected Reference Line */}
                          <div
                            style={{ left: `${expPct}%` }}
                            className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 z-10"
                            title={`Expected: ${b.expected}`}
                          />
                          {/* Observed Bar */}
                          <div
                            style={{ width: `${obsPct}%` }}
                            className="h-full bg-emerald-500/80 rounded-md transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
