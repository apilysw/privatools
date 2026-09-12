export interface Ipv4SubnetDetails {
  ip: string;
  prefix: number;
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableAddress: string;
  lastUsableAddress: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
  binaryIp: string;
  binaryMask: string;
  binaryNetwork: string;
  ipClass: "Class A" | "Class B" | "Class C" | "Class D (Multicast)" | "Class E (Experimental)";
  ipScope:
    | "Private (RFC 1918)"
    | "Loopback (RFC 1122)"
    | "Link-Local (RFC 3927)"
    | "Carrier-Grade NAT (RFC 6598)"
    | "Multicast"
    | "Public Internet";
  decimalIp: number;
  hexIp: string;
}

export interface Ipv6SubnetDetails {
  ip: string;
  prefix: number;
  cidr: string;
  networkAddress: string;
  lastAddress: string;
  firstUsableAddress: string;
  lastUsableAddress: string;
  totalHostsStr: string;
  scope: "Global Unicast" | "Link-Local" | "Unique Local (ULA)" | "Multicast" | "Loopback" | "Unspecified";
  expandedIp: string;
  compressedIp: string;
}

export interface SubnetDivisionItem {
  index: number;
  cidr: string;
  networkAddress: string;
  firstUsable: string;
  lastUsable: string;
  broadcastAddress: string;
  usableHosts: number;
}

export interface VlsmSubnetItem {
  id: string;
  name: string;
  requiredHosts: number;
  allocatedHosts: number;
  prefix: number;
  cidr: string;
  networkAddress: string;
  firstUsable: string;
  lastUsable: string;
  broadcastAddress: string;
  subnetMask: string;
}

export interface SubnetPreset {
  id: string;
  name: string;
  description: string;
  cidr: string;
  type: "ipv4" | "ipv6";
}

// Convert Dotted IPv4 string to 32-bit unsigned integer
export function ipToUint32(ip: string): number {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid IPv4 address format. Must have 4 octets.");
  }
  let uint = 0;
  for (let i = 0; i < 4; i++) {
    const p = parseInt(parts[i], 10);
    if (isNaN(p) || p < 0 || p > 255) {
      throw new Error(`Invalid octet "${parts[i]}". Each octet must be between 0 and 255.`);
    }
    uint = (uint << 8) | p;
  }
  return uint >>> 0;
}

// Convert 32-bit unsigned integer to dotted IPv4 string
export function uint32ToIp(uint: number): string {
  return [
    (uint >>> 24) & 255,
    (uint >>> 16) & 255,
    (uint >>> 8) & 255,
    uint & 255,
  ].join(".");
}

// Convert 32-bit unsigned integer to 8-bit padded binary octets string
export function uint32ToBinary(uint: number): string {
  return [
    ((uint >>> 24) & 255).toString(2).padStart(8, "0"),
    ((uint >>> 16) & 255).toString(2).padStart(8, "0"),
    ((uint >>> 8) & 255).toString(2).padStart(8, "0"),
    (uint & 255).toString(2).padStart(8, "0"),
  ].join(".");
}

// Compute subnet mask uint32 from prefix (0..32)
export function prefixToMaskUint32(prefix: number): number {
  if (prefix === 0) return 0;
  return (~0 << (32 - prefix)) >>> 0;
}

// Compute prefix from subnet mask string (e.g. 255.255.255.0 -> 24)
export function maskToPrefix(mask: string): number {
  const maskUint = ipToUint32(mask);
  let prefix = 0;
  for (let i = 31; i >= 0; i--) {
    if ((maskUint & (1 << i)) !== 0) {
      prefix++;
    } else {
      break;
    }
  }
  return prefix;
}

// Detect IPv4 Class
export function detectIpv4Class(
  uint: number
): Ipv4SubnetDetails["ipClass"] {
  const firstOctet = (uint >>> 24) & 255;
  if (firstOctet <= 127) return "Class A";
  if (firstOctet <= 191) return "Class B";
  if (firstOctet <= 223) return "Class C";
  if (firstOctet <= 239) return "Class D (Multicast)";
  return "Class E (Experimental)";
}

// Detect IPv4 Scope
export function detectIpv4Scope(
  uint: number
): Ipv4SubnetDetails["ipScope"] {
  const firstOctet = (uint >>> 24) & 255;
  const secondOctet = (uint >>> 16) & 255;

  // Loopback (127.0.0.0/8)
  if (firstOctet === 127) return "Loopback (RFC 1122)";
  // Link-Local (169.254.0.0/16)
  if (firstOctet === 169 && secondOctet === 254) return "Link-Local (RFC 3927)";
  // CGNAT (100.64.0.0/10: 100.64.0.0 - 100.127.255.255)
  if (firstOctet === 100 && secondOctet >= 64 && secondOctet <= 127)
    return "Carrier-Grade NAT (RFC 6598)";
  // Multicast (224.0.0.0/4)
  if (firstOctet >= 224 && firstOctet <= 239) return "Multicast";

  // RFC 1918 Private
  // 10.0.0.0/8
  if (firstOctet === 10) return "Private (RFC 1918)";
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31)
    return "Private (RFC 1918)";
  // 192.168.0.0/16
  if (firstOctet === 192 && secondOctet === 168) return "Private (RFC 1918)";

  return "Public Internet";
}

/**
 * Calculates comprehensive IPv4 subnet parameters.
 */
export function calculateIpv4Subnet(
  input: string,
  explicitPrefix?: number
): Ipv4SubnetDetails {
  let ipPart = input.trim();
  let prefix = explicitPrefix !== undefined ? explicitPrefix : 24;

  if (ipPart.includes("/")) {
    const [ipStr, pStr] = ipPart.split("/");
    ipPart = ipStr.trim();
    const parsedP = parseInt(pStr, 10);
    if (!isNaN(parsedP)) {
      prefix = parsedP;
    }
  }

  if (prefix < 0 || prefix > 32) {
    throw new Error("Prefix must be between /0 and /32.");
  }

  const ipUint = ipToUint32(ipPart);
  const maskUint = prefixToMaskUint32(prefix);
  const wildcardUint = (~maskUint) >>> 0;
  const networkUint = (ipUint & maskUint) >>> 0;
  const broadcastUint = (ipUint | wildcardUint) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);
  let usableHosts = totalHosts - 2;
  let firstUsableUint = networkUint + 1;
  let lastUsableUint = broadcastUint - 1;

  if (prefix === 31) {
    // RFC 3021 Point-to-Point links: 2 usable hosts, no broadcast
    usableHosts = 2;
    firstUsableUint = networkUint;
    lastUsableUint = broadcastUint;
  } else if (prefix === 32) {
    // Single host / Loopback: 1 address
    usableHosts = 1;
    firstUsableUint = networkUint;
    lastUsableUint = networkUint;
  } else if (prefix === 0) {
    usableHosts = totalHosts - 2;
  }

  return {
    ip: uint32ToIp(ipUint),
    prefix,
    cidr: `${uint32ToIp(networkUint)}/${prefix}`,
    networkAddress: uint32ToIp(networkUint),
    broadcastAddress: uint32ToIp(broadcastUint),
    firstUsableAddress: uint32ToIp(firstUsableUint),
    lastUsableAddress: uint32ToIp(lastUsableUint),
    totalHosts,
    usableHosts: Math.max(0, usableHosts),
    subnetMask: uint32ToIp(maskUint),
    wildcardMask: uint32ToIp(wildcardUint),
    binaryIp: uint32ToBinary(ipUint),
    binaryMask: uint32ToBinary(maskUint),
    binaryNetwork: uint32ToBinary(networkUint),
    ipClass: detectIpv4Class(ipUint),
    ipScope: detectIpv4Scope(ipUint),
    decimalIp: ipUint,
    hexIp: "0x" + ipUint.toString(16).toUpperCase().padStart(8, "0"),
  };
}

/**
 * Splits a parent IPv4 CIDR network equally into smaller subnets of `targetPrefix`.
 */
export function splitSubnet(
  parentCidr: string,
  targetPrefix: number
): SubnetDivisionItem[] {
  const parent = calculateIpv4Subnet(parentCidr);
  if (targetPrefix <= parent.prefix) {
    throw new Error(`Target prefix /${targetPrefix} must be greater than parent prefix /${parent.prefix}.`);
  }
  if (targetPrefix > 32) {
    throw new Error("Target prefix cannot exceed /32.");
  }

  const numSubnets = Math.pow(2, targetPrefix - parent.prefix);
  const subnetSize = Math.pow(2, 32 - targetPrefix);
  const parentNetUint = ipToUint32(parent.networkAddress);

  const items: SubnetDivisionItem[] = [];
  // Cap at 256 subnets for UI responsiveness
  const displayLimit = Math.min(numSubnets, 256);

  for (let i = 0; i < displayLimit; i++) {
    const netUint = parentNetUint + i * subnetSize;
    const bcastUint = netUint + subnetSize - 1;
    const firstUsable = targetPrefix >= 31 ? netUint : netUint + 1;
    const lastUsable = targetPrefix >= 31 ? bcastUint : bcastUint - 1;
    const usableHosts =
      targetPrefix === 32 ? 1 : targetPrefix === 31 ? 2 : subnetSize - 2;

    items.push({
      index: i + 1,
      cidr: `${uint32ToIp(netUint)}/${targetPrefix}`,
      networkAddress: uint32ToIp(netUint),
      firstUsable: uint32ToIp(firstUsable),
      lastUsable: uint32ToIp(lastUsable),
      broadcastAddress: uint32ToIp(bcastUint),
      usableHosts: Math.max(0, usableHosts),
    });
  }

  return items;
}

/**
 * Plans Variable Length Subnet Masking (VLSM) for an IPv4 parent network
 * given a list of desired host requirements.
 */
export function planVlsm(
  parentCidr: string,
  requirements: Array<{ id: string; name: string; requiredHosts: number }>
): VlsmSubnetItem[] {
  const parent = calculateIpv4Subnet(parentCidr);
  const parentNetUint = ipToUint32(parent.networkAddress);
  const parentCapacity = parent.totalHosts;

  // Sort requirements descending by required host count
  const sorted = [...requirements].sort(
    (a, b) => b.requiredHosts - a.requiredHosts
  );

  let currentUint = parentNetUint;
  const results: VlsmSubnetItem[] = [];

  for (const req of sorted) {
    if (req.requiredHosts <= 0) continue;

    // Calculate required prefix
    // Needs 2 addresses for net & bcast (except for 1 host or 2 hosts RFC 3021)
    let neededCapacity = req.requiredHosts + 2;
    if (req.requiredHosts === 1) neededCapacity = 2; // /31 or /32
    if (req.requiredHosts === 2) neededCapacity = 2; // /31

    let prefix = 32;
    while (prefix > 0 && Math.pow(2, 32 - prefix) < neededCapacity) {
      prefix--;
    }

    const blockSize = Math.pow(2, 32 - prefix);
    const allocatedHosts =
      prefix === 32 ? 1 : prefix === 31 ? 2 : blockSize - 2;

    // Align currentUint to blockSize boundary
    const remainder = currentUint % blockSize;
    if (remainder !== 0) {
      currentUint += blockSize - remainder;
    }

    if (currentUint + blockSize - parentNetUint > parentCapacity) {
      throw new Error(
        `Insufficient address space in ${parent.cidr} for ${req.name} (${req.requiredHosts} hosts).`
      );
    }

    const netUint = currentUint;
    const bcastUint = netUint + blockSize - 1;
    const firstUsable = prefix >= 31 ? netUint : netUint + 1;
    const lastUsable = prefix >= 31 ? bcastUint : bcastUint - 1;

    results.push({
      id: req.id,
      name: req.name,
      requiredHosts: req.requiredHosts,
      allocatedHosts,
      prefix,
      cidr: `${uint32ToIp(netUint)}/${prefix}`,
      networkAddress: uint32ToIp(netUint),
      firstUsable: uint32ToIp(firstUsable),
      lastUsable: uint32ToIp(lastUsable),
      broadcastAddress: uint32ToIp(bcastUint),
      subnetMask: uint32ToIp(prefixToMaskUint32(prefix)),
    });

    currentUint += blockSize;
  }

  return results;
}

/**
 * Tests whether an IPv4 address is contained inside a target CIDR block.
 */
export function checkIpInSubnet(ip: string, cidr: string): boolean {
  try {
    const ipUint = ipToUint32(ip);
    const subnet = calculateIpv4Subnet(cidr);
    const netUint = ipToUint32(subnet.networkAddress);
    const bcastUint = ipToUint32(subnet.broadcastAddress);
    return ipUint >= netUint && ipUint <= bcastUint;
  } catch {
    return false;
  }
}

/**
 * Detects if two IPv4 CIDR blocks overlap with each other.
 */
export function checkSubnetOverlap(cidrA: string, cidrB: string): boolean {
  try {
    const subA = calculateIpv4Subnet(cidrA);
    const subB = calculateIpv4Subnet(cidrB);

    const startA = ipToUint32(subA.networkAddress);
    const endA = ipToUint32(subA.broadcastAddress);
    const startB = ipToUint32(subB.networkAddress);
    const endB = ipToUint32(subB.broadcastAddress);

    return Math.max(startA, startB) <= Math.min(endA, endB);
  } catch {
    return false;
  }
}

// Parse IPv6 address and prefix into BigInt
export function parseIpv6(input: string): { bigInt: bigint; prefix: number } {
  const [base, pStr] = input.trim().split("/");
  let prefix = pStr !== undefined ? parseInt(pStr, 10) : 64;
  if (isNaN(prefix) || prefix < 0 || prefix > 128) {
    prefix = 64;
  }

  let parts = base.split("::");
  const left = parts[0] ? parts[0].split(":").filter(Boolean) : [];
  const right = parts[1] ? parts[1].split(":").filter(Boolean) : [];

  if (parts.length > 1) {
    const missing = 8 - (left.length + right.length);
    const middle = new Array(Math.max(0, missing)).fill("0");
    parts = [...left, ...middle, ...right];
  } else {
    parts = left;
  }

  if (parts.length !== 8) {
    throw new Error("Invalid IPv6 address structure.");
  }

  const hex = parts.map((p) => p.padStart(4, "0")).join("");
  return { bigInt: BigInt("0x" + hex), prefix };
}

// Convert 128-bit BigInt to formatted IPv6 string
export function ipv6BigIntToString(bi: bigint): string {
  const hex = bi.toString(16).padStart(32, "0");
  const groups: string[] = [];
  for (let i = 0; i < 32; i += 4) {
    groups.push(hex.slice(i, i + 4));
  }
  return groups.join(":");
}

// Compress IPv6 address with :: shorthand
export function compressIpv6(fullIpv6: string): string {
  const groups = fullIpv6.split(":").map((g) => g.replace(/^0+/, "") || "0");
  const joined = groups.join(":");
  // Replace longest sequence of :0:0: with ::
  return joined.replace(/(?:^|:)(?:0:){2,}/, "::");
}

/**
 * Calculates IPv6 subnet parameters.
 */
export function calculateIpv6Subnet(input: string): Ipv6SubnetDetails {
  const { bigInt, prefix } = parseIpv6(input);

  const maskBi =
    prefix === 0
      ? BigInt(0)
      : ((BigInt(1) << BigInt(128)) - BigInt(1)) ^
        ((BigInt(1) << BigInt(128 - prefix)) - BigInt(1));

  const networkBi = bigInt & maskBi;
  const lastBi =
    networkBi | (~maskBi & ((BigInt(1) << BigInt(128)) - BigInt(1)));

  const networkFull = ipv6BigIntToString(networkBi);
  const lastFull = ipv6BigIntToString(lastBi);
  const expanded = ipv6BigIntToString(bigInt);

  // Detect IPv6 Scope
  let scope: Ipv6SubnetDetails["scope"] = "Global Unicast";
  const hex = expanded.replace(/:/g, "");
  if (hex === "00000000000000000000000000000001") {
    scope = "Loopback";
  } else if (hex === "00000000000000000000000000000000") {
    scope = "Unspecified";
  } else if (hex.startsWith("fe80") || hex.startsWith("fe9") || hex.startsWith("fea") || hex.startsWith("feb")) {
    scope = "Link-Local";
  } else if (hex.startsWith("fc") || hex.startsWith("fd")) {
    scope = "Unique Local (ULA)";
  } else if (hex.startsWith("ff")) {
    scope = "Multicast";
  }

  const hostBits = 128 - prefix;
  let totalHostsStr = `2^${hostBits}`;
  if (hostBits <= 32) {
    totalHostsStr = Math.pow(2, hostBits).toLocaleString();
  } else if (hostBits === 64) {
    totalHostsStr = "18,446,744,073,709,551,616 (2^64)";
  }

  return {
    ip: compressIpv6(expanded),
    prefix,
    cidr: `${compressIpv6(networkFull)}/${prefix}`,
    networkAddress: compressIpv6(networkFull),
    lastAddress: compressIpv6(lastFull),
    firstUsableAddress: compressIpv6(networkFull),
    lastUsableAddress: compressIpv6(lastFull),
    totalHostsStr,
    scope,
    expandedIp: expanded,
    compressedIp: compressIpv6(expanded),
  };
}

// Built-in Subnet Presets
export const SUBNET_PRESETS: SubnetPreset[] = [
  {
    id: "office-lan",
    name: "Office LAN (/24)",
    description: "Standard RFC 1918 Class C private network with 254 usable hosts.",
    cidr: "192.168.1.100/24",
    type: "ipv4",
  },
  {
    id: "cloud-vpc",
    name: "Cloud VPC Primary (/16)",
    description: "Large enterprise cloud VPC network block with 65,534 usable hosts.",
    cidr: "10.0.0.0/16",
    type: "ipv4",
  },
  {
    id: "router-p2p",
    name: "Point-to-Point Link (/31)",
    description: "RFC 3021 router-to-router point-to-point link with 2 usable hosts.",
    cidr: "172.16.10.0/31",
    type: "ipv4",
  },
  {
    id: "docker-network",
    name: "Docker Bridge Subnet (/20)",
    description: "Container virtualization subnet with 4,094 usable container IP addresses.",
    cidr: "172.17.0.0/20",
    type: "ipv4",
  },
  {
    id: "ipv6-global",
    name: "IPv6 Global Unicast (/64)",
    description: "Standard IPv6 SLAAC end-user subnet with 18.4 quintillion addresses.",
    cidr: "2001:db8:85a3::8a2e:370:7334/64",
    type: "ipv6",
  },
];
