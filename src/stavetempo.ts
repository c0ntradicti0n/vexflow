// Copyright (c) 2023-present VexFlow contributors: https://github.com/vexflow/vexflow/graphs/contributors
// @author: Radosaw Eichler 2012

import { Glyphs } from './glyphs';
import { Note } from './note';
import { RenderContext } from './rendercontext';
import { StaveModifier, StaveModifierPosition } from './stavemodifier';
import { Category } from './typeguard';

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

export class StaveTempo extends StaveModifier {
  static get CATEGORY(): string {
    return Category.StaveTempo;
  }
  protected tempo: StaveTempoOptions;

  protected renderOptions: { glyphFontScale: number } = {
    glyphFontScale: 30,
  };

  constructor(tempo: StaveTempoOptions, x: number, shiftY: number) {
    super();

    this.tempo = tempo;
    this.position = StaveModifierPosition.ABOVE;
    this.x = x;
    this.setXShift(10);
    this.setYShift(shiftY);
  }

  protected durationToCode: Record<string, string> = {
    '1/4': Glyphs.metNoteDoubleWholeSquare,
    long: Glyphs.metNoteDoubleWholeSquare,
    '1/2': Glyphs.metNoteDoubleWhole,
    breve: Glyphs.metNoteDoubleWhole,
    1: Glyphs.metNoteWhole,
    whole: Glyphs.metNoteWhole,
    w: Glyphs.metNoteWhole,
    2: Glyphs.metNoteHalfUp,
    half: Glyphs.metNoteHalfUp,
    h: Glyphs.metNoteHalfUp,
    4: Glyphs.metNoteQuarterUp,
    quarter: Glyphs.metNoteQuarterUp,
    q: Glyphs.metNoteQuarterUp,
    8: Glyphs.metNote8thUp,
    eighth: Glyphs.metNote8thUp,
    16: Glyphs.metNote16thUp,
    '16th': Glyphs.metNote16thUp,
    32: Glyphs.metNote32ndUp,
    '32nd': Glyphs.metNote32ndUp,
    64: Glyphs.metNote64thUp,
    '64th': Glyphs.metNote64thUp,
    128: Glyphs.metNote128thUp,
    '128th': Glyphs.metNote128thUp,
    256: Glyphs.metNote256thUp,
    '256th': Glyphs.metNote256thUp,
    512: Glyphs.metNote512thUp,
    '512th': Glyphs.metNote512thUp,
    1024: Glyphs.metNote1024thUp,
    '1024th': Glyphs.metNote1024thUp,
  };

  setTempo(tempo: StaveTempoOptions): this {
    this.tempo = tempo;
    return this;
  }

  draw(): void {
    const stave = this.checkStave();
    const shiftX = stave.getModifierXShift(this.getPosition());
    const ctx = stave.checkContext();
    this.setRendered();

    const { name, duration, dots, bpm, duration2, dots2, parenthesis, noteEquation } = this.tempo;
    const startX = this.x + shiftX;
    let x = startX;
    const y = stave.getYForTopText(1) + this.yShift;

    ctx.openGroup('stavetempo');

    if (name) {
      this.setFont(this._fontInfo);
      ctx.fillText(name, x, y);
      x += ctx.measureText(name).width;
    }

    if (noteEquation) {
      x = this.drawNoteEquation(ctx, x, y, noteEquation);
    } else if (duration && bpm) {
      this.setFont({ ...this._fontInfo, weight: 'normal' });

      if (name) {
        x += ctx.measureText(' ').width;
        ctx.fillText('(', x, y);
        x += ctx.measureText('(').width;
      }

      const scale = this.renderOptions.glyphFontScale / 38;
      const glyphCode = this.durationToCode[duration];

      x += 3 * scale;
      ctx.fillText(glyphCode, x, y);
      x += ctx.measureText(glyphCode).width;

      for (let i = 0; i < (dots || 0); i++) {
        x += 6 * scale;
        ctx.beginPath();
        ctx.arc(x, y + 2 * scale, 2 * scale, 0, Math.PI * 2, false);
        ctx.fill();
      }

      ctx.openGroup('bpm');
      this.setFont({ ...this._fontInfo, weight: 'normal' });
      ctx.fillText(' = ' + bpm + (name ? ')' : ''), x + 3 * scale, y);
      ctx.closeGroup();
    }

    this.width = x - startX;
    ctx.closeGroup();
  }

  drawNoteEquation(ctx: RenderContext, x: number, y: number, noteEquation: NoteEquationItem[]): number {
    const glyphPt = 22;
    const stemScale = glyphPt / 38;
    const baseSpacing = 4 * stemScale;

    // Flatten the array into VF4-style {left, right} groups by detecting
    // the boundary: notes after the first group that aren't beam-continued
    // or bracket-continued belong to the right group.
    let splitIndex = noteEquation.length;
    for (let i = 1; i < noteEquation.length; i++) {
      const prev = noteEquation[i - 1];
      const curr = noteEquation[i];
      const continuesBeam = curr.beam === 'end' || curr.beam === 'continue';
      const continuesBracket = prev.bracketStart || curr.bracketEnd;
      if (!continuesBeam && !continuesBracket) {
        splitIndex = i;
        break;
      }
    }

    const leftItems = noteEquation.slice(0, splitIndex);
    const rightItems = noteEquation.slice(splitIndex);

    // Build VF4-style group objects
    const buildGroup = (items: NoteEquationItem[]): any => {
      if (items.length === 0) return { notes: [] };
      const notes: any[] = items.map((item) => ({
        duration: item.duration,
        dots: item.dots || 0,
        beam: item.beam,
      }));
      const group: any = { notes };
      if (items[0].tupletNum) {
        group.tuplet = {
          actualNotes: items[0].tupletNum,
          normalNotes: items[0].notesOccupied,
          bracket: items[0].bracketStart === true,
          showNumber: 'actual',
        };
      }
      return group;
    };

    const leftGroup = buildGroup(leftItems);
    const rightGroup = buildGroup(rightItems);

    // Draw left group
    x = this.drawNoteGroup(ctx, x, y, stemScale, baseSpacing, leftGroup);

    // Draw equals sign
    this.setFont({ ...this._fontInfo, weight: 'bold' });
    x += 1.5 * baseSpacing;
    ctx.fillText('=', x, y);
    x += ctx.measureText('=').width + 1.5 * baseSpacing;

    // Draw right group
    x = this.drawNoteGroup(ctx, x, y, stemScale, baseSpacing, rightGroup);

    return x;
  }

  /**
   * Draw a group of notes with beams connecting flagged notes and optional tuplet bracket.
   * Ported from VF4's drawNoteGroup — renders note heads, stems, beams, and brackets
   * using direct canvas operations instead of pre-combined metronome glyphs.
   */
  drawNoteGroup(
    ctx: RenderContext,
    x: number,
    y: number,
    stemScale: number,
    baseSpacing: number,
    group: any
  ): number {
    const notes = group.notes;
    const tuplet = group.tuplet;

    this.setFont({ ...this._fontInfo, size: 22 });

    const notePositions: any[] = [];
    const beamSegments: any[][] = [];
    let currentBeamGroup: any[] = [];

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const glyphProps = Note.getGlyphProps(note.duration, 'n');
      const headGlyph = glyphProps.codeHead;
      if (!headGlyph) continue;

      x += 3 * stemScale;
      const noteX = x;

      // Draw note head
      ctx.fillText(headGlyph, x, y);
      x += ctx.measureText(headGlyph).width;

      let stemTopY = y;

      // Draw stem
      if (glyphProps.stem) {
        const stemHeight = 18 * stemScale;

        stemTopY = y - stemHeight;
        ctx.fillRect(x - stemScale, stemTopY, stemScale, stemHeight);

        // Only draw flag for non-beamed notes
        if (glyphProps.codeFlagUp && !note.beam) {
          const flagGlyph = glyphProps.codeFlagUp;
          if (flagGlyph) {
            ctx.fillText(flagGlyph, x, stemTopY);
          }
          if (!note.dots) x += 6 * stemScale;
        }
      }

      // Draw dots
      for (let d = 0; d < (note.dots || 0); d++) {
        x += 6 * stemScale;
        ctx.beginPath();
        ctx.arc(x, y + 2 * stemScale, 2 * stemScale, 0, Math.PI * 2, false);
        ctx.fill();
      }

      const pos = { x: noteX, y_top: stemTopY, stemX: x, code: glyphProps };
      notePositions.push(pos);

      // Track beam groups
      if (note.beam === 'begin') {
        currentBeamGroup = [pos];
      } else if (note.beam === 'continue') {
        currentBeamGroup.push(pos);
      } else if (note.beam === 'end') {
        currentBeamGroup.push(pos);
        beamSegments.push(currentBeamGroup);
        currentBeamGroup = [];
      }

      // Inter-note spacing
      if (i < notes.length - 1) {
        x += tuplet ? 2 * baseSpacing : baseSpacing;
      }
    }

    // Draw beams
    const beamThickness = 3 * stemScale;
    for (const segment of beamSegments) {
      if (segment.length < 2) continue;
      const firstStem = segment[0];
      const lastStem = segment[segment.length - 1];

      let maxBeamCount = 0;
      for (const pos of segment) {
        if (pos.code.beamCount) {
          maxBeamCount = Math.max(maxBeamCount, pos.code.beamCount);
        }
      }

      for (let b = 0; b < maxBeamCount; b++) {
        const beamY = firstStem.y_top + b * (beamThickness + 1 * stemScale);
        ctx.fillRect(
          firstStem.stemX - stemScale,
          beamY,
          lastStem.stemX - firstStem.stemX + stemScale,
          beamThickness
        );
      }
    }

    // Draw tuplet bracket and number
    if (tuplet && notePositions.length > 0) {
      const firstPos = notePositions[0];
      const lastPos = notePositions[notePositions.length - 1];

      let minY = firstPos.y_top;
      for (const pos of notePositions) {
        minY = Math.min(minY, pos.y_top);
      }

      const bracketOverhang = 1.25 * baseSpacing;
      const bracketY = minY - 1.5 * baseSpacing;
      const bracketStartX = firstPos.x - 0.5 * baseSpacing;
      const bracketEndX = lastPos.stemX + bracketOverhang;

      this.setFont({ ...this._fontInfo, size: (Number(this._fontInfo.size) - 3) || 11, weight: 'bold' });

      if (tuplet.bracket) {
        const hookHeight = baseSpacing;
        const numberText = tuplet.showNumber === 'both'
          ? `${tuplet.actualNotes}:${tuplet.normalNotes}`
          : `${tuplet.actualNotes}`;

        const midX = (bracketStartX + bracketEndX) / 2;
        const numberWidth = ctx.measureText(numberText).width;
        const gapHalf = numberWidth / 2 + 2 * stemScale;

        ctx.beginPath();
        // Left hook
        ctx.moveTo(bracketStartX, bracketY + hookHeight);
        ctx.lineTo(bracketStartX, bracketY);
        // Line to gap
        ctx.lineTo(midX - gapHalf, bracketY);
        ctx.stroke();

        ctx.beginPath();
        // Line from gap
        ctx.moveTo(midX + gapHalf, bracketY);
        ctx.lineTo(bracketEndX, bracketY);
        // Right hook
        ctx.lineTo(bracketEndX, bracketY + hookHeight);
        ctx.stroke();

        // Number
        ctx.fillText(numberText, midX - numberWidth / 2, bracketY - 1 * stemScale);
      } else {
        const numberText = `${tuplet.actualNotes}`;
        const midX = (bracketStartX + bracketEndX) / 2;
        const numberWidth = ctx.measureText(numberText).width;
        ctx.fillText(numberText, midX - numberWidth / 2, bracketY - 1 * stemScale);
      }
    }

    return x;
  }
}
