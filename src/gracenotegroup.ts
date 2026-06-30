// Copyright (c) 2023-present VexFlow contributors: https://github.com/vexflow/vexflow/graphs/contributors
//
// ## Description
//
// This file implements `GraceNoteGroup` which is used to format and
// render grace notes.

import { Beam } from './beam';
import { Formatter } from './formatter';
import { Modifier } from './modifier';
import { ModifierContextState } from './modifiercontext';
import { Note } from './note';
import { RenderContext } from './rendercontext';
import { StaveNote } from './stavenote';
import { StaveTie } from './stavetie';
import { StemmableNote } from './stemmablenote';
import { Tables } from './tables';
import { TabTie } from './tabtie';
import { Category, isStaveNote } from './typeguard';
import { log } from './util';
import { Voice } from './voice';

// To enable logging for this class. Set `GraceNoteGroup.DEBUG` to `true`.
// eslint-disable-next-line
function L(...args: any) {
  if (GraceNoteGroup.DEBUG) log('VexFlow.GraceNoteGroup', args);
}

/** GraceNoteGroup is used to format and render grace notes. */
export class GraceNoteGroup extends Modifier {
  static DEBUG: boolean = false;

  static override get CATEGORY(): string {
    return Category.GraceNoteGroup;
  }

  protected readonly voice: Voice;
  protected readonly graceNotes: StemmableNote[];
  protected readonly showSlur?: boolean;

  protected preFormatted: boolean = false;
  protected formatter?: Formatter;
  public renderOptions: { slurYShift: number };
  protected slur?: StaveTie | TabTie;
  protected beams: Beam[];

  /** Arranges groups inside a `ModifierContext`. */
  static format(gracenoteGroups: GraceNoteGroup[], state: ModifierContextState): boolean {
    const groupSpacingStave = 4;
    const groupSpacingTab = 0;

    if (!gracenoteGroups || gracenoteGroups.length === 0) return false;

    const groupList = [];
    let prevNote = null;
    let shift = 0;

    for (let i = 0; i < gracenoteGroups.length; ++i) {
      const gracenoteGroup = gracenoteGroups[i];
      const note = gracenoteGroup.getNote();
      const isStavenote = isStaveNote(note);
      const spacing = isStavenote ? groupSpacingStave : groupSpacingTab;

      if (isStavenote && note !== prevNote) {
        // Iterate through all notes to get the displaced pixels
        for (let n = 0; n < note.keys.length; ++n) {
          shift = Math.max(note.getLeftDisplacedHeadPx(), shift);
        }
        prevNote = note;
      }

      groupList.push({ shift: shift, gracenoteGroup, spacing });
    }

    // If first note left shift in case it is displaced
    let groupShift = groupList[0].shift;
    let formatWidth;
    let right = false;
    let left = false;
    for (let i = 0; i < groupList.length; ++i) {
      const gracenoteGroup = groupList[i].gracenoteGroup;
      if (gracenoteGroup.position === Modifier.Position.RIGHT) right = true;
      else left = true;
      gracenoteGroup.preFormat();
      formatWidth = gracenoteGroup.getWidth() + groupList[i].spacing;
      groupShift = Math.max(formatWidth, groupShift);
    }

    // OSMD-controlled grace-to-target gap. This is reserved by enlarging the
    // modifier shift below (pushing the target note right), NOT by shifting the
    // grace block toward the target, so it never crowds the target note.
    const extraSpacing: number = (groupList[0].gracenoteGroup as any).spacing ?? 0;
    for (let i = 0; i < groupList.length; ++i) {
      const gracenoteGroup = groupList[i].gracenoteGroup;
      formatWidth = gracenoteGroup.getWidth() + groupList[i].spacing;
      // The grace notes are positioned relative to the target note:
      //   graceX = tickContext.x - modLeftPx - modRightPx + spacingFromNextModifier
      // The grace block's left edge ends up at (noteStartX - padding + S), so S
      // (below) must stay a small positive value to keep the block from bleeding
      // left into stave-start modifiers (clef/key/time). extraSpacing is added to
      // the reserved shift instead, where it widens the gap to the target note.
      // Grace notes' own RIGHT-side modifiers (string numbers) inflate groupShift
      // and shift the grace block left toward stave-start modifiers. They sit in
      // the gap toward the target note, so shift the block back right by their
      // width to keep the leftmost grace (and its fingering) clear of clef/key/time.
      let rightModWidth: number = 0;
      for (const gn of gracenoteGroup.getGraceNotes()) {
        const mc = (gn as any).getModifierContext?.();
        if (mc) { rightModWidth = Math.max(rightModWidth, mc.getState().rightShift); }
      }
      gracenoteGroup.setSpacingFromNextModifier(
        groupShift - Math.min(formatWidth, groupShift) + StaveNote.minNoteheadPadding + 5 + rightModWidth
      );
    }

    if (right) state.rightShift += groupShift + extraSpacing;
    if (left) state.leftShift += groupShift + extraSpacing;
    return true;
  }

  //** `GraceNoteGroup` inherits from `Modifier` and is placed inside a `ModifierContext`. */
  constructor(graceNotes: StemmableNote[], showSlur?: boolean) {
    super();

    this.position = Modifier.Position.LEFT;
    this.graceNotes = graceNotes;
    this.width = 0;

    this.showSlur = showSlur;
    this.slur = undefined;

    this.voice = new Voice({
      numBeats: 4,
      beatValue: 4,
      resolution: Tables.RESOLUTION,
    }).setStrict(false);

    this.renderOptions = {
      slurYShift: 0,
    };

    this.beams = [];

    this.voice.addTickables(this.graceNotes);

    return this;
  }

  preFormat(): void {
    if (this.preFormatted) return;

    if (!this.formatter) {
      this.formatter = new Formatter();
    }
    this.formatter.joinVoices([this.voice]).format([this.voice], 0, {});
    this.setWidth(this.formatter.getMinTotalWidth());
    this.preFormatted = true;
  }

  beamNotes(graceNotes?: StemmableNote[]): this {
    graceNotes = graceNotes || this.graceNotes;
    if (graceNotes.length > 1) {
      const beam = new Beam(graceNotes);

      beam.renderOptions.beamWidth = 3;
      beam.renderOptions.partialBeamLength = 4;

      this.beams.push(beam);
    }

    return this;
  }

  override setWidth(width: number): this {
    this.width = width;
    return this;
  }

  override getWidth(): number {
    return this.width + StaveNote.minNoteheadPadding;
  }

  getGraceNotes(): Note[] {
    return this.graceNotes;
  }

  override draw(): void {
    const ctx: RenderContext = this.checkContext();
    const note = this.checkAttachedNote();
    this.setRendered();

    L('Drawing grace note group for:', note);

    this.alignSubNotesWithNote(this.getGraceNotes(), note, this.position); // Modifier function

    // Draw grace notes.
    this.graceNotes.forEach((graceNote) => graceNote.setContext(ctx).drawWithStyle());
    // Draw beams.
    this.beams.forEach((beam) => beam.setContext(ctx).drawWithStyle());

    if (this.showSlur) {
      // Create and draw slur.
      const isStavenote = isStaveNote(note);
      const TieClass = isStavenote ? StaveTie : TabTie;

      this.slur = new TieClass({
        lastNote: this.graceNotes[0],
        firstNote: note,
        firstIndexes: [0],
        lastIndexes: [0],
      });

      this.slur.renderOptions.cp2 = 12;
      this.slur.renderOptions.yShift = (isStavenote ? 7 : 5) + this.renderOptions.slurYShift;
      // The slur runs from the grace notes (left) to the target note. StaveTie
      // anchors firstX at the target's getTieRightX(), i.e. past its notehead by
      // glyph width plus its right modifiers (string numbers etc.). For a grace
      // slur the endpoint must sit at the target notehead, otherwise it drifts
      // right and the drift grows with the target's right modifiers. Pull firstX
      // back to the target's notehead.
      if (isStaveNote(note)) {
        this.slur.renderOptions.firstXShift = (note as StaveNote).getAbsoluteX() - (note as StaveNote).getTieRightX();
      }
      this.slur.setContext(ctx).drawWithStyle();
    }
  }
}
