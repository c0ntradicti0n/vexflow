import { Accidental } from './accidental';
import { Annotation } from './annotation';
import { Articulation } from './articulation';
import { Bend } from './bend';
import { ChordSymbol } from './chordsymbol';
import { Dot } from './dot';
import { FretHandFinger } from './frethandfinger';
import { GraceNoteGroup } from './gracenotegroup';
import { NoteSubGroup } from './notesubgroup';
import { Ornament } from './ornament';
import { Parenthesis } from './parenthesis';
import { StaveNote } from './stavenote';
import { StringNumber } from './stringnumber';
import { Stroke } from './strokes';
import { log, RuntimeError } from './util';
import { Vibrato } from './vibrato';
function L(...args) {
    if (ModifierContext.DEBUG)
        log('VexFlow.ModifierContext', args);
}
export class ModifierContext {
    constructor() {
        this.state = {
            leftShift: 0,
            rightShift: 0,
            textLine: 0,
            topTextLine: 0,
        };
        this.members = {};
        this.preFormatted = false;
        this.postFormatted = false;
        this.formatted = false;
        this.width = 0;
        this.spacing = 0;
    }
    addModifier(member) {
        L('addModifier is deprecated, use addMember instead.');
        return this.addMember(member);
    }
    addMember(member) {
        const category = member.getCategory();
        if (!this.members[category]) {
            this.members[category] = [];
        }
        this.members[category].push(member);
        member.setModifierContext(this);
        this.preFormatted = false;
        return this;
    }
    getModifiers(category) {
        L('getModifiers is deprecated, use getMembers instead.');
        return this.getMembers(category);
    }
    getMembers(category) {
        var _a;
        return (_a = this.members[category]) !== null && _a !== void 0 ? _a : [];
    }
    getWidth() {
        return this.width;
    }
    getLeftShift() {
        return this.state.leftShift;
    }
    getRightShift() {
        return this.state.rightShift;
    }
    getState() {
        return this.state;
    }
    getMetrics() {
        if (!this.formatted) {
            throw new RuntimeError('UnformattedMember', 'Unformatted member has no metrics.');
        }
        return {
            width: this.state.leftShift + this.state.rightShift + this.spacing,
            spacing: this.spacing,
        };
    }
    preFormat() {
        if (this.preFormatted)
            return;
        L('Preformatting ModifierContext');
        const state = this.state;
        const members = this.members;
        StaveNote.format(members["StaveNote"], state);
        Parenthesis.format(members["Parenthesis"], state);
        Dot.format(members["Dot"], state);
        FretHandFinger.format(members["FretHandFinger"], state);
        Accidental.format(members["Accidental"], state);
        Stroke.format(members["Stroke"], state);
        GraceNoteGroup.format(members["GraceNoteGroup"], state);
        NoteSubGroup.format(members["NoteSubGroup"], state);
        StringNumber.format(members["StringNumber"], state);
        Articulation.format(members["Articulation"], state);
        Ornament.format(members["Ornament"], state);
        Annotation.format(members["Annotation"], state);
        ChordSymbol.format(members["ChordSymbol"], state);
        Bend.format(members["Bend"], state);
        Vibrato.format(members["Vibrato"], state, this);
        this.width = state.leftShift + state.rightShift;
        this.preFormatted = true;
    }
    postFormat() {
        if (this.postFormatted)
            return;
        L('Postformatting ModifierContext');
        StaveNote.postFormat(this.getMembers("StaveNote"));
    }
}
ModifierContext.DEBUG = false;
