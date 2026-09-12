export interface CaptureGroup {
  index: number;
  name?: string;
  value: string;
  start: number;
  end: number;
}

export interface RegexMatch {
  index: number;
  matchIndex: number;
  value: string;
  start: number;
  end: number;
  line: number;
  column: number;
  groups: CaptureGroup[];
}

export interface RegexExecutionResult {
  matches: RegexMatch[];
  totalMatches: number;
  executionTimeMs: number;
  error: string | null;
  replacedText: string | null;
}

export interface RegexPreset {
  id: string;
  name: string;
  category: "Logistics" | "DevOps & Logs" | "Web & Auth" | "Format & Data";
  pattern: string;
  flags: string;
  testText: string;
  replacementText?: string;
  description: string;
}

export interface CodeSnippet {
  language: string;
  title: string;
  code: string;
}

export const REGEX_PRESETS: RegexPreset[] = [
  {
    id: "gs1-identifiers",
    name: "GS1 Application Identifiers",
    category: "Logistics",
    pattern: "\\((?<ai>\\d{2,4})\\)(?<value>[^()]+)",
    flags: "g",
    testText: "(00)300123451234567899\n(01)00012345678905(10)LOT-2026A(17)261231\n(400)PO-987654(410)9501101020917",
    replacementText: "AI: $<ai> -> $<value>\n",
    description: "Extract parenthesized GS1 Application Identifiers (e.g. SSCC, GTIN, Batch, Expiry) into named capturing groups.",
  },
  {
    id: "warehouse-bin-tag",
    name: "Warehouse Bin & Shelf Tag",
    category: "Logistics",
    pattern: "\\b(?<aisle>[A-Z]{3,5})-(?<bay>\\d{2})-(?<shelf>[A-Z])(?<bin>\\d{2})\\b",
    flags: "g",
    testText: "Pick list for order #9821:\n- Item A: LOC-AISLE-04-B12 (invalid)\n- Item B: AISLE-01-04-A02\n- Item C: SOUTH-02-12-B08\n- Item D: ZONE-09-01-C15",
    replacementText: "[$<aisle> Bay $<bay> Tier $<shelf>-$<bin>]",
    description: "Matches standard distribution rack, bay, shelf, and bin location codes with named capturing groups.",
  },
  {
    id: "server-log-level",
    name: "Server Logs with Severity",
    category: "DevOps & Logs",
    pattern: "^\\[(?<timestamp>[^\\]]+)\\] \\[(?<level>INFO|WARN|ERROR|FATAL)\\] (?<message>.*)$",
    flags: "gm",
    testText: "[2026-09-11T14:20:01.102Z] [INFO] Dispatch worker initialized for depot 4\n[2026-09-11T14:20:05.412Z] [WARN] Barcode scanner timeout on lane 3; retrying\n[2026-09-11T14:20:12.890Z] [ERROR] SSCC checksum verification failed for pallet 9012\n[2026-09-11T14:20:15.001Z] [INFO] Thermal printer online",
    replacementText: "$<level>: $<message> (at $<timestamp>)",
    description: "Parses ISO timestamp, log level (INFO/WARN/ERROR/FATAL), and log message from multiline application logs.",
  },
  {
    id: "iso-timestamp",
    name: "ISO 8601 & RFC 3339 Timestamp",
    category: "Format & Data",
    pattern: "\\b(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})T(?<time>\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?)(?<offset>Z|[+-]\\d{2}:\\d{2})\\b",
    flags: "g",
    testText: "Manifest generated at 2026-09-11T21:40:00Z and delivered at 2026-09-12T08:15:30.450+01:00 by carrier.",
    replacementText: "$<day>/$<month>/$<year> at $<time> ($<offset>)",
    description: "Extracts date components (year, month, day, time, timezone offset) from ISO 8601 datetimes.",
  },
  {
    id: "email-rfc5322",
    name: "Email Address (RFC 5322)",
    category: "Web & Auth",
    pattern: "\\b(?<user>[a-zA-Z0-9_.+-]+)@(?<domain>[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+)\\b",
    flags: "g",
    testText: "Contact logistics at support@privatools.dev, dispatcher.ops@shipping-hub.co.uk, or dispatch@warehouse.local.",
    replacementText: "$<user> [at] $<domain>",
    description: "Validates and extracts user and domain components of email addresses.",
  },
  {
    id: "ipv4-cidr",
    name: "IPv4 Address & CIDR Subnet",
    category: "DevOps & Logs",
    pattern: "\\b(?<ip>(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))(?:\\/(?<cidr>\\d{1,2}))?\\b",
    flags: "g",
    testText: "Allowlist rules: 192.168.1.1/24, 10.0.0.1, 172.16.254.1/16, and invalid 999.999.999.999.",
    replacementText: "IP: $<ip> (mask: $<cidr>)",
    description: "Matches valid IPv4 addresses (0-255 per octet) with optional CIDR subnet prefix.",
  },
  {
    id: "semver-version",
    name: "Semantic Version (SemVer 2.0)",
    category: "Format & Data",
    pattern: "^v?(?<major>0|[1-9]\\d*)\\.(?<minor>0|[1-9]\\d*)\\.(?<patch>0|[1-9]\\d*)(?:-(?<prerelease>[0-9A-Za-z.-]+))?(?:\\+(?<build>[0-9A-Za-z.-]+))?$",
    flags: "gm",
    testText: "v1.0.0\n2.4.12-beta.1\n0.1.0-alpha+001\n16.3.4\ninvalid.version.1",
    replacementText: "Major: $<major>, Minor: $<minor>, Patch: $<patch>",
    description: "Strict SemVer 2.0 regex capturing major, minor, patch, pre-release, and build metadata.",
  },
  {
    id: "url-parser",
    name: "HTTP/HTTPS URL Parser",
    category: "Web & Auth",
    pattern: "^(?<protocol>https?):\\/\\/(?<domain>[^/:\\s]+)(?::(?<port>\\d+))?(?<path>\\/[^?#\\s]*)?(?:\\?(?<query>[^#\\s]*))?(?:#(?<hash>\\S*))?$",
    flags: "gm",
    testText: "https://privatools.dev/tools/regex-studio?tab=replace&mode=dark#output\nhttp://localhost:3000/api/v1/health\nhttps://api.logistics.org:8443/dispatch?route=402",
    replacementText: "Protocol: $<protocol> | Domain: $<domain> | Path: $<path>",
    description: "Parses URLs into protocol, domain, port, path, query string, and hash fragment.",
  },
  {
    id: "uuid-guid",
    name: "UUID / GUID (RFC 4122)",
    category: "Format & Data",
    pattern: "\\b(?<uuid>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})\\b",
    flags: "g",
    testText: "Tracking session: 8dffa213-54ef-4583-9da3-d1581c2297b3\nWarehouse token: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d\nCorrupt ID: 12345-not-a-uuid",
    replacementText: "[$<uuid>]",
    description: "Matches RFC 4122 compliant UUIDs (v1 through v5) with hexadecimal boundary validation.",
  },
  {
    id: "sql-connection",
    name: "Key-Value / Connection String",
    category: "DevOps & Logs",
    pattern: "(?<key>[a-zA-Z_][a-zA-Z0-9_]*)=(?<value>[^;\\s]+)",
    flags: "g",
    testText: "Server=db.production.lan;Database=warehouse_db;User Id=app_service;Password=SecretPass123!;Port=5432;",
    replacementText: "$<key> => \"$<value>\"\n",
    description: "Extracts parameter keys and values from database connection strings and configuration pairs.",
  },
];

export interface CheatSheetItem {
  token: string;
  name: string;
  description: string;
  example: string;
}

export interface CheatSheetCategory {
  category: string;
  items: CheatSheetItem[];
}

export const REGEX_CHEAT_SHEET: CheatSheetCategory[] = [
  {
    category: "Character Classes",
    items: [
      { token: "\\d", name: "Digit", description: "Matches any digit (0-9)", example: "\\d{3} matches 123" },
      { token: "\\D", name: "Non-Digit", description: "Matches any character that is not a digit", example: "\\D+ matches ABC" },
      { token: "\\w", name: "Word Character", description: "Matches alphanumeric characters and underscore [a-zA-Z0-9_]", example: "\\w+ matches user_1" },
      { token: "\\W", name: "Non-Word Character", description: "Matches any character that is not a word character", example: "\\W matches @" },
      { token: "\\s", name: "Whitespace", description: "Matches space, tab, newline, carriage return", example: "\\s+ matches spaces" },
      { token: "\\S", name: "Non-Whitespace", description: "Matches any character that is not whitespace", example: "\\S+ matches word" },
      { token: ".", name: "Any Character", description: "Matches any character except newlines (unless 's' flag is set)", example: "a.c matches abc, a-c" },
      { token: "[abc]", name: "Character Set", description: "Matches any character enclosed within the brackets", example: "[aeiou] matches vowels" },
      { token: "[^abc]", name: "Negated Set", description: "Matches any character NOT enclosed in brackets", example: "[^0-9] matches non-digits" },
    ],
  },
  {
    category: "Quantifiers",
    items: [
      { token: "*", name: "0 or more", description: "Matches preceding element 0 or more times (greedy)", example: "a* matches '', a, aaa" },
      { token: "+", name: "1 or more", description: "Matches preceding element 1 or more times (greedy)", example: "a+ matches a, aaa" },
      { token: "?", name: "0 or 1 (Optional)", description: "Matches preceding element 0 or 1 time", example: "colou?r matches color, colour" },
      { token: "{n}", name: "Exact count", description: "Matches preceding element exactly n times", example: "\\d{4} matches 2026" },
      { token: "{n,m}", name: "Range count", description: "Matches between n and m times inclusive", example: "\\w{3,8} matches length 3 to 8" },
      { token: "*?", name: "Lazy quantifier", description: "Matches as few characters as possible", example: "<.*?> matches <b>" },
    ],
  },
  {
    category: "Anchors & Boundaries",
    items: [
      { token: "^", name: "Start of string / line", description: "Matches beginning of string (or line in multiline mode 'm')", example: "^Error matches start" },
      { token: "$", name: "End of string / line", description: "Matches end of string (or line in multiline mode 'm')", example: "\\.json$ matches file extension" },
      { token: "\\b", name: "Word Boundary", description: "Matches position between a word character and non-word character", example: "\\bcat\\b matches cat not scatter" },
      { token: "\\B", name: "Non-Word Boundary", description: "Matches position that is not a word boundary", example: "\\Bcat matches scatter" },
    ],
  },
  {
    category: "Groups & Lookarounds",
    items: [
      { token: "(abc)", name: "Capturing Group", description: "Groups tokens together and remembers the match for $1, $2", example: "(ID-\\d+) captures ID-100" },
      { token: "(?<name>abc)", name: "Named Capturing Group", description: "Captures match under a named identifier $<name>", example: "(?<sscc>\\d{18}) captures SSCC" },
      { token: "(?:abc)", name: "Non-Capturing Group", description: "Groups tokens without creating a backreference", example: "(?:https?|ftp):// groups protocols" },
      { token: "(?=abc)", name: "Positive Lookahead", description: "Asserts that following text matches pattern without consuming", example: "\\d+(?=px) matches 100 in 100px" },
      { token: "(?!abc)", name: "Negative Lookahead", description: "Asserts that following text does NOT match pattern", example: "foo(?!bar) matches foo not foobar" },
      { token: "(?<=abc)", name: "Positive Lookbehind", description: "Asserts that preceding text matches pattern", example: "(?<=\\$)\\d+ matches 50 in $50" },
      { token: "(?<!abc)", name: "Negative Lookbehind", description: "Asserts that preceding text does NOT match pattern", example: "(?<!\\$)\\d+ matches 50 in €50" },
    ],
  },
];

/**
 * Execute regular expression against test string with safety iteration cap and benchmark timing.
 */
export function executeRegex(
  pattern: string,
  flags: string,
  testString: string,
  substitutionText?: string
): RegexExecutionResult {
  if (!pattern) {
    return {
      matches: [],
      totalMatches: 0,
      executionTimeMs: 0,
      error: null,
      replacedText: null,
    };
  }

  const startTime = performance.now();

  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];
    const isGlobal = flags.includes("g");

    // Line offset calculator for line and column numbers
    const lineStarts: number[] = [0];
    for (let i = 0; i < testString.length; i++) {
      if (testString[i] === "\n") {
        lineStarts.push(i + 1);
      }
    }

    const getLineAndCol = (index: number): { line: number; column: number } => {
      let low = 0;
      let high = lineStarts.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (lineStarts[mid] <= index) {
          if (mid === lineStarts.length - 1 || lineStarts[mid + 1] > index) {
            return { line: mid + 1, column: index - lineStarts[mid] + 1 };
          }
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return { line: 1, column: index + 1 };
    };

    let matchCount = 0;
    const MAX_MATCHES = 5000; // Safety cap against ReDoS or excessive loops

    if (isGlobal) {
      let match: RegExpExecArray | null;
      let lastIndex = -1;

      while ((match = regex.exec(testString)) !== null) {
        matchCount++;
        if (matchCount > MAX_MATCHES) {
          break;
        }

        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const { line, column } = getLineAndCol(matchStart);

        // Extract groups
        const groups: CaptureGroup[] = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            const groupVal = match[i];
            if (groupVal !== undefined) {
              groups.push({
                index: i,
                value: groupVal,
                start: matchStart, // Approximate bounds
                end: matchEnd,
              });
            }
          }
        }

        // Named groups if available
        if (match.groups) {
          for (const [name, val] of Object.entries(match.groups)) {
            if (val !== undefined) {
              const existing = groups.find((g) => g.value === val && !g.name);
              if (existing) {
                existing.name = name;
              } else {
                groups.push({
                  index: groups.length + 1,
                  name,
                  value: val,
                  start: matchStart,
                  end: matchEnd,
                });
              }
            }
          }
        }

        matches.push({
          index: matchStart,
          matchIndex: matchCount,
          value: match[0],
          start: matchStart,
          end: matchEnd,
          line,
          column,
          groups,
        });

        // Prevent infinite loop on zero-length matches (e.g. ^, $, \b, a*)
        if (regex.lastIndex === lastIndex) {
          regex.lastIndex++;
        }
        lastIndex = regex.lastIndex;

        if (regex.lastIndex > testString.length) {
          break;
        }
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const { line, column } = getLineAndCol(matchStart);

        const groups: CaptureGroup[] = [];
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            const groupVal = match[i];
            if (groupVal !== undefined) {
              groups.push({
                index: i,
                value: groupVal,
                start: matchStart,
                end: matchEnd,
              });
            }
          }
        }

        if (match.groups) {
          for (const [name, val] of Object.entries(match.groups)) {
            if (val !== undefined) {
              const existing = groups.find((g) => g.value === val && !g.name);
              if (existing) {
                existing.name = name;
              } else {
                groups.push({
                  index: groups.length + 1,
                  name,
                  value: val,
                  start: matchStart,
                  end: matchEnd,
                });
              }
            }
          }
        }

        matches.push({
          index: matchStart,
          matchIndex: 1,
          value: match[0],
          start: matchStart,
          end: matchEnd,
          line,
          column,
          groups,
        });
      }
    }

    let replacedText: string | null = null;
    if (substitutionText !== undefined) {
      try {
        const replaceRegex = new RegExp(pattern, flags);
        replacedText = testString.replace(replaceRegex, substitutionText);
      } catch {
        replacedText = null;
      }
    }

    const duration = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      matches,
      totalMatches: matches.length,
      executionTimeMs: duration,
      error: null,
      replacedText,
    };
  } catch (err: unknown) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    const message = err instanceof Error ? err.message : String(err);
    return {
      matches: [],
      totalMatches: 0,
      executionTimeMs: duration,
      error: message,
      replacedText: null,
    };
  }
}

/**
 * Generate multi-language code snippets for the given regex pattern and flags.
 */
export function generateCodeSnippets(
  pattern: string,
  flags: string,
  testString: string,
  replacement?: string
): CodeSnippet[] {
  const safePattern = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const safeText = testString.slice(0, 100).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const safeSub = (replacement || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return [
    {
      language: "typescript",
      title: "JavaScript / TypeScript",
      code: `// RegExp Match & Replace in TypeScript/JavaScript
const regex = /${pattern}/${flags};
const text = "${safeText}";

// 1. Check if matches
const isMatch: boolean = regex.test(text);

// 2. Iterate all matches with capture groups
for (const match of text.matchAll(regex)) {
  console.log("Found match:", match[0], "at index:", match.index);
  if (match.groups) {
    console.log("Named groups:", match.groups);
  }
}

${replacement ? `// 3. Substitution\nconst replaced = text.replace(regex, "${safeSub}");\nconsole.log(replaced);` : ""}`,
    },
    {
      language: "python",
      title: "Python (re module)",
      code: `import re

pattern = r"${pattern}"
text = "${safeText}"

# 1. Find all matches with details
matches = [m for m in re.finditer(pattern, text${flags.includes("i") ? ", re.IGNORECASE" : ""}${flags.includes("m") ? " | re.MULTILINE" : ""}${flags.includes("s") ? " | re.DOTALL" : ""})]

for m in matches:
    print(f"Match: {m.group(0)} at {m.span()}")
    if m.groupdict():
        print(f"  Groups: {m.groupdict()}")

${replacement ? `# 2. Substitution\nreplaced = re.sub(pattern, r"${safeSub}", text)\nprint(replaced)` : ""}`,
    },
    {
      language: "go",
      title: "Go (regexp package)",
      code: `package main

import (
	"fmt"
	"regexp"
)

func main() {
	pattern := \`${pattern}\`
	text := "${safeText}"

	re := regexp.MustCompile(pattern)

	// 1. Find all matches
	matches := re.FindAllString(text, -1)
	fmt.Printf("Total matches: %d\\n", len(matches))

${replacement ? `\t// 2. Replace all occurrences\n\treplaced := re.ReplaceAllString(text, \`${safeSub}\`)\n\tfmt.Println(replaced)\n` : ""}}`,
    },
    {
      language: "rust",
      title: "Rust (regex crate)",
      code: `use regex::Regex;

fn main() {
    let re = Regex::new(r"${pattern}").unwrap();
    let text = "${safeText}";

    // 1. Iterate over matches
    for mat in re.find_iter(text) {
        println!("Match: {} at {}-{}", mat.as_str(), mat.start(), mat.end());
    }

${replacement ? `    // 2. Substitution\n    let replaced = re.replace_all(text, "${safeSub}");\n    println!("{}", replaced);\n` : ""}}`,
    },
    {
      language: "java",
      title: "Java (java.util.regex)",
      code: `import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class RegexDemo {
    public static void main(String[] args) {
        Pattern pattern = Pattern.compile("${safePattern}"${flags.includes("i") ? ", Pattern.CASE_INSENSITIVE" : ""}${flags.includes("m") ? " | Pattern.MULTILINE" : ""}${flags.includes("s") ? " | Pattern.DOTALL" : ""});
        String text = "${safeText}";

        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            System.out.println("Match: " + matcher.group() + " at " + matcher.start());
        }

${replacement ? `        // Substitution\n        String replaced = matcher.replaceAll("${safeSub}");\n        System.out.println(replaced);\n` : "" }    }
}`,
    },
    {
      language: "csharp",
      title: "C# / .NET (System.Text.RegularExpressions)",
      code: `using System;
using System.Text.RegularExpressions;

class Program {
    static void Main() {
        string pattern = @"${pattern.replace(/"/g, '""')}";
        string text = "${safeText}";
        RegexOptions options = RegexOptions.None${flags.includes("i") ? " | RegexOptions.IgnoreCase" : ""}${flags.includes("m") ? " | RegexOptions.Multiline" : ""}${flags.includes("s") ? " | RegexOptions.Singleline" : ""};

        MatchCollection matches = Regex.Matches(text, pattern, options);
        foreach (Match m in matches) {
            Console.WriteLine($"Match: {m.Value} at {m.Index}");
        }

${replacement ? `        // Substitution\n        string replaced = Regex.Replace(text, pattern, @"${safeSub}", options);\n        Console.WriteLine(replaced);\n` : "" }    }
}`,
    },
    {
      language: "bash",
      title: "POSIX / Bash (grep & sed)",
      code: `# 1. Match lines with grep (Extended Regular Expressions)
grep -E${flags.includes("i") ? "i" : ""} '${pattern.replace(/'/g, "'\\''")}' filename.log

# 2. Extract only matching parts
grep -oE${flags.includes("i") ? "i" : ""} '${pattern.replace(/'/g, "'\\''")}' filename.log

${replacement ? `# 3. Stream edit & replace with sed\nsed -E 's/${pattern.replace(/\//g, "\\/")}/${replacement.replace(/\//g, "\\/")}/${flags.includes("g") ? "g" : ""}' filename.log` : ""}`,
    },
  ];
}
