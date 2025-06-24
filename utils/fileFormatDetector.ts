import { FileFormat } from '@/types/protein';
import { Platform } from 'react-native';

/**
 * Detects the molecular file format based on file content
 * @param content The file content as string
 * @param fileName Optional filename to use as fallback for detection
 * @returns The detected file format or null if unknown
 */
export const detectFileFormat = (content: string, fileName?: string): FileFormat | null => {
  // Remove whitespace and normalize line endings
  const normalizedContent = content.trim();
  const lines = normalizedContent.split(/\r?\n/);
  const firstLine = lines[0]?.trim() || '';
  
  // PDB format detection
  if (
    (firstLine.startsWith('HEADER') || 
     firstLine.startsWith('TITLE') || 
     firstLine.startsWith('COMPND') ||
     firstLine.startsWith('ATOM') ||
     firstLine.startsWith('HETATM')) &&
    (normalizedContent.includes('ATOM  ') || 
     normalizedContent.includes('HETATM'))
  ) {
    return 'pdb';
  }
  
  // mmCIF format detection
  if (
    firstLine.startsWith('data_') || 
    normalizedContent.includes('_atom_site.') ||
    normalizedContent.includes('loop_') ||
    normalizedContent.includes('_entry.id') ||
    normalizedContent.includes('_chem_comp.')
  ) {
    return 'cif';
  }
  
  // MOL format detection
  if (
    normalizedContent.includes('V2000') || 
    normalizedContent.includes('V3000')
  ) {
    return 'mol';
  }
  
  // MOL2 format detection
  if (
    normalizedContent.includes('@<TRIPOS>MOLECULE') || 
    normalizedContent.includes('@<TRIPOS>ATOM')
  ) {
    return 'mol2';
  }
  
  // If content detection fails, try to use file extension as fallback
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdb') return 'pdb';
    if (extension === 'cif' || extension === 'mmcif') return 'cif';
    if (extension === 'mol') return 'mol';
    if (extension === 'mol2') return 'mol2';
  }
  
  // Check for PDB-like content even without proper headers
  if (lines.some(line => line.match(/^ATOM\s+\d+\s+\w+\s+\w+\s+[A-Z]\s+\d+/))) {
    return 'pdb';
  }
  
  // Unknown format
  return null;
};

/**
 * Validates if the file content appears to be a valid molecular structure file
 * @param content The file content as string
 * @param format The detected format
 * @returns True if the file appears valid, false otherwise
 */
export const validateFileContent = (content: string, format: FileFormat): boolean => {
  if (!content || content.length < 10) return false;
  
  // More lenient validation to handle various file formats
  switch (format) {
    case 'pdb':
      // Check for any ATOM or HETATM records
      return content.includes('ATOM') || content.includes('HETATM');
    
    case 'cif':
      // Very basic check for CIF files
      return content.includes('_') && (
        content.includes('loop_') || 
        content.includes('data_') || 
        content.includes('_atom')
      );
    
    case 'mol':
      // Basic check for MOL files
      return content.includes('V2000') || content.includes('V3000');
    
    case 'mol2':
      // Basic check for MOL2 files
      return content.includes('@<TRIPOS>');
    
    default:
      return false;
  }
};

/**
 * Checks if a file is a valid PDB file based on extension and content
 * @param file The file to check
 * @returns True if the file is a valid PDB file, false otherwise
 */
export const isPdbFile = async (file: any): Promise<boolean> => {
  // Check file extension
  const extension = file.name?.split('.').pop()?.toLowerCase();
  if (extension !== 'pdb') {
    return false;
  }
  
  try {
    // Check file content
    let content: string;
    
    if (Platform.OS === 'web') {
      // For web
      if (file instanceof File && typeof file.text === 'function') {
        content = await file.text();
      } else {
        // Fallback for older browsers
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }
    } else {
      // For native
      if (file.uri) {
        const FileSystem = require('expo-file-system');
        content = await FileSystem.readAsStringAsync(file.uri);
      } else {
        return false;
      }
    }
    
    const format = detectFileFormat(content, file.name);
    
    if (format !== 'pdb') {
      return false;
    }
    
    return validateFileContent(content, 'pdb');
  } catch (error) {
    console.error('Error validating PDB file:', error);
    return false;
  }
};