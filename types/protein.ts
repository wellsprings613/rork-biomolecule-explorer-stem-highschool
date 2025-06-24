export type FileFormat = 'pdb' | 'cif' | 'mol' | 'mol2';

export interface Atom {
  id: number;
  element: string;
  x: number;
  y: number;
  z: number;
  residue: string;
  residueNumber: number;
  chain: string;
}

export interface Residue {
  id: number;
  name: string;
  chain: string;
  atoms: Atom[];
  secondaryStructure?: 'helix' | 'sheet' | 'loop';
  isFunctional?: boolean;
  functionalType?: string;
}

export interface Chain {
  id: string;
  residues: Residue[];
}

export interface ProteinStructure {
  id: string;
  name: string;
  description?: string;
  chains: Chain[];
  atoms: Atom[];
  source?: string;
  resolution?: number;
  experimentMethod?: string;
  releaseDate?: string;
  fileFormat?: FileFormat;
  rawContent?: string; // Added to store the original file content for rendering
}

export interface ProteinSummary {
  name: string;
  description: string;
  structuralFeatures: string;
  functionalRegions: string;
  biologicalSignificance: string;
}

export interface AnnotationSettings {
  showHelices: boolean;
  showSheets: boolean;
  showLoops: boolean;
  showBindingSites: boolean;
  showHydrophobic: boolean;
  showHydrophilic: boolean;
  showCharged: boolean;
  showNeutral: boolean;
}