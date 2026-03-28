import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProteinStructure, ProteinSummary, AnnotationSettings } from '@/types/protein';

interface ProteinState {
  currentProtein: ProteinStructure | null;
  proteinSummary: ProteinSummary | null;
  isLoading: boolean;
  error: string | null;
  annotations: AnnotationSettings;
  selectedResidues: number[];
  viewerSettings: {
    backgroundColor: string;
    representation: 'cartoon' | 'ball-and-stick' | 'space-filling' | 'ribbon';
    colorScheme: 'chain' | 'residue' | 'structure' | 'custom';
  };
  
  // Actions
  setCurrentProtein: (protein: ProteinStructure | null) => void;
  setProteinSummary: (summary: ProteinSummary | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleAnnotation: (key: keyof AnnotationSettings) => void;
  selectResidue: (residueId: number) => void;
  deselectResidue: (residueId: number) => void;
  clearSelectedResidues: () => void;
  updateViewerSettings: (settings: Partial<ProteinState['viewerSettings']>) => void;
  resetState: () => void;
}

const initialAnnotations: AnnotationSettings = {
  showHelices: true,
  showSheets: true,
  showLoops: false,
  showBindingSites: true,
  showHydrophobic: false,
  showHydrophilic: false,
  showCharged: false,
  showNeutral: false,
};

const initialViewerSettings = {
  backgroundColor: '#F8F9FA',
  representation: 'cartoon' as const,
  colorScheme: 'structure' as const,
};

export const useProteinStore = create<ProteinState>()(
  persist(
    (set) => ({
      currentProtein: null,
      proteinSummary: null,
      isLoading: false,
      error: null,
      annotations: initialAnnotations,
      selectedResidues: [],
      viewerSettings: initialViewerSettings,
      
      setCurrentProtein: (protein) => set({ currentProtein: protein }),
      setProteinSummary: (summary) => set({ proteinSummary: summary }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      toggleAnnotation: (key) => 
        set((state) => ({
          annotations: {
            ...state.annotations,
            [key]: !state.annotations[key]
          }
        })),
      
      selectResidue: (residueId) => 
        set((state) => ({
          selectedResidues: [...state.selectedResidues, residueId]
        })),
      
      deselectResidue: (residueId) => 
        set((state) => ({
          selectedResidues: state.selectedResidues.filter(id => id !== residueId)
        })),
      
      clearSelectedResidues: () => 
        set({ selectedResidues: [] }),
      
      updateViewerSettings: (settings) => 
        set((state) => ({
          viewerSettings: {
            ...state.viewerSettings,
            ...settings
          }
        })),
      
      resetState: () => 
        set({
          currentProtein: null,
          proteinSummary: null,
          isLoading: false,
          error: null,
          annotations: initialAnnotations,
          selectedResidues: [],
          viewerSettings: initialViewerSettings,
        }),
    }),
    {
      name: 'protein-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        viewerSettings: state.viewerSettings,
        annotations: state.annotations,
      }),
    }
  )
);