import { RenderContext } from './rendercontext';
import { StaveModifier } from './stavemodifier';
export interface NoteEquationItem {
    duration: string;
    dots?: number;
    tupletNum?: number;
    notesOccupied?: number;
    /** Beam state for multi-note groups: "begin", "continue", "end". */
    beam?: string;
    /** This note starts a tuplet bracket group. */
    bracketStart?: boolean;
    /** This note ends a tuplet bracket group. */
    bracketEnd?: boolean;
}
export interface StaveTempoOptions {
    name?: string;
    parenthesis?: boolean;
    duration?: string;
    dots?: number;
    bpm?: number | string;
    duration2?: string;
    dots2?: number;
    noteEquation?: NoteEquationItem[];
}
export declare class StaveTempo extends StaveModifier {
    static get CATEGORY(): string;
    protected tempo: StaveTempoOptions;
    protected renderOptions: {
        glyphFontScale: number;
    };
    constructor(tempo: StaveTempoOptions, x: number, shiftY: number);
    protected durationToCode: Record<string, string>;
    setTempo(tempo: StaveTempoOptions): this;
    draw(): void;
    drawNoteEquation(ctx: RenderContext, x: number, y: number, noteEquation: NoteEquationItem[]): number;
    /**
     * Draw a group of notes with beams connecting flagged notes and optional tuplet bracket.
     * Ported from VF4's drawNoteGroup — renders note heads, stems, beams, and brackets
     * using direct canvas operations instead of pre-combined metronome glyphs.
     */
    drawNoteGroup(ctx: RenderContext, x: number, y: number, stemScale: number, baseSpacing: number, group: any): number;
}
