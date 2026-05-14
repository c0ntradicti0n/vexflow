import { Modifier } from './modifier';
/** Tremolo implements tremolo notation. */
export declare class Tremolo extends Modifier {
    static get CATEGORY(): string;
    protected readonly num: number;
    protected y_spacing_scale: number;
    protected extra_stroke_scale: number;
    /**
     * @param num number of bars
     */
    constructor(num: number);
    /** Draw the tremolo on the rendering context. */
    draw(): void;
}
