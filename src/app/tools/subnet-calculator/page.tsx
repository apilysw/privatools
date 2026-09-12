"use client";

import { useState, useMemo } from "react";
import {
  Network,
  Copy,
  Check,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Split,
  Plus,
  X,
  Globe,
  Binary,
  ShieldCheck,
  Share2,
  Crosshair,
} from "lucide-react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import {
  calculateIpv4Subnet,
  calculateIpv6Subnet,
  splitSubnet,
  planVlsm,
  checkIpInSubnet,
  checkSubnetOverlap,
  SUBNET_PRESETS,
  SubnetPreset,
  Ipv4SubnetDetails,
  Ipv6SubnetDetails,
} from "@/lib/converters/subnet";

type StudioTab = "ipv4" | "vlsm" | "matcher" | "ipv6";

interface VlsmRequirement {
  id: string;
  name: string;
  hosts: number;
}

export default function SubnetCalculatorPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("ipv4");
  const [activePreset, setActivePreset] = useState<string | null>("office-lan");

  // IPv4 Calculator State
  const [ipv4Input, setIpv4Input] = useState<string>("192.168.1.100");
  const [ipv4Prefix, setIpv4Prefix] = useState<number>(24);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // Subnet Divider & VLSM State
  const [dividerParent, setDividerParent] = useState<string>("10.0.0.0/20");
  const [dividerTargetPrefix, setDividerTargetPrefix] = useState<number>(24);
  const [vlsmMode, setVlsmMode] = useState<"equal" | "vlsm">("equal");
  const [vlsmParent, setVlsmParent] = useState<string>("192.168.0.0/23");
  const [vlsmRequirements, setVlsmRequirements] = useState<VlsmRequirement[]>([
    { id: "1", name: "Engineering / Dev", hosts: 120 },
    { id: "2", name: "Sales & Marketing", hosts: 60 },
    { id: "3", name: "Servers & Database", hosts: 28 },
    { id: "4", name: "Router Uplink (P2P)", hosts: 2 },
  ]);

  // IP Matcher & Overlap State
  const [testIp, setTestIp] = useState<string>("10.0.4.55");
  const [testSubnet, setTestSubnet] = useState<string>("10.0.0.0/21");
  const [overlapCidrA, setOverlapCidrA] = useState<string>("172.16.0.0/16");
  const [overlapCidrB, setOverlapCidrB] = useState<string>("172.16.32.0/19");

  // IPv6 Calculator State
  const [ipv6Input, setIpv6Input] = useState<string>("2001:db8:85a3::8a2e:370:7334/64");

  // Calculate IPv4 Subnet Details
  const ipv4Result = useMemo<{ details?: Ipv4SubnetDetails; error?: string }>(() => {
    try {
      const details = calculateIpv4Subnet(ipv4Input, ipv4Prefix);
      return { details };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Invalid IP address" };
    }
  }, [ipv4Input, ipv4Prefix]);

  // Calculate Subnet Division
  const divisionResult = useMemo(() => {
    try {
      return { items: splitSubnet(dividerParent, dividerTargetPrefix) };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Division failed" };
    }
  }, [dividerParent, dividerTargetPrefix]);

  // Calculate VLSM Plan
  const vlsmResult = useMemo(() => {
    try {
      const reqs = vlsmRequirements.map((r) => ({
        id: r.id,
        name: r.name,
        requiredHosts: r.hosts,
      }));
      return { items: planVlsm(vlsmParent, reqs) };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "VLSM planning failed" };
    }
  }, [vlsmParent, vlsmRequirements]);

  // Test IP containment
  const isIpInSubnet = useMemo(() => {
    return checkIpInSubnet(testIp, testSubnet);
  }, [testIp, testSubnet]);

  // Test Subnet Overlap
  const isOverlapping = useMemo(() => {
    return checkSubnetOverlap(overlapCidrA, overlapCidrB);
  }, [overlapCidrA, overlapCidrB]);

  // Calculate IPv6 Subnet Details
  const ipv6Result = useMemo<{ details?: Ipv6SubnetDetails; error?: string }>(() => {
    try {
      const details = calculateIpv6Subnet(ipv6Input);
      return { details };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Invalid IPv6 address" };
    }
  }, [ipv6Input]);

  // Copy helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Preset Selection
  const handleSelectPreset = (p: SubnetPreset) => {
    setActivePreset(p.id);
    if (p.type === "ipv4") {
      setActiveTab("ipv4");
      const [ip, pref] = p.cidr.split("/");
      setIpv4Input(ip);
      setIpv4Prefix(parseInt(pref, 10));
    } else {
      setActiveTab("ipv6");
      setIpv6Input(p.cidr);
    }
  };

  // Clear Input
  const handleClear = () => {
    setIpv4Input("");
    setIpv4Prefix(24);
    setIpv6Input("");
    setActivePreset(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <ToolHeader
          toolId="subnet-calculator"
          title="Network & Subnet CIDR Studio"
          description="Calculate IPv4 & IPv6 CIDR subnets, analyze 32-bit binary bitmasks, compute Cisco wildcard masks, plan Variable Length Subnet Masking (VLSM), and verify VPC routing collisions with zero data egress."
          badge="Zero Egress"
        />
      </div>

      {/* Sample Presets Card (matches all existing tools) */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-zinc-400" />
            Sample Networks:
          </span>
          {SUBNET_PRESETS.map((p) => (
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

      {/* Primary Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveTab("ipv4")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "ipv4"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Network className="w-4 h-4" />
          <span>CIDR Subnet Calculator (IPv4)</span>
        </button>

        <button
          onClick={() => setActiveTab("vlsm")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "vlsm"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Split className="w-4 h-4" />
          <span>Subnet Divider & VLSM Planner</span>
        </button>

        <button
          onClick={() => setActiveTab("matcher")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "matcher"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>IP Matcher & Overlap Detector</span>
        </button>

        <button
          onClick={() => setActiveTab("ipv6")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "ipv6"
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>IPv6 Subnet Studio</span>
        </button>
      </div>

      {/* TAB 1: IPv4 CIDR Calculator */}
      {activeTab === "ipv4" && (
        <div className="space-y-6">
          {/* Main Input Card */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 space-y-2">
                <label htmlFor="ipv4-input" className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>IP Address or CIDR Notation</span>
                  <span className="text-[11px] font-normal text-zinc-400">
                    e.g. 192.168.1.100 or 10.0.0.1/16
                  </span>
                </label>
                <input
                  id="ipv4-input"
                  aria-label="IP Address or CIDR Notation"
                  type="text"
                  value={ipv4Input}
                  onChange={(e) => {
                    setIpv4Input(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="192.168.1.100"
                  className="w-full p-3 font-mono text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="md:col-span-3 space-y-2">
                <label htmlFor="ipv4-prefix-select" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Subnet Mask
                </label>
                <select
                  id="ipv4-prefix-select"
                  aria-label="Subnet Mask prefix length"
                  value={ipv4Prefix}
                  onChange={(e) => setIpv4Prefix(parseInt(e.target.value, 10))}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  {Array.from({ length: 33 }, (_, i) => 32 - i).map((p) => {
                    const maskUint = p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
                    const maskStr = [
                      (maskUint >>> 24) & 255,
                      (maskUint >>> 16) & 255,
                      (maskUint >>> 8) & 255,
                      maskUint & 255,
                    ].join(".");
                    return (
                      <option key={p} value={p}>
                        /{p} ({maskStr})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Prefix Length
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    /{ipv4Prefix}
                  </span>
                  <span className="text-xs text-zinc-400">
                    ({Math.pow(2, 32 - ipv4Prefix).toLocaleString()} addresses)
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Prefix Slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>/0 (Internet)</span>
                <span>/8 (Class A)</span>
                <span>/16 (Class B)</span>
                <span>/24 (Class C)</span>
                <span>/30 (P2P)</span>
                <span>/32 (Host)</span>
              </div>
              <input
                id="ipv4-prefix-slider"
                aria-label="Subnet mask prefix length slider"
                type="range"
                min={0}
                max={32}
                value={ipv4Prefix}
                onChange={(e) => setIpv4Prefix(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Validation Error Banner */}
          {ipv4Result.error && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{ipv4Result.error}</span>
            </div>
          )}

          {/* Calculated Output Details */}
          {ipv4Result.details && (
            <div className="space-y-6">
              {/* Color-Coded 32-Bit Binary Bitmask Visualization */}
              <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Binary className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      32-Bit Binary Bitmask Decomposition
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Network ({ipv4Result.details.prefix} bits)
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                      <span className="text-sky-600 dark:text-sky-400 font-medium">
                        Host ({32 - ipv4Result.details.prefix} bits)
                      </span>
                    </span>
                  </div>
                </div>

                {/* Binary Bits Display */}
                <div className="p-4 rounded-xl bg-zinc-950 font-mono text-sm sm:text-base flex flex-wrap items-center justify-center gap-2 sm:gap-4 tracking-wider">
                  {ipv4Result.details.binaryIp.split(".").map((octet, octIdx) => (
                    <div key={octIdx} className="flex items-center gap-0.5">
                      {octet.split("").map((bit, bitIdx) => {
                        const globalBitIndex = octIdx * 8 + bitIdx;
                        const isNetwork = globalBitIndex < ipv4Result.details!.prefix;
                        return (
                          <span
                            key={bitIdx}
                            className={`w-5 sm:w-6 h-7 sm:h-8 flex items-center justify-center rounded font-bold transition-colors ${
                              isNetwork
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                            }`}
                          >
                            {bit}
                          </span>
                        );
                      })}
                      {octIdx < 3 && <span className="text-zinc-600 font-bold ml-1">.</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Network Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Network Address */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Network Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {ipv4Result.details.networkAddress}
                    </span>
                    <button
                      onClick={() => handleCopy("net", ipv4Result.details!.networkAddress)}
                      aria-label="Copy network address"
                      title="Copy network address"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copyStatus["net"] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    CIDR: {ipv4Result.details.cidr}
                  </span>
                </div>

                {/* Broadcast Address */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Broadcast Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {ipv4Result.details.broadcastAddress}
                    </span>
                    <button
                      onClick={() => handleCopy("bcast", ipv4Result.details!.broadcastAddress)}
                      aria-label="Copy broadcast address"
                      title="Copy broadcast address"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copyStatus["bcast"] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Hex: {ipv4Result.details.hexIp}
                  </span>
                </div>

                {/* Usable Host Range */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Usable Host Range
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate">
                      {ipv4Result.details.firstUsableAddress} - {ipv4Result.details.lastUsableAddress}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          "range",
                          `${ipv4Result.details!.firstUsableAddress} - ${ipv4Result.details!.lastUsableAddress}`
                        )
                      }
                      aria-label="Copy usable host range"
                      title="Copy usable host range"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copyStatus["range"] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Allocatable IP boundaries
                  </span>
                </div>

                {/* Usable Host Count */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Usable Host Count
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
                      {ipv4Result.details.usableHosts.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-400">
                      / {ipv4Result.details.totalHosts.toLocaleString()} total
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    2^(32 - {ipv4Result.details.prefix}) - 2
                  </span>
                </div>

                {/* Subnet Mask */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Subnet Mask
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {ipv4Result.details.subnetMask}
                    </span>
                    <button
                      onClick={() => handleCopy("mask", ipv4Result.details!.subnetMask)}
                      aria-label="Copy subnet mask"
                      title="Copy subnet mask"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copyStatus["mask"] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Bin: {ipv4Result.details.binaryMask}
                  </span>
                </div>

                {/* Wildcard Mask */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Wildcard (Cisco ACL) Mask
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                      {ipv4Result.details.wildcardMask}
                    </span>
                    <button
                      onClick={() => handleCopy("wild", ipv4Result.details!.wildcardMask)}
                      aria-label="Copy wildcard mask"
                      title="Copy wildcard mask"
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copyStatus["wild"] ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Inverse mask for OSPF & ACLs
                  </span>
                </div>
              </div>

              {/* IP Scope & Classification Badge Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-500">Classification:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 font-medium text-zinc-800 dark:text-zinc-200">
                    {ipv4Result.details.ipClass}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg font-semibold ${
                      ipv4Result.details.ipScope.includes("Private")
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {ipv4Result.details.ipScope}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-zinc-500 font-mono text-[11px]">
                  <span>Dec: {ipv4Result.details.decimalIp}</span>
                  <span>Hex: {ipv4Result.details.hexIp}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Subnet Divider & VLSM Planner */}
      {activeTab === "vlsm" && (
        <div className="space-y-6">
          {/* Sub-mode selector */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVlsmMode("equal")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  vlsmMode === "equal"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Equal Subnet Split
              </button>
              <button
                onClick={() => setVlsmMode("vlsm")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  vlsmMode === "vlsm"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                VLSM Requirement Planner
              </button>
            </div>
          </div>

          {/* Mode 1: Equal Subnet Split */}
          {vlsmMode === "equal" && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="divider-parent" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Parent CIDR Network
                  </label>
                  <input
                    id="divider-parent"
                    aria-label="Parent CIDR Network"
                    type="text"
                    value={dividerParent}
                    onChange={(e) => setDividerParent(e.target.value)}
                    placeholder="10.0.0.0/20"
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="divider-target-prefix" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Divide Into Target Prefix
                  </label>
                  <select
                    id="divider-target-prefix"
                    aria-label="Divide Into Target Prefix"
                    value={dividerTargetPrefix}
                    onChange={(e) => setDividerTargetPrefix(parseInt(e.target.value, 10))}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 20).map((p) => (
                      <option key={p} value={p}>
                        /{p} ({Math.pow(2, 32 - p) - 2} usable hosts each)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {divisionResult.error ? (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs">
                  {divisionResult.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-semibold uppercase tracking-wider">
                      Generated Subnets ({divisionResult.items?.length} blocks)
                    </span>
                    <span>Max 256 displayed</span>
                  </div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs max-h-[450px] overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                          <th className="p-3 font-semibold">#</th>
                          <th className="p-3 font-semibold">Subnet CIDR</th>
                          <th className="p-3 font-semibold">Usable Range</th>
                          <th className="p-3 font-semibold">Broadcast</th>
                          <th className="p-3 font-semibold text-right">Usable Hosts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                        {divisionResult.items?.map((item) => (
                          <tr key={item.index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                            <td className="p-3 text-zinc-400">{item.index}</td>
                            <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {item.cidr}
                            </td>
                            <td className="p-3 text-zinc-700 dark:text-zinc-300">
                              {item.firstUsable} - {item.lastUsable}
                            </td>
                            <td className="p-3 text-zinc-500">{item.broadcastAddress}</td>
                            <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400">
                              {item.usableHosts.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: VLSM Requirement Planner */}
          {vlsmMode === "vlsm" && (
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="vlsm-parent" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Parent IP Block to Subnet
                </label>
                <input
                  id="vlsm-parent"
                  aria-label="Parent IP Block to Subnet"
                  type="text"
                  value={vlsmParent}
                  onChange={(e) => setVlsmParent(e.target.value)}
                  placeholder="192.168.0.0/23"
                  className="w-full max-w-sm p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              {/* Host Requirements List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Department / Subnet Requirements
                  </span>
                  <button
                    onClick={() =>
                      setVlsmRequirements((prev) => [
                        ...prev,
                        { id: String(Date.now()), name: "New Subnet", hosts: 30 },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subnet</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {vlsmRequirements.map((req, idx) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40"
                    >
                      <span className="text-xs font-mono text-zinc-400 w-6 text-center">
                        {idx + 1}
                      </span>
                      <input
                        aria-label={`Subnet ${idx + 1} Name`}
                        type="text"
                        value={req.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVlsmRequirements((prev) =>
                            prev.map((r) => (r.id === req.id ? { ...r, name: val } : r))
                          );
                        }}
                        className="flex-1 p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          aria-label={`Subnet ${idx + 1} Required Hosts`}
                          type="number"
                          min={1}
                          max={65534}
                          value={req.hosts}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setVlsmRequirements((prev) =>
                              prev.map((r) => (r.id === req.id ? { ...r, hosts: val } : r))
                            );
                          }}
                          className="w-24 p-2 text-xs font-mono text-right rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-500">hosts</span>
                      </div>
                      <button
                        onClick={() =>
                          setVlsmRequirements((prev) => prev.filter((r) => r.id !== req.id))
                        }
                        aria-label={`Remove subnet requirement ${idx + 1}`}
                        title={`Remove subnet requirement ${idx + 1}`}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* VLSM Output Plan */}
              {vlsmResult.error ? (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs">
                  {vlsmResult.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                    Optimized Non-Overlapping VLSM Allocation
                  </span>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 text-left border-b border-zinc-200 dark:border-zinc-800">
                          <th className="p-3 font-semibold">Subnet / Name</th>
                          <th className="p-3 font-semibold">Allocated CIDR</th>
                          <th className="p-3 font-semibold">Subnet Mask</th>
                          <th className="p-3 font-semibold">Usable Range</th>
                          <th className="p-3 font-semibold text-right">Required / Allocated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[11px]">
                        {vlsmResult.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                            <td className="p-3 font-sans font-semibold text-zinc-800 dark:text-zinc-200">
                              {item.name}
                            </td>
                            <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {item.cidr}
                            </td>
                            <td className="p-3 text-zinc-500">{item.subnetMask}</td>
                            <td className="p-3 text-zinc-700 dark:text-zinc-300">
                              {item.firstUsable} - {item.lastUsable}
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-zinc-500">{item.requiredHosts} req</span> /{" "}
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                {item.allocatedHosts} cap
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IP Matcher & Overlap Collision Detector */}
      {activeTab === "matcher" && (
        <div className="space-y-6">
          {/* Tool 1: IP in Subnet Matcher */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Test If IP Address Belongs to Subnet
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="target-ip-address" className="text-xs text-zinc-400">Target IP Address</label>
                <input
                  id="target-ip-address"
                  aria-label="Target IP Address"
                  type="text"
                  value={testIp}
                  onChange={(e) => setTestIp(e.target.value)}
                  placeholder="10.0.4.55"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="target-subnet-cidr" className="text-xs text-zinc-400">Target Subnet CIDR</label>
                <input
                  id="target-subnet-cidr"
                  aria-label="Target Subnet CIDR"
                  type="text"
                  value={testSubnet}
                  onChange={(e) => setTestSubnet(e.target.value)}
                  placeholder="10.0.0.0/21"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                isIpInSubnet
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold"
                  : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300 font-semibold"
              }`}
            >
              <span className="flex items-center gap-2">
                {isIpInSubnet ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span>
                  {isIpInSubnet
                    ? `MATCH: ${testIp} IS INSIDE ${testSubnet}`
                    : `NO MATCH: ${testIp} is outside ${testSubnet}`}
                </span>
              </span>
            </div>
          </div>

          {/* Tool 2: VPC CIDR Collision Checker */}
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                VPC / Cloud Routing CIDR Overlap & Collision Detector
              </h4>
            </div>
            <p className="text-xs text-zinc-500">
              Verify that two cloud VPC networks, Kubernetes pods, or site-to-site VPN subnets do not collide before establishing peering connections.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="network-block-a" className="text-xs text-zinc-400">Network Block A (e.g. AWS VPC)</label>
                <input
                  id="network-block-a"
                  aria-label="Network Block A (e.g. AWS VPC)"
                  type="text"
                  value={overlapCidrA}
                  onChange={(e) => setOverlapCidrA(e.target.value)}
                  placeholder="172.16.0.0/16"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="network-block-b" className="text-xs text-zinc-400">Network Block B (e.g. GCP VPC)</label>
                <input
                  id="network-block-b"
                  aria-label="Network Block B (e.g. GCP VPC)"
                  type="text"
                  value={overlapCidrB}
                  onChange={(e) => setOverlapCidrB(e.target.value)}
                  placeholder="172.16.32.0/19"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                isOverlapping
                  ? "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300 font-bold"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold"
              }`}
            >
              <span className="flex items-center gap-2">
                {isOverlapping ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <span>
                  {isOverlapping
                    ? `ROUTING COLLISION DETECTED: ${overlapCidrA} overlaps with ${overlapCidrB}. Cannot peer these VPCs without NAT.`
                    : `NO COLLISION: ${overlapCidrA} and ${overlapCidrB} are completely disjoint and safe to peer.`}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IPv6 Subnet Studio */}
      {activeTab === "ipv6" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
            <div className="space-y-2">
              <label htmlFor="ipv6-input-address" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                IPv6 Address / Prefix
              </label>
              <input
                id="ipv6-input-address"
                aria-label="IPv6 Address / Prefix"
                type="text"
                value={ipv6Input}
                onChange={(e) => setIpv6Input(e.target.value)}
                placeholder="2001:db8:85a3::8a2e:370:7334/64"
                className="w-full p-3 font-mono text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            {ipv6Result.error ? (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 text-xs">
                {ipv6Result.error}
              </div>
            ) : ipv6Result.details ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Network Prefix
                    </span>
                    <p className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 break-all">
                      {ipv6Result.details.networkAddress}/{ipv6Result.details.prefix}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Address Capacity
                    </span>
                    <p className="font-mono font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400 break-all">
                      {ipv6Result.details.totalHostsStr}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      IPv6 Scope
                    </span>
                    <p className="font-semibold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                      {ipv6Result.details.scope}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 font-sans font-semibold text-zinc-600 dark:text-zinc-300">
                    IPv6 Formats & Notation
                  </div>
                  <div className="p-3 flex flex-col sm:flex-row justify-between gap-1">
                    <span className="text-zinc-500 font-sans">Compressed:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 break-all">
                      {ipv6Result.details.compressedIp}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col sm:flex-row justify-between gap-1">
                    <span className="text-zinc-500 font-sans">Expanded Full Hex:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 break-all">
                      {ipv6Result.details.expandedIp}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col sm:flex-row justify-between gap-1">
                    <span className="text-zinc-500 font-sans">First Address:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 break-all">
                      {ipv6Result.details.networkAddress}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col sm:flex-row justify-between gap-1">
                    <span className="text-zinc-500 font-sans">Last Address:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 break-all">
                      {ipv6Result.details.lastAddress}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
