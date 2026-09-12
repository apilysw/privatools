import * as Diff from "diff";

export type DiffViewMode = "split" | "unified" | "patch";

export interface WordDiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface DiffLineItem {
  num: number;
  text: string;
  type: "unchanged" | "added" | "removed" | "modified";
  wordDiff?: WordDiffPart[];
}

export interface SideBySideRow {
  left: DiffLineItem | null;
  right: DiffLineItem | null;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  unchanged: number;
  totalOldLines: number;
  totalNewLines: number;
}

export interface DiffOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

// Compute aligned rows for Side-by-Side (Split) View
export function alignSideBySide(
  oldStr: string,
  newStr: string,
  options?: DiffOptions
): SideBySideRow[] {
  const diffs = Diff.diffLines(oldStr, newStr, {
    ignoreWhitespace: options?.ignoreWhitespace ?? false,
    stripTrailingCr: true,
  });

  const rows: SideBySideRow[] = [];
  let leftNum = 1;
  let rightNum = 1;

  for (let i = 0; i < diffs.length; i++) {
    const part = diffs[i];
    const nextPart = diffs[i + 1];

    // Detect Replacement Blocks (Removed lines immediately followed by Added lines)
    if (part.removed && nextPart && nextPart.added) {
      const oldLines = part.value.replace(/\r?\n$/, "").split(/\r?\n/);
      const newLines = nextPart.value.replace(/\r?\n$/, "").split(/\r?\n/);
      const maxLen = Math.max(oldLines.length, newLines.length);

      for (let k = 0; k < maxLen; k++) {
        const hasLeft = k < oldLines.length;
        const hasRight = k < newLines.length;

        let leftWordDiff: WordDiffPart[] | undefined = undefined;
        let rightWordDiff: WordDiffPart[] | undefined = undefined;

        if (hasLeft && hasRight) {
          const rawWords = Diff.diffWordsWithSpace(oldLines[k], newLines[k]);
          leftWordDiff = rawWords
            .filter((w) => !w.added)
            .map((w) => ({ value: w.value, removed: w.removed }));
          rightWordDiff = rawWords
            .filter((w) => !w.removed)
            .map((w) => ({ value: w.value, added: w.added }));
        }

        rows.push({
          left: hasLeft
            ? {
                num: leftNum++,
                text: oldLines[k],
                type: hasRight ? "modified" : "removed",
                wordDiff: leftWordDiff,
              }
            : null,
          right: hasRight
            ? {
                num: rightNum++,
                text: newLines[k],
                type: hasLeft ? "modified" : "added",
                wordDiff: rightWordDiff,
              }
            : null,
        });
      }
      i++; // Skip the paired nextPart
    } else if (part.removed) {
      const lines = part.value.replace(/\r?\n$/, "").split(/\r?\n/);
      for (const line of lines) {
        rows.push({
          left: { num: leftNum++, text: line, type: "removed" },
          right: null,
        });
      }
    } else if (part.added) {
      const lines = part.value.replace(/\r?\n$/, "").split(/\r?\n/);
      for (const line of lines) {
        rows.push({
          left: null,
          right: { num: rightNum++, text: line, type: "added" },
        });
      }
    } else {
      const lines = part.value.replace(/\r?\n$/, "").split(/\r?\n/);
      for (const line of lines) {
        rows.push({
          left: { num: leftNum++, text: line, type: "unchanged" },
          right: { num: rightNum++, text: line, type: "unchanged" },
        });
      }
    }
  }

  return rows;
}

// Compute structured hunks for Unified (Inline) View
export interface UnifiedHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: Array<{
    type: "add" | "del" | "normal";
    text: string;
    oldLineNumber?: number;
    newLineNumber?: number;
  }>;
}

export function computeUnifiedDiff(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  options?: DiffOptions
): UnifiedHunk[] {
  const patch = Diff.structuredPatch(
    oldFileName,
    newFileName,
    oldStr,
    newStr,
    "",
    "",
    {
      context: 3,
      ignoreWhitespace: options?.ignoreWhitespace ?? false,
    }
  );

  return patch.hunks.map((hunk) => {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;

    const lines = hunk.lines.map((raw) => {
      const prefix = raw[0];
      const text = raw.substring(1);

      if (prefix === "+") {
        return {
          type: "add" as const,
          text,
          newLineNumber: newLine++,
        };
      } else if (prefix === "-") {
        return {
          type: "del" as const,
          text,
          oldLineNumber: oldLine++,
        };
      } else {
        return {
          type: "normal" as const,
          text,
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        };
      }
    });

    return {
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      header: `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
      lines,
    };
  });
}

// Generate standard Unified .patch text
export function generatePatch(
  oldFileName: string,
  newFileName: string,
  oldStr: string,
  newStr: string,
  options?: DiffOptions
): string {
  return Diff.createTwoFilesPatch(
    oldFileName || "original.txt",
    newFileName || "modified.txt",
    oldStr,
    newStr,
    "",
    "",
    {
      ignoreWhitespace: options?.ignoreWhitespace ?? false,
    }
  );
}

// Calculate diff statistics (additions, deletions, modifications, unchanged)
export function calculateDiffStats(
  oldStr: string,
  newStr: string,
  options?: DiffOptions
): DiffStats {
  const rows = alignSideBySide(oldStr, newStr, options);

  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  let unchanged = 0;

  for (const row of rows) {
    if (row.left?.type === "modified" || row.right?.type === "modified") {
      modifications++;
    } else if (row.left?.type === "removed") {
      deletions++;
    } else if (row.right?.type === "added") {
      additions++;
    } else if (row.left?.type === "unchanged" && row.right?.type === "unchanged") {
      unchanged++;
    }
  }

  const totalOldLines = oldStr ? oldStr.split(/\r?\n/).length : 0;
  const totalNewLines = newStr ? newStr.split(/\r?\n/).length : 0;

  return {
    additions,
    deletions,
    modifications,
    unchanged,
    totalOldLines,
    totalNewLines,
  };
}

// Built-in realistic sample scenarios
export const DIFF_PRESETS = [
  {
    id: "typescript",
    name: "TypeScript Refactoring",
    oldFileName: "auth-service-legacy.ts",
    newFileName: "auth-service-modern.ts",
    oldText: `// User Authentication Service (Legacy Callback Style)
function authenticateUser(credentials, callback) {
  validateInput(credentials, function (err, isValid) {
    if (err || !isValid) {
      return callback(new Error("Invalid credentials"));
    }
    database.findUser(credentials.username, function (err, user) {
      if (err || !user) {
        return callback(new Error("User not found"));
      }
      verifyPassword(credentials.password, user.hash, function (err, match) {
        if (err || !match) {
          return callback(new Error("Authentication failed"));
        }
        callback(null, { id: user.id, username: user.username, role: user.role });
      });
    });
  });
}`,
    newText: `// User Authentication Service (Modern TypeScript Async/Await)
interface UserCredentials {
  username: string;
  passwordHash: string;
}

interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "user" | "auditor";
}

async function authenticateUser(credentials: UserCredentials): Promise<AuthUser> {
  const isValid = await validateInput(credentials);
  if (!isValid) {
    throw new Error("Invalid credentials payload");
  }

  const user = await database.findUser(credentials.username);
  if (!user) {
    throw new Error("User account not found");
  }

  const isMatch = await verifyPassword(credentials.passwordHash, user.hash);
  if (!isMatch) {
    throw new Error("Invalid password credentials");
  }

  return { id: user.id, username: user.username, role: user.role };
}`,
  },
  {
    id: "json-config",
    name: "JSON Config Drift",
    oldFileName: "gateway.config.json",
    newFileName: "gateway.config.prod.json",
    oldText: `{
  "serviceName": "api-gateway",
  "version": "1.4.0",
  "environment": "staging",
  "port": 8080,
  "rateLimiting": {
    "enabled": false,
    "maxRequestsPerMinute": 1000
  },
  "cors": {
    "allowedOrigins": [
      "http://localhost:3000",
      "https://staging.privatools.dev"
    ]
  },
  "telemetry": {
    "enabled": true,
    "sampleRate": 1.0
  }
}`,
    newText: `{
  "serviceName": "api-gateway",
  "version": "1.5.2",
  "environment": "production",
  "port": 443,
  "tls": {
    "minVersion": "TLSv1.3",
    "strictTransportSecurity": true
  },
  "rateLimiting": {
    "enabled": true,
    "maxRequestsPerMinute": 100
  },
  "cors": {
    "allowedOrigins": [
      "https://privatools.dev",
      "https://app.privatools.dev"
    ]
  },
  "telemetry": {
    "enabled": false,
    "sampleRate": 0.0
  }
}`,
  },
  {
    id: "legal-clause",
    name: "Legal Contract Clause",
    oldFileName: "nda-v1.txt",
    newFileName: "nda-v2-amended.txt",
    oldText: `CONFIDENTIALITY AGREEMENT

Section 4. Term and Termination
The obligations of confidentiality under this Agreement shall survive for a period of three (3) years from the date of initial disclosure. Either party may terminate this Agreement upon thirty (30) days written notice.

Section 5. Governing Law
This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.`,
    newText: `MUTUAL CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

Section 4. Term and Termination
The obligations of confidentiality under this Agreement shall survive in perpetuity with respect to trade secrets, and for a period of five (5) years from disclosure with respect to all other Confidential Information. Either party may terminate this Agreement upon sixty (60) days written notice.

Section 5. Governing Law and Arbitration
This Agreement shall be governed by the laws of England and Wales. Any dispute arising out of or in connection with this contract shall be referred to and finally resolved by arbitration under the LCIA Rules.`,
  },
];
