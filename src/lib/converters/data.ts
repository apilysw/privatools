import * as yaml from "js-yaml";
import Papa from "papaparse";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export type DataFormat = "json" | "yaml" | "csv" | "xml";

export interface ConversionResult {
  output: string;
  durationMs: number;
  inputBytes: number;
  outputBytes: number;
  error?: string;
}

export function parseData(text: string, format: DataFormat): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Input is empty.");
  }

  switch (format) {
    case "json":
      return JSON.parse(trimmed);

    case "yaml":
      return yaml.load(trimmed);

    case "csv": {
      const parsed = Papa.parse(trimmed, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error(parsed.errors.map((e) => e.message).join(", "));
      }
      return parsed.data;
    }

    case "xml": {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        parseAttributeValue: true,
      });
      return parser.parse(trimmed);
    }

    default:
      throw new Error(`Unsupported source format: ${format}`);
  }
}

export function serializeData(data: unknown, format: DataFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(data, null, 2);

    case "yaml":
      return yaml.dump(data, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
      });

    case "csv": {
      // If data is an array of objects
      if (Array.isArray(data)) {
        return Papa.unparse(data);
      }
      // If data is a single object, wrap it in array
      if (typeof data === "object" && data !== null) {
        return Papa.unparse([data]);
      }
      throw new Error("CSV serialization requires an array of objects or key-value object.");
    }

    case "xml": {
      const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        format: true,
        indentBy: "  ",
      });

      // XML needs a single root element
      const wrapped =
        typeof data === "object" && data !== null && !Array.isArray(data)
          ? data
          : { root: { item: data } };

      return builder.build(wrapped);
    }

    default:
      throw new Error(`Unsupported target format: ${format}`);
  }
}

export function convertData(
  inputText: string,
  fromFormat: DataFormat,
  toFormat: DataFormat
): ConversionResult {
  const startTime = performance.now();
  const inputBytes = new Blob([inputText]).size;

  if (!inputText.trim()) {
    return {
      output: "",
      durationMs: 0,
      inputBytes: 0,
      outputBytes: 0,
    };
  }

  try {
    const parsed = parseData(inputText, fromFormat);
    const output = serializeData(parsed, toFormat);
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const outputBytes = new Blob([output]).size;

    return {
      output,
      durationMs,
      inputBytes,
      outputBytes,
    };
  } catch (err) {
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      output: "",
      durationMs,
      inputBytes,
      outputBytes: 0,
      error: errorMessage,
    };
  }
}

export const SAMPLE_DATA: Record<DataFormat, string> = {
  json: JSON.stringify(
    {
      company: "Acme Logistics",
      fleet_id: "FL-9021",
      active: true,
      drivers: [
        { id: 101, name: "Sarah Connor", rating: 4.9, vehicles: ["Truck A", "Van 4"] },
        { id: 102, name: "Marcus Wright", rating: 4.7, vehicles: ["Semi 12"] },
      ],
      metrics: {
        total_deliveries: 1420,
        on_time_rate: 0.985,
      },
    },
    null,
    2
  ),
  yaml: `company: Acme Logistics
fleet_id: FL-9021
active: true
drivers:
  - id: 101
    name: Sarah Connor
    rating: 4.9
    vehicles:
      - Truck A
      - Van 4
  - id: 102
    name: Marcus Wright
    rating: 4.7
    vehicles:
      - Semi 12
metrics:
  total_deliveries: 1420
  on_time_rate: 0.985
`,
  csv: `id,name,role,rating,city
101,Sarah Connor,Fleet Captain,4.9,Los Angeles
102,Marcus Wright,Long Haul Specialist,4.7,Chicago
103,Kyle Reese,Urban Dispatch,4.8,New York
`,
  xml: `<?xml version="1.0" encoding="UTF-8"?>
<fleet company="Acme Logistics" active="true">
  <drivers>
    <driver id="101">
      <name>Sarah Connor</name>
      <rating>4.9</rating>
    </driver>
    <driver id="102">
      <name>Marcus Wright</name>
      <rating>4.7</rating>
    </driver>
  </drivers>
  <metrics deliveries="1420" onTime="98.5%"/>
</fleet>`,
};
