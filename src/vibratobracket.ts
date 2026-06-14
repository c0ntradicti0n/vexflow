// Copyright (c) 2023-present VexFlow contributors: https://github.com/vexflow/vexflow/graphs/contributors
// @author Balazs Forian-Szabo
// MIT License

import { Element } from './element';
import { Modifier } from './modifier';
import { Note } from './note';
import { Category } from './typeguard';
import { log } from './util';
import { Vibrato } from './vibrato';

// eslint-disable-next-line
function L(...args: any[]) {
  if (VibratoBracket.DEBUG) log('VexFlow.VibratoBracket', args);
}

/** `VibratoBracket` renders vibrato effect between two notes. */
export class VibratoBracket extends Element {
  /** To enable logging for this class. Set `VexFlow.VibratoBracket.DEBUG` to `true`. */
  static DEBUG: boolean = false;

  static override get CATEGORY(): string {
    return Category.VibratoBracket;
  }

  protected line: number;
  protected vibrato = new Vibrato();

  protected start?: Note;
  protected stop?: Note;
  protected toEndOfStopStave?: boolean;

  /**
   * Either the stop or start note must be set, or both of them.
   * An undefined value for the start or stop note indicates that the vibrato
   * is drawn from the beginning or until the end of the stave accordingly.
   */
  constructor(bracketData: { stop?: Note | null; start?: Note | null; toEndOfStopStave?: boolean }) {
    super();

    if (bracketData.start) this.start = bracketData.start;
    if (bracketData.stop) this.stop = bracketData.stop;
    this.toEndOfStopStave = bracketData.toEndOfStopStave;

    this.line = 1;
  }

  /** Set line position of the vibrato bracket. */
  setLine(line: number): this {
    this.line = line;
    return this;
  }

  /** Set vibrato code. */
  setVibratoCode(code: number): this {
    this.vibrato.setVibratoCode(code);
    return this;
  }

  /** Draw the vibrato bracket on the rendering context. */
  override draw(): void {
    const ctx = this.checkContext();
    this.setRendered();

    // Check for trill modifier on stop note to allow space
    let trillOffset = 0;
    if (this.stop) {
      const modifiers = this.stop.getModifiers();
      for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (modifier.getCategory() === Category.Ornament && (modifier as Modifier & { type: string }).type === 'tr') {
          trillOffset = modifier.getWidth();
        }
      }
    }

    const y: number =
      (this.start && this.start.checkStave().getYForTopText(this.line)) ||
      (this.stop && this.stop.checkStave().getYForTopText(this.line)) ||
      0;
    // If start note is not set then vibrato will be drawn
    // from the beginning of the stave
    const startX: number =
      (this.start && this.start.getAbsoluteX()) || (this.stop && this.stop.checkStave().getTieStartX()) || 0;
    // If stop note is not set then vibrato will be drawn
    // until the end of the stave
    const stopX: number =
      (this.stop &&
        (this.toEndOfStopStave
          ? this.stop.getAbsoluteX() + this.stop.getWidth()
          : this.stop.getAbsoluteX() - this.stop.getWidth() - 5)) ||
      (this.start && this.start.checkStave().getTieEndX() - 10) ||
      0;

    this.vibrato.setVibratoWidth(stopX - startX + trillOffset);

    L('Rendering VibratoBracket: startX:', startX, 'stopX:', stopX, 'y:', y);
    this.vibrato.renderText(ctx, startX, y);
  }
}
