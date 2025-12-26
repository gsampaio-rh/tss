export interface WindScenario {
  name: string;
  name_ru?: string;
  wind: number[];
  width: number;
  height: number;
  stepscount?: number;
  startsize?: number;
  israndom?: boolean;
  count?: number[];
  maxwindsetting?: number;
  type?: string;
}

export interface WindPreset {
  name: string;
  name_ru?: string;
  wind: number[];
  width: number;
  height: number;
  stepscount: number;
  startsize: number;
  israndom?: boolean;
  count?: number[];
  maxwindsetting?: number;
  type?: string;
}

