import { VexFlow } from '../src/vexflow';
import { Font } from '../src/font';
import { Academico } from '../src/fonts/academico';
import { AcademicoBold } from '../src/fonts/academicobold';
import { Bravura } from '../src/fonts/bravura';
import { Gonville } from '../src/fonts/gonville';
import { Petaluma } from '../src/fonts/petaluma';
import { PetalumaScript } from '../src/fonts/petalumascript';
const block = { display: 'block' };
const swap = { display: 'swap' };
const swapBold = { display: 'swap', weight: 'bold' };
const fontBravura = Font.load('Bravura', Bravura, block);
const fontAcademico = Font.load('Academico', Academico, swap);
const fontAcademicoBold = Font.load('Academico', AcademicoBold, swapBold);
const fontGonville = Font.load('Gonville', Gonville, block);
const fontPetaluma = Font.load('Petaluma', Petaluma, block);
const fontPetalumaScript = Font.load('Petaluma Script', PetalumaScript, swap);
const fontLoadPromises = [
    fontBravura,
    fontAcademico,
    fontAcademicoBold,
    fontGonville,
    fontPetaluma,
    fontPetalumaScript,
];
VexFlow.BUILD.INFO = 'vexflow';
VexFlow.setFonts('Bravura', 'Academico');
Promise.allSettled(fontLoadPromises).then(() => {
});
export * from '../src/index';
export default VexFlow;
