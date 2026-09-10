export interface EdiElement {
  position: number;
  tag: string;
  value: string;
  components?: string[];
  label?: string;
}

export interface EdiSegment {
  index: number;
  tag: string;
  name: string;
  description: string;
  raw: string;
  elements: EdiElement[];
  isEnvelope: boolean;
  level: number;
}

export interface EdiDelimiters {
  segment: string;
  element: string;
  component: string;
  release?: string;
}

export interface ParsedEdiDocument {
  standard: "X12" | "EDIFACT" | "UNKNOWN";
  delimiters: EdiDelimiters;
  transactionSet?: {
    id: string;
    name: string;
  };
  interchangeSender?: string;
  interchangeReceiver?: string;
  controlNumber?: string;
  date?: string;
  segments: EdiSegment[];
  totalSegments: number;
  errors: string[];
}

// Common Segment Dictionary (ANSI X12 & UN/EDIFACT)
export const EDI_DICTIONARY: Record<
  string,
  { name: string; description: string; elementLabels?: string[] }
> = {
  // ANSI X12 Envelope Segments
  ISA: {
    name: "Interchange Control Header",
    description: "Defines sender, receiver, interchange control date/time, and delimiters.",
    elementLabels: [
      "Auth Info Qualifier",
      "Auth Information",
      "Security Info Qualifier",
      "Security Information",
      "Sender ID Qualifier",
      "Sender ID",
      "Receiver ID Qualifier",
      "Receiver ID",
      "Interchange Date",
      "Interchange Time",
      "Repetition Separator",
      "Control Version Number",
      "Control Number",
      "Ack Requested",
      "Usage Indicator (T/P)",
      "Component Separator",
    ],
  },
  GS: {
    name: "Functional Group Header",
    description: "Identifies the functional group of transactions (e.g., PO, IN, SH).",
    elementLabels: [
      "Functional ID Code",
      "App Sender Code",
      "App Receiver Code",
      "Date",
      "Time",
      "Group Control Number",
      "Agency Code",
      "Version / Release ID",
    ],
  },
  ST: {
    name: "Transaction Set Header",
    description: "Marks the start of a business transaction set (e.g. 850, 810, 856).",
    elementLabels: ["Transaction Set Identifier Code", "Transaction Set Control Number"],
  },
  SE: {
    name: "Transaction Set Trailer",
    description: "Marks the end of a transaction set with segment count verification.",
    elementLabels: ["Number of Included Segments", "Transaction Set Control Number"],
  },
  GE: {
    name: "Functional Group Trailer",
    description: "Marks the end of a functional group with transaction count.",
    elementLabels: ["Number of Transaction Sets Included", "Group Control Number"],
  },
  IEA: {
    name: "Interchange Control Trailer",
    description: "Marks the end of an interchange envelope.",
    elementLabels: ["Number of Included Groups", "Interchange Control Number"],
  },

  // ANSI X12 Business Segments
  BIG: {
    name: "Beginning Segment for Invoice",
    description: "Details the invoice date, invoice number, PO date, and PO number.",
    elementLabels: [
      "Invoice Date",
      "Invoice Number",
      "PO Date",
      "PO Number",
      "Release Number",
      "Change Order Sequence",
      "Transaction Type Code",
    ],
  },
  BEG: {
    name: "Beginning Segment for Purchase Order",
    description: "Details PO purpose, type code, PO number, and PO date.",
    elementLabels: [
      "Transaction Set Purpose Code",
      "Purchase Order Type Code",
      "Purchase Order Number",
      "Release Number",
      "Purchase Order Date",
      "Contract Number",
    ],
  },
  CUR: {
    name: "Currency",
    description: "Specifies currency codes (e.g. USD, EUR, GBP) and exchange rates.",
    elementLabels: ["Entity ID Code", "Currency Code", "Exchange Rate"],
  },
  REF: {
    name: "Reference Identification",
    description: "Specifies qualifying reference numbers (e.g., Tracking, Tax ID, Account).",
    elementLabels: ["Reference ID Qualifier", "Reference Identification", "Description"],
  },
  PER: {
    name: "Administrative Communications Contact",
    description: "Identifies contact persons, phone numbers, and email addresses.",
    elementLabels: [
      "Contact Function Code",
      "Contact Name",
      "Communication Number Qualifier",
      "Communication Number",
    ],
  },
  FOB: {
    name: "F.O.B. Related Instructions",
    description: "Freight On Board shipment instructions and freight payment terms.",
    elementLabels: ["Shipment Method of Payment", "Location Qualifier", "Description"],
  },
  ITD: {
    name: "Terms of Sale / Deferred Terms",
    description: "Specifies discount percent, net due days, and payment terms.",
    elementLabels: [
      "Terms Type Code",
      "Terms Basis Date Code",
      "Terms Discount Percent",
      "Terms Discount Due Date",
      "Terms Discount Days Due",
      "Terms Net Due Date",
      "Terms Net Days",
    ],
  },
  DTM: {
    name: "Date / Time Reference",
    description: "Specifies significant dates (e.g. delivery date, ship date, requested date).",
    elementLabels: ["Date/Time Qualifier", "Date", "Time", "Time Code"],
  },
  N1: {
    name: "Party Identification (Name)",
    description: "Identifies a party by name and ID (e.g. Buyer, Seller, Ship To).",
    elementLabels: [
      "Entity Identifier Code",
      "Name",
      "ID Code Qualifier",
      "Identification Code",
    ],
  },
  N2: {
    name: "Additional Name Information",
    description: "Additional names or department info for the identified party.",
    elementLabels: ["Name", "Name 2"],
  },
  N3: {
    name: "Party Location (Address Information)",
    description: "Street address lines for the identified party.",
    elementLabels: ["Address Information 1", "Address Information 2"],
  },
  N4: {
    name: "Geographic Location",
    description: "City, State/Province, Postal Code, and Country of the party.",
    elementLabels: [
      "City Name",
      "State or Province Code",
      "Postal Code",
      "Country Code",
    ],
  },
  PO1: {
    name: "Baseline Item Data (Purchase Order)",
    description: "Line item quantities, unit of measure, unit price, and product IDs.",
    elementLabels: [
      "Assigned Identification",
      "Quantity Ordered",
      "Unit or Basis for Measurement",
      "Unit Price",
      "Basis of Unit Price Code",
      "Product/Service ID Qualifier 1",
      "Product/Service ID 1",
      "Product/Service ID Qualifier 2",
      "Product/Service ID 2",
    ],
  },
  IT1: {
    name: "Baseline Item Data (Invoice)",
    description: "Line item billing information, invoice quantities, and pricing.",
    elementLabels: [
      "Assigned Identification",
      "Quantity Invoiced",
      "Unit or Basis for Measurement",
      "Unit Price",
      "Basis of Unit Price Code",
      "Product/Service ID Qualifier",
      "Product/Service ID",
    ],
  },
  PID: {
    name: "Product/Item Description",
    description: "Describes the physical product or catalog description.",
    elementLabels: ["Item Description Type", "Product/Process Characteristic Code", "Agency Qualifier Code", "Product Description Code", "Description"],
  },
  TDS: {
    name: "Total Monetary Value Summary",
    description: "Specifies the total invoice amount due.",
    elementLabels: ["Amount (Total Invoice Amount in Cents/Units)"],
  },
  CAD: {
    name: "Carrier Detail",
    description: "Specifies transportation routing, carrier SCAC, and equipment.",
    elementLabels: ["Transportation Method/Type Code", "Equipment Initial", "Equipment Number", "Standard Carrier Alpha Code (SCAC)"],
  },
  CTT: {
    name: "Transaction Totals",
    description: "Summary hash total indicating line item count and weight totals.",
    elementLabels: ["Number of Line Items", "Hash Total", "Weight", "Unit of Measure"],
  },
  HL: {
    name: "Hierarchical Level",
    description: "Identifies dependencies among and the content of hierarchical groups in an ASN (856).",
    elementLabels: ["Hierarchical ID Number", "Hierarchical Parent ID", "Hierarchical Level Code", "Hierarchical Child Code"],
  },

  // UN/EDIFACT Segments
  UNA: {
    name: "Service String Advice",
    description: "Defines the delimiter characters used throughout the EDIFACT interchange.",
    elementLabels: ["Service String Advice Characters"],
  },
  UNB: {
    name: "Interchange Header",
    description: "Identifies sender, recipient, date, time, and interchange control reference.",
    elementLabels: [
      "Syntax Identifier",
      "Interchange Sender",
      "Interchange Recipient",
      "Date/Time of Preparation",
      "Interchange Control Reference",
      "Recipient Reference/Password",
      "Application Reference",
    ],
  },
  UNH: {
    name: "Message Header",
    description: "Marks the beginning of an EDIFACT message (e.g. ORDERS, INVOIC, DESADV).",
    elementLabels: ["Message Reference Number", "Message Identifier", "Common Access Reference"],
  },
  BGM: {
    name: "Beginning of Message",
    description: "Indicates the message type (e.g. 220 = Order, 380 = Commercial Invoice).",
    elementLabels: ["Document/Message Name", "Document Identifier (Number)", "Message Function Code"],
  },
  NAD: {
    name: "Name and Address",
    description: "Identifies party function (e.g. BY = Buyer, SU = Supplier) and location details.",
    elementLabels: ["Party Function Code Qualifier", "Party Identification Details", "Name and Address", "Party Name", "Street", "City", "Postal Code", "Country"],
  },
  LIN: {
    name: "Line Item",
    description: "Identifies a line item number and product identification code.",
    elementLabels: ["Line Item Number", "Action Code", "Item Number Identification"],
  },
  QTY: {
    name: "Quantity",
    description: "Specifies ordered, invoiced, or dispatched quantities.",
    elementLabels: ["Quantity Details (Qualifier, Quantity, Unit)"],
  },
  MOA: {
    name: "Monetary Amount",
    description: "Specifies monetary values, line item amounts, and totals.",
    elementLabels: ["Monetary Amount Details (Type, Amount, Currency)"],
  },
  PRI: {
    name: "Price Details",
    description: "Specifies unit prices, calculation bases, and price types.",
    elementLabels: ["Price Information"],
  },
  TAX: {
    name: "Duty / Tax / Fee Details",
    description: "Specifies tax rates, VAT details, and tax exemptions.",
    elementLabels: ["Duty/Tax/Fee Function", "Duty/Tax/Fee Type", "Duty/Tax/Fee Account", "Duty/Tax/Fee Assessment", "Duty/Tax/Fee Rate"],
  },
  UNS: {
    name: "Section Control",
    description: "Separates the detail section from the summary section (e.g. 'S').",
    elementLabels: ["Section Identification ('D' = Detail, 'S' = Summary)"],
  },
  CNT: {
    name: "Control Total",
    description: "Summary total checking line item count or item volume.",
    elementLabels: ["Control Qualifier and Value"],
  },
  UNT: {
    name: "Message Trailer",
    description: "Marks the end of an EDIFACT message with segment count verification.",
    elementLabels: ["Number of Segments in Message", "Message Reference Number"],
  },
  UNZ: {
    name: "Interchange Trailer",
    description: "Marks the end of the EDIFACT interchange.",
    elementLabels: ["Interchange Control Count", "Interchange Control Reference"],
  },
};

export const TRANSACTION_SET_DICTIONARY: Record<string, string> = {
  // ANSI X12
  "850": "Purchase Order",
  "810": "Invoice",
  "856": "Ship Notice / Manifest (ASN)",
  "837": "Healthcare Claim",
  "835": "Healthcare Claim Payment / Advice",
  "820": "Payment Order / Remittance Advice",
  "846": "Inventory Inquiry / Advice",
  "855": "Purchase Order Acknowledgment",
  "997": "Functional Acknowledgment",
  "204": "Motor Carrier Load Tender",
  "214": "Transportation Carrier Shipment Status",

  // UN/EDIFACT
  ORDERS: "Purchase Order",
  ORDCHG: "Purchase Order Change Request",
  ORDRSP: "Purchase Order Response",
  INVOIC: "Commercial Invoice",
  DESADV: "Despatch Advice",
  RECADV: "Receiving Advice",
  PRICAT: "Price / Sales Catalogue",
  CONTRL: "Syntax and Service Report Message",
};

export function detectEdiStandard(text: string): {
  standard: "X12" | "EDIFACT" | "UNKNOWN";
  delimiters: EdiDelimiters;
} {
  const trimmed = text.trim();

  // Check for ANSI X12 (starts with ISA)
  if (trimmed.startsWith("ISA")) {
    const element = trimmed.charAt(3) || "*";
    let count = 0;
    let pos = 0;
    while (pos < trimmed.length && count < 16) {
      if (trimmed.charAt(pos) === element) {
        count++;
      }
      pos++;
    }
    if (count === 16 && pos < trimmed.length) {
      const component = trimmed.charAt(pos);
      const segment = trimmed.charAt(pos + 1);
      return {
        standard: "X12",
        delimiters: {
          element,
          component: component || ":",
          segment: segment === "\r" || segment === "\n" ? "~" : segment || "~",
        },
      };
    }
    return {
      standard: "X12",
      delimiters: {
        element: "*",
        component: ":",
        segment: "~",
      },
    };
  }

  // Check for UN/EDIFACT with UNA Service String Advice
  if (trimmed.startsWith("UNA") && trimmed.length >= 9) {
    return {
      standard: "EDIFACT",
      delimiters: {
        component: trimmed.charAt(3) || ":",
        element: trimmed.charAt(4) || "+",
        release: trimmed.charAt(6) || "?",
        segment: trimmed.charAt(8) || "'",
      },
    };
  }

  // Check for UN/EDIFACT without UNA (starts with UNB)
  if (trimmed.startsWith("UNB")) {
    return {
      standard: "EDIFACT",
      delimiters: {
        element: "+",
        component: ":",
        release: "?",
        segment: "'",
      },
    };
  }

  // Fallback heuristic: check if '+' and "'" are prevalent vs '*' and '~'
  const plusCount = (trimmed.match(/\+/g) || []).length;
  const starCount = (trimmed.match(/\*/g) || []).length;

  if (plusCount > starCount) {
    return {
      standard: "EDIFACT",
      delimiters: {
        element: "+",
        component: ":",
        release: "?",
        segment: "'",
      },
    };
  }

  return {
    standard: "X12",
    delimiters: {
      element: "*",
      component: ":",
      segment: "~",
    },
  };
}

export function parseEdiDocument(
  text: string,
  customDelimiters?: Partial<EdiDelimiters>
): ParsedEdiDocument {
  const { standard, delimiters: detectedDelims } = detectEdiStandard(text);
  const delimiters: EdiDelimiters = {
    ...detectedDelims,
    ...customDelimiters,
  };

  const errors: string[] = [];
  const segments: EdiSegment[] = [];

  let interchangeSender: string | undefined;
  let interchangeReceiver: string | undefined;
  let controlNumber: string | undefined;
  let transactionSet: { id: string; name: string } | undefined;
  let date: string | undefined;

  // Split text by segment terminator
  const segTerm = delimiters.segment;
  const rawSegments = text
    .split(segTerm)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let currentLevel = 0;

  for (let i = 0; i < rawSegments.length; i++) {
    const rawSeg = rawSegments[i];
    // Split by element separator
    const rawElements = rawSeg.split(delimiters.element);
    const tag = rawElements[0].trim().toUpperCase();

    // Adjust nesting level
    if (["ISA", "UNA", "UNB"].includes(tag)) {
      currentLevel = 0;
    } else if (["GS"].includes(tag)) {
      currentLevel = 1;
    } else if (["ST", "UNH"].includes(tag)) {
      currentLevel = 2;
    } else if (["SE", "UNT"].includes(tag)) {
      currentLevel = 2;
    } else if (["GE"].includes(tag)) {
      currentLevel = 1;
    } else if (["IEA", "UNZ"].includes(tag)) {
      currentLevel = 0;
    } else {
      currentLevel = 3;
    }

    const dict = EDI_DICTIONARY[tag] || {
      name: `Segment ${tag}`,
      description: "Standard EDI data segment",
    };

    const isEnvelope = ["ISA", "GS", "ST", "SE", "GE", "IEA", "UNA", "UNB", "UNH", "UNT", "UNZ"].includes(tag);

    const elements: EdiElement[] = [];
    for (let eIdx = 1; eIdx < rawElements.length; eIdx++) {
      const val = rawElements[eIdx];
      const posTag = `${tag}${String(eIdx).padStart(2, "0")}`;
      const label = dict.elementLabels && dict.elementLabels[eIdx - 1];

      // Split components if component separator exists in element
      const components =
        delimiters.component && val.includes(delimiters.component)
          ? val.split(delimiters.component)
          : undefined;

      elements.push({
        position: eIdx,
        tag: posTag,
        value: val,
        components,
        label,
      });
    }

    // Capture metadata from envelope segments
    if (tag === "ISA") {
      interchangeSender = elements[5]?.value?.trim();
      interchangeReceiver = elements[7]?.value?.trim();
      date = `20${elements[8]?.value || ""} ${elements[9]?.value || ""}`.trim();
      controlNumber = elements[12]?.value?.trim();
    } else if (tag === "UNB") {
      interchangeSender = elements[1]?.value?.trim();
      interchangeReceiver = elements[2]?.value?.trim();
      controlNumber = elements[4]?.value?.trim();
    } else if (tag === "ST") {
      const txId = elements[0]?.value?.trim();
      if (txId) {
        transactionSet = {
          id: txId,
          name: TRANSACTION_SET_DICTIONARY[txId] || `Transaction Set ${txId}`,
        };
      }
    } else if (tag === "UNH") {
      const msgIdElement = elements[1]?.value?.trim();
      const msgType = msgIdElement?.split(":")[0] || msgIdElement;
      if (msgType) {
        transactionSet = {
          id: msgType,
          name: TRANSACTION_SET_DICTIONARY[msgType] || `Message Type ${msgType}`,
        };
      }
    }

    segments.push({
      index: i + 1,
      tag,
      name: dict.name,
      description: dict.description,
      raw: rawSeg,
      elements,
      isEnvelope,
      level: currentLevel,
    });
  }

  return {
    standard,
    delimiters,
    transactionSet,
    interchangeSender,
    interchangeReceiver,
    controlNumber,
    date,
    segments,
    totalSegments: segments.length,
    errors,
  };
}

export function ediToJSON(doc: ParsedEdiDocument): string {
  const formatted = {
    metadata: {
      standard: doc.standard,
      transactionSet: doc.transactionSet,
      sender: doc.interchangeSender,
      receiver: doc.interchangeReceiver,
      controlNumber: doc.controlNumber,
      date: doc.date,
      totalSegments: doc.totalSegments,
      delimiters: doc.delimiters,
    },
    segments: doc.segments.map((seg) => ({
      index: seg.index,
      tag: seg.tag,
      name: seg.name,
      elements: seg.elements.reduce(
        (acc, el) => {
          acc[el.tag] = {
            value: el.value,
            label: el.label,
            components: el.components,
          };
          return acc;
        },
        {} as Record<string, unknown>
      ),
    })),
  };

  return JSON.stringify(formatted, null, 2);
}

export function ediToXML(doc: ParsedEdiDocument): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<interchange standard="${doc.standard}" totalSegments="${doc.totalSegments}">\n`;
  xml += `  <metadata>\n`;
  if (doc.transactionSet) {
    xml += `    <transactionSet id="${doc.transactionSet.id}">${doc.transactionSet.name}</transactionSet>\n`;
  }
  if (doc.interchangeSender) {
    xml += `    <sender>${doc.interchangeSender}</sender>\n`;
  }
  if (doc.interchangeReceiver) {
    xml += `    <receiver>${doc.interchangeReceiver}</receiver>\n`;
  }
  if (doc.controlNumber) {
    xml += `    <controlNumber>${doc.controlNumber}</controlNumber>\n`;
  }
  xml += `  </metadata>\n`;
  xml += `  <segments>\n`;

  for (const seg of doc.segments) {
    xml += `    <segment tag="${seg.tag}" name="${seg.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}">\n`;
    for (const el of seg.elements) {
      const cleanVal = el.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const labelAttr = el.label ? ` label="${el.label.replace(/"/g, "&quot;")}"` : "";
      xml += `      <element position="${el.position}" tag="${el.tag}"${labelAttr}>${cleanVal}</element>\n`;
    }
    xml += `    </segment>\n`;
  }

  xml += `  </segments>\n`;
  xml += `</interchange>`;
  return xml;
}

export function formatEDI(doc: ParsedEdiDocument): string {
  return doc.segments
    .map((seg) => {
      const indent = "  ".repeat(Math.max(0, seg.level));
      return `${indent}${seg.raw}${doc.delimiters.segment}`;
    })
    .join("\n");
}

export const SAMPLE_EDI_DOCUMENTS = {
  x12_850: {
    name: "ANSI X12 850 — Purchase Order",
    standard: "ANSI X12",
    description: "Standard retail purchase order with Buyer, Ship-To, line items, quantities, and pricing.",
    raw: `ISA*00*          *00*          *ZZ*ACME-BUYER    *ZZ*GLOBAL-SUPPLY *260910*1430*U*00401*000000123*0*P*:~
GS*PO*ACME-BUYER*GLOBAL-SUPPLY*20260910*1430*123*X*004010~
ST*850*0001~
BEG*00*SA*PO-987654**20260910~
CUR*BY*USD~
REF*DP*042~
PER*BD*Alex Rivera*TE*8005550199*EM*orders@acme.com~
FOB*PP~
ITD*01*3*2**10**30~
DTM*002*20260925~
N1*BY*Acme Megastore*9*1234567890123~
N3*100 Technology Parkway~
N4*San Jose*CA*95110*US~
N1*ST*Acme Distribution Center #4*9*9876543210987~
N3*450 Logistics Way~
N4*Dallas*TX*75201*US~
PO1*1*150*EA*19.95*PE*CB*4920192*VN*WIDGET-PRO-BLK~
PID*F****Industrial Wireless Sensor Module~
PO1*2*50*EA*89.50*PE*CB*7839201*VN*GATEWAY-ETH-V2~
PID*F****Multi-Port IoT Gateway Controller~
CTT*2*200~
SE*20*0001~
GE*1*123~
IEA*1*000000123~`,
  },

  x12_810: {
    name: "ANSI X12 810 — Commercial Invoice",
    standard: "ANSI X12",
    description: "Standard supplier invoice referencing purchase order, tax breakdown, terms, and total due.",
    raw: `ISA*00*          *00*          *ZZ*SUPPLIER-INC  *ZZ*ACME-CORP     *260910*0915*U*00401*000009876*0*P*:~
GS*IN*SUPPLIER-INC*ACME-CORP*20260910*0915*9876*X*004010~
ST*810*0001~
BIG*20260910*INV-55421*20260901*PO-987654~
CUR*SE*USD~
REF*VR*VENDOR-TAX-8849~
N1*RE*Supplier Remittance Dept*9*884920192~
N3*PO Box 89201~
N4*Chicago*IL*60601*US~
N1*BT*Acme Accounts Payable*9*123456789~
N3*100 Technology Parkway*Suite 400~
N4*San Jose*CA*95110*US~
ITD*01*3*2**10**30~
DTM*011*20260910~
IT1*1*150*EA*19.95**CB*4920192*VN*WIDGET-PRO-BLK~
PID*F****Industrial Wireless Sensor Module~
IT1*2*50*EA*89.50**CB*7839201*VN*GATEWAY-ETH-V2~
PID*F****Multi-Port IoT Gateway Controller~
TDS*746750~
CAD*M***FEDX~
CTT*2~
SE*18*0001~
GE*1*9876~
IEA*1*000009876~`,
  },

  edifact_orders: {
    name: "UN/EDIFACT — Purchase Order (ORDERS)",
    standard: "UN/EDIFACT",
    description: "International UN/EDIFACT purchase order with UNA service string, lines, and tax summary.",
    raw: `UNA:+.? '
UNB+UNOC:3+GLOBAL-BUYER:14+EURO-SUPPLY:14+260910:1145+9948271'
UNH+1+ORDERS:D:96A:UN'
BGM+220+ORD-2026-8812+9'
DTM+137:20260910:102'
DTM+2:20260928:102'
NAD+BY+BUYER-9921::9++Acme Europe BV+Keizersgracht 421+Amsterdam++1016 EK+NL'
NAD+SU+SUPPLY-3312::9++Euro Distribution Logistics+Industriestrasse 12+Frankfurt++60311+DE'
LIN+1++SENSOR-NODE-400:VN'
QTY+21:250:PCE'
MOA+203:7475.00:EUR'
PRI+AAA:29.90:CT:NTP'
LIN+2++FIBER-TRANS-10G:VN'
QTY+21:100:PCE'
MOA+203:8500.00:EUR'
PRI+AAA:85.00:CT:NTP'
UNS+S'
CNT+2:2'
MOA+79:15975.00:EUR'
UNT+18+1'
UNZ+1+9948271'`,
  },
};
