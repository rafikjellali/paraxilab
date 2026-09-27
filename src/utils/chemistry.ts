import { ExperimentParams, IndicatorType } from '../types/lab';

/**
 * Calculates exact theoretical pH for acid-base titration:
 * - Strong acid (HCl) with Strong base (NaOH):
 *   Equivalence at pH = 7.0
 * - Weak acid (CH3COOH, pKa=4.76) with Strong base (NaOH):
 *   Equivalence at pH ~ 8.72
 */
export function calculatePH(volumeBaseAdded: number, params: ExperimentParams): number {
  const { acidType, acidConcentration: Ca, acidVolume: Va, baseConcentration: Cb } = params;
  const V_total = Va + volumeBaseAdded; // mL
  const n_acid_initial = (Ca * Va) / 1000; // moles
  const n_base_added = (Cb * volumeBaseAdded) / 1000; // moles

  if (acidType === 'HCl') {
    // Strong Acid - Strong Base
    const diff = n_acid_initial - n_base_added;
    const tolerance = 1e-7;

    if (Math.abs(diff) < tolerance) {
      return 7.0; // Equivalence point
    } else if (diff > 0) {
      // Before equivalence: excess H+
      const concH = diff / (V_total / 1000);
      const pH = -Math.log10(concH);
      return Math.max(0.5, Math.min(6.99, Number(pH.toFixed(2))));
    } else {
      // After equivalence: excess OH-
      const concOH = -diff / (V_total / 1000);
      const pOH = -Math.log10(concOH);
      const pH = 14 - pOH;
      return Math.max(7.01, Math.min(13.8, Number(pH.toFixed(2))));
    }
  } else {
    // Weak Acid (CH3COOH), pKa = 4.76
    const pKa = 4.76;
    const Ka = Math.pow(10, -pKa);
    const Veq = (Ca * Va) / Cb; // mL

    if (volumeBaseAdded < 0.05) {
      // Initial pure weak acid solution: [H+] = sqrt(Ka * Ca)
      const concH = Math.sqrt(Ka * Ca);
      return Number((-Math.log10(concH)).toFixed(2));
    }

    if (Math.abs(volumeBaseAdded - Veq) < 0.05) {
      // At equivalence: basic salt solution (CH3COO-)
      const concAcetate = n_acid_initial / (V_total / 1000);
      const Kb = 1e-14 / Ka;
      const concOH = Math.sqrt(Kb * concAcetate);
      const pOH = -Math.log10(concOH);
      return Number((14 - pOH).toFixed(2));
    }

    if (volumeBaseAdded < Veq) {
      // Buffer zone: Henderson-Hasselbalch equation
      // pH = pKa + log([A-] / [HA])
      const ratio = n_base_added / (n_acid_initial - n_base_added);
      if (ratio <= 0) return 2.88;
      const pH = pKa + Math.log10(ratio);
      return Number(Math.max(2.5, Math.min(8.0, pH)).toFixed(2));
    } else {
      // Beyond equivalence: excess strong base dominates
      const excessOH = (n_base_added - n_acid_initial) / (V_total / 1000);
      const pOH = -Math.log10(excessOH);
      const pH = 14 - pOH;
      return Number(Math.max(8.8, Math.min(13.8, pH)).toFixed(2));
    }
  }
}

/**
 * Returns RGB hex color of the solution in the flask depending on:
 * - indicator type
 * - indicator drops (0 = colorless water)
 * - measured pH
 */
export function getSolutionColor(pH: number, indicator: IndicatorType, drops: number): { hex: string; nameAr: string; nameEn: string; isEquivalencePointColor: boolean } {
  if (drops <= 0) {
    return { hex: '#dbeafe', nameAr: 'عديم اللون (ماء)', nameEn: 'Colorless', isEquivalencePointColor: false };
  }

  if (indicator === 'phenolphthalein') {
    // Colorless below 8.2, Soft Pink 8.2 - 9.8, Vivid Magenta above 9.8
    if (pH < 8.2) {
      return { hex: '#f0f9ff', nameAr: 'عديم اللون (وسط حمضي)', nameEn: 'Colorless (Acidic)', isEquivalencePointColor: false };
    } else if (pH <= 8.8) {
      return { hex: '#fbcfe8', nameAr: 'وردي باهت (نقطة نهاية المعايرة)', nameEn: 'Faint Pale Pink (Endpoint)', isEquivalencePointColor: true };
    } else if (pH <= 10.0) {
      return { hex: '#f472b6', nameAr: 'وردي معتدل', nameEn: 'Moderate Pink', isEquivalencePointColor: false };
    } else {
      return { hex: '#db2777', nameAr: 'وردي فاقع / قرمزي (فائض أساس)', nameEn: 'Deep Vivid Magenta (Excess Base)', isEquivalencePointColor: false };
    }
  } else if (indicator === 'bromothymol_blue') {
    // Yellow < 6.0, Green 6.0 - 7.6, Blue > 7.6
    if (pH < 6.0) {
      return { hex: '#fef08a', nameAr: 'أصفر (وسط حمضي)', nameEn: 'Yellow (Acidic)', isEquivalencePointColor: false };
    } else if (pH <= 7.6) {
      return { hex: '#86efac', nameAr: 'أخضر عشبي (نقطة التكافؤ / معتدل)', nameEn: 'Grass Green (Neutral Endpoint)', isEquivalencePointColor: true };
    } else {
      return { hex: '#60a5fa', nameAr: 'أزرق سماوي (وسط قاعدي)', nameEn: 'Blue (Basic)', isEquivalencePointColor: false };
    }
  } else {
    // Methyl orange: Red < 3.1, Orange 3.1 - 4.4, Yellow > 4.4
    if (pH < 3.1) {
      return { hex: '#f87171', nameAr: 'أحمر (حمضي قوي)', nameEn: 'Red (Strong Acid)', isEquivalencePointColor: false };
    } else if (pH <= 4.4) {
      return { hex: '#fb923c', nameAr: 'برتقالي (منطقة التغير)', nameEn: 'Orange (Endpoint)', isEquivalencePointColor: true };
    } else {
      return { hex: '#facc15', nameAr: 'أصفر ذهبي (قاعدي/معتدل)', nameEn: 'Yellow', isEquivalencePointColor: false };
    }
  }
}

/**
 * Calculates the theoretical equivalence volume:
 * V_eq = (Ca * Va) / Cb
 */
export function getTheoreticalEquivalenceVolume(params: ExperimentParams): number {
  return Number(((params.acidConcentration * params.acidVolume) / params.baseConcentration).toFixed(2));
}
