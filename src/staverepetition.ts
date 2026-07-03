// Copyright (c) 2023-present VexFlow contributors: https://github.com/vexflow/vexflow/graphs/contributors
// @author: Larry Kuhns 2011

import { Glyphs } from './glyphs';
import { Metrics } from './metrics';
import { Stave } from './stave';
import { StaveModifier } from './stavemodifier';
import { Category } from './typeguard';

export class Repetition extends StaveModifier {
  static override get CATEGORY(): string {
    return Category.Repetition;
  }

  static readonly type = {
    NONE: 1, // no coda or segno
    CODA_LEFT: 2, // coda at beginning of stave
    CODA_RIGHT: 3, // coda at end of stave
    SEGNO_LEFT: 4, // segno at beginning of stave
    SEGNO_RIGHT: 5, // segno at end of stave
    DC: 6, // D.C. at end of stave
    DC_AL_CODA: 7, // D.C. al coda at end of stave
    DC_AL_FINE: 8, // D.C. al Fine end of stave
    DS: 9, // D.S. at end of stave
    DS_AL_CODA: 10, // D.S. al coda at end of stave
    DS_AL_FINE: 11, // D.S. al Fine at end of stave
    FINE: 12, // Fine at end of stave
    TO_CODA: 13, // To Coda at end of stave
  };

  protected symbolType: number;

  protected override xShift: number = 0;
  protected override yShift: number = 0;

  constructor(type: number, x: number, yShift: number) {
    super();

    this.symbolType = type;
    this.x = x;
    this.xShift = 0;
    this.yShift = yShift;
  }

  setShiftX(x: number): this {
    this.xShift = x;
    return this;
  }

  setShiftY(y: number): this {
    this.yShift = y;
    return this;
  }

  override draw(): void {
    const stave = this.checkStave();
    const x = stave.getModifierXShift(this.getPosition());
    this.setRendered();

    switch (this.symbolType) {
      case Repetition.type.CODA_RIGHT:
        this.drawCodaFixed(stave, x + stave.getWidth());
        break;
      case Repetition.type.CODA_LEFT:
        this.drawSymbolText(stave, x, 'Coda', true);
        break;
      case Repetition.type.SEGNO_LEFT:
        this.drawSegnoFixed(stave, x);
        break;
      case Repetition.type.SEGNO_RIGHT:
        this.drawSegnoFixed(stave, x + stave.getWidth());
        break;
      case Repetition.type.DC:
        this.drawSymbolText(stave, x, 'D.C.', false);
        break;
      case Repetition.type.DC_AL_CODA:
        this.drawSymbolText(stave, x, 'D.C. al', true);
        break;
      case Repetition.type.DC_AL_FINE:
        this.drawSymbolText(stave, x, 'D.C. al Fine', false);
        break;
      case Repetition.type.DS:
        this.drawSymbolText(stave, x, 'D.S.', false);
        break;
      case Repetition.type.DS_AL_CODA:
        this.drawSymbolText(stave, x, 'D.S. al', true);
        break;
      case Repetition.type.DS_AL_FINE:
        this.drawSymbolText(stave, x, 'D.S. al Fine', false);
        break;
      case Repetition.type.FINE:
        this.drawSymbolText(stave, x, 'Fine', false);
        break;
      case Repetition.type.TO_CODA:
        this.drawSymbolText(stave, x, 'To', true);
        break;
      default:
        break;
    }
  }

  drawCodaFixed(stave: Stave, x: number): this {
    const y = stave.getYForTopText(stave.getNumLines());
    this.text = Glyphs.coda;
    this.setFont(Metrics.getFontInfo('Repetition.coda'));
    this.renderText(stave.checkContext(), x, y + Metrics.get('Repetition.coda.offsetY'));
    return this;
  }

  drawSegnoFixed(stave: Stave, x: number): this {
    const y = stave.getYForTopText(stave.getNumLines());
    this.text = Glyphs.segno;
    this.setFont(Metrics.getFontInfo('Repetition.segno'));
    this.renderText(stave.checkContext(), x, y + Metrics.get('Repetition.segno.offsetY'));
    return this;
  }

  drawSymbolText(stave: Stave, x: number, text: string, drawCoda: boolean): this {
    const ctx = stave.checkContext();
    let textX = 0;

    this.text = text;
    this.setFont(Metrics.getFontInfo('Repetition.text'));
    const textWidth: number = this.width;

    // Measure coda glyph width at larger font so we can right-align the combined group
    let codaWidth: number = 0;
    if (drawCoda) {
      ctx.save();
      ctx.setFont(Metrics.getFontInfo('Repetition.coda'));
      codaWidth = ctx.measureText(Glyphs.coda).width;
      ctx.restore();
    }

    const totalWidth: number = textWidth + (drawCoda ? codaWidth + 4 : 0);
    const textOffsetX: number = Metrics.get('Repetition.text.offsetX');

    switch (this.symbolType) {
      // To the left
      case Repetition.type.CODA_LEFT:
        textX = stave.getVerticalBarWidth();
        break;
      // To the right: this.x set by stave.format() to end position.
      // renderText adds this.x + this.xShift, so textX is leftward offset.
      case Repetition.type.DC:
      case Repetition.type.DC_AL_FINE:
      case Repetition.type.DS:
      case Repetition.type.DS_AL_FINE:
      case Repetition.type.FINE:
        textX = -totalWidth - textOffsetX;
        break;
      case Repetition.type.DC_AL_CODA:
      case Repetition.type.DS_AL_CODA:
        textX = -totalWidth - textOffsetX;
        break;
      default:
        // TO_CODA and other right-side types
        textX = -totalWidth - textOffsetX;
        break;
    }

    const y = stave.getYForTopText(stave.getNumLines()) + Metrics.get('Repetition.text.offsetY');

    this.renderText(ctx, textX, y);

    if (drawCoda) {
      ctx.save();
      ctx.setFont(Metrics.getFontInfo('Repetition.coda'));
      const codaX: number = textX + this.x + this.xShift + textWidth + 4;
      const codaY: number = y + this.y + this.yShift;
      ctx.fillText(Glyphs.coda, codaX, codaY);
      ctx.restore();
    }

    return this;
  }
}
