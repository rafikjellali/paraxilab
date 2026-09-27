export type ControlMode = 'user' | 'ai' | 'collaborative';

export type IndicatorType = 'phenolphthalein' | 'bromothymol_blue' | 'methyl_orange';

export interface ExperimentParams {
  acidType: 'HCl' | 'CH3COOH';
  baseType: 'NaOH';
  acidConcentration: number; // mol/L (Ca)
  acidVolume: number; // mL (Va)
  baseConcentration: number; // mol/L (Cb)
  indicator: IndicatorType;
  indicatorDrops: number;
}

export interface DataPoint {
  id: number;
  volumeBase: number; // mL
  pH: number;
  colorHex: string;
  notes: string;
  timestamp: string;
  recordedBy: 'user' | 'ai';
}

export interface ProtocolStep {
  id: number;
  title: string;
  instruction: string;
  targetAction: string;
  completed: boolean;
  scientificConcept: string;
  safetyTip: string;
}

export type FlowRate = 'closed' | 'drop' | 'slow' | 'fast';

export interface CameraViewMode {
  id: 'orbit' | 'closeup_flask' | 'closeup_burette' | 'whiteboard' | 'panoramic';
  name: string;
}
