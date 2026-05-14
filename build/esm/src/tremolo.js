import { Glyphs } from './glyphs';
import { Metrics } from './metrics';
import { Modifier } from './modifier';
import { Stem } from './stem';
export class Tremolo extends Modifier {
    static get CATEGORY() {
        return "Tremolo";
    }
    constructor(num) {
        super();
        this.num = num;
        this.position = Modifier.Position.CENTER;
        this.text = Glyphs.tremolo1;
        this.y_spacing_scale = 1;
        this.extra_stroke_scale = 1;
    }
    draw() {
        const ctx = this.checkContext();
        const note = this.checkAttachedNote();
        this.setRendered();
        const stemDirection = note.getStemDirection();
        let scale = note.getFontScale();
        if (this.extra_stroke_scale !== 1) {
            scale *= this.extra_stroke_scale;
        }
        const ySpacing = Metrics.get(`Tremolo.spacing`) * stemDirection * scale * this.y_spacing_scale;
        const x = note.getAbsoluteX() + (stemDirection === Stem.UP ? note.getGlyphWidth() - Stem.WIDTH / 2 : Stem.WIDTH / 2);
        let y = note.getStemExtents().topY + (this.num <= 3 ? ySpacing : 0);
        this.fontInfo.size = Metrics.get(`Tremolo.fontSize`) * scale;
        for (let i = 0; i < this.num; ++i) {
            this.renderText(ctx, x, y);
            y += ySpacing;
        }
    }
}
