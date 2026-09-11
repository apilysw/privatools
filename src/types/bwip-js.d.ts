declare module "bwip-js" {
  export interface ToSVGOptions {
    bcid: string;
    text: string;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textfont?: string;
    textsize?: number;
    textgaps?: number;
    alttext?: string;
    textxalign?: "offleft" | "left" | "center" | "right" | "offright" | "justify";
    textyalign?: "below" | "center" | "above";
    textxoffset?: number;
    textyoffset?: number;
    showborder?: boolean;
    borderwidth?: number;
    borderleft?: number;
    borderright?: number;
    bordertop?: number;
    borderbottom?: number;
    barcolor?: string;
    backgroundcolor?: string;
    bordercolor?: string;
    textcolor?: string;
    rotate?: "N" | "R" | "L" | "I";
    paddingwidth?: number;
    paddingheight?: number;
    paddingleft?: number;
    paddingright?: number;
    paddingtop?: number;
    paddingbottom?: number;
    monochrome?: boolean;
    eclevel?: "L" | "M" | "Q" | "H" | string;
    parse?: boolean;
    parsefnc?: boolean;
    guardwhitespace?: boolean;
  }

  export function toSVG(opts: ToSVGOptions): string;
  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    opts: ToSVGOptions
  ): HTMLCanvasElement;
}
