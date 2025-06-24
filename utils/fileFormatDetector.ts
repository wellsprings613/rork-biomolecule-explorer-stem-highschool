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
  
  console.log('Detecting file format, first line:', firstLine.substring(0, 20));
  
  // PDB format detection - more robust checks
  if (
    (firstLine.startsWith('HEADER') || 
     firstLine.startsWith('TITLE') || 
     firstLine.startsWith('COMPND') ||
     firstLine.startsWith('ATOM') ||
     firstLine.startsWith('HETATM')) &&
    (normalizedContent.includes('ATOM  ') || 
     normalizedContent.includes('HETATM'))
  ) {
    console.log('Detected PDB format based on header/atom records');
    return 'pdb';
  }
  
  // Additional PDB detection for files without proper headers
  if (lines.some(line => /^ATOM\s+\d+\s+\w+\s+\w+\s+[A-Z]\s+\d+/.test(line))) {
    console.log('Detected PDB format based on ATOM line pattern');
    return 'pdb';
  }
  
  // mmCIF format detection - improved
  if (
    firstLine.startsWith('data_') || 
    normalizedContent.includes('_atom_site.') ||
    (normalizedContent.includes('loop_') && 
     normalizedContent.includes('_atom_site.')) ||
    normalizedContent.includes('_entry.id') ||
    normalizedContent.includes('_chem_comp.')
  ) {
    console.log('Detected CIF format');
    return 'cif';
  }
  
  // MOL format detection - improved
  if (
    normalizedContent.includes('V2000') || 
    normalizedContent.includes('V3000') ||
    (lines.length > 3 && lines[3].trim().match(/^\s*\d+\s+\d+\s+\d+/))
  ) {
    console.log('Detected MOL format');
    return 'mol';
  }
  
  // MOL2 format detection - improved
  if (
    normalizedContent.includes('@<TRIPOS>MOLECULE') || 
    normalizedContent.includes('@<TRIPOS>ATOM') ||
    normalizedContent.includes('@<TRIPOS>')
  ) {
    console.log('Detected MOL2 format');
    return 'mol2';
  }
  
  // If content detection fails, try to use file extension as fallback
  if (fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    console.log('Using file extension as fallback:', extension);
    if (extension === 'pdb') return 'pdb';
    if (extension === 'cif' || extension === 'mmcif') return 'cif';
    if (extension === 'mol') return 'mol';
    if (extension === 'mol2') return 'mol2';
  }
  
  // Last resort: check for coordinate-like patterns in the content
  // This helps with malformed files that still contain valid coordinate data
  const coordPattern = /[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[-+]?\d+\.\d+/;
  if (lines.some(line => coordPattern.test(line))) {
    // If we find coordinate-like patterns, default to PDB as it's most common
    console.log('Detected coordinate pattern, defaulting to PDB format');
    return 'pdb';
  }
  
  console.log('Could not detect file format');
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
  if (!content || content.length < 10) {
    console.log('File content too short or empty');
    return false;
  }
  
  console.log(`Validating ${format} file content, length:`, content.length);
  
  // More lenient validation to handle various file formats
  switch (format) {
    case 'pdb':
      // Check for any ATOM or HETATM records or coordinate-like patterns
      if (content.includes('ATOM') || content.includes('HETATM')) {
        console.log('PDB validation: found ATOM/HETATM records');
        return true;
      }
      
      // Look for coordinate patterns as a fallback
      const lines = content.split(/\r?\n/);
      const coordPattern = /[-+]?\d+\.\d+\s+[-+]?\d+\.\d+\s+[-+]?\d+\.\d+/;
      const hasCoords = lines.some(line => coordPattern.test(line));
      console.log('PDB validation: coordinate pattern found:', hasCoords);
      return hasCoords;
    
    case 'cif':
      // Very basic check for CIF files
      const hasCifMarkers = content.includes('_') && (
        content.includes('loop_') || 
        content.includes('data_') || 
        content.includes('_atom')
      );
      console.log('CIF validation result:', hasCifMarkers);
      return hasCifMarkers;
    
    case 'mol':
      // Basic check for MOL files
      if (content.includes('V2000') || content.includes('V3000')) {
        console.log('MOL validation: found version marker');
        return true;
      }
      
      // Check for coordinate blocks
      const molLines = content.split(/\r?\n/);
      if (molLines.length > 3) {
        // MOL files typically have a counts line (line 4) with atom and bond counts
        const countLine = molLines[3].trim();
        const hasCountLine = /^\s*\d+\s+\d+/.test(countLine);
        console.log('MOL validation: count line found:', hasCountLine);
        return hasCountLine;
      }
      console.log('MOL validation failed: insufficient lines');
      return false;
    
    case 'mol2':
      // Basic check for MOL2 files
      const hasMol2Marker = content.includes('@<TRIPOS>');
      console.log('MOL2 validation result:', hasMol2Marker);
      return hasMol2Marker;
    
    default:
      console.log('Unknown format, validation failed');
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
    console.log('Not a PDB file based on extension:', extension);
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
        console.log('No URI found in file object');
        return false;
      }
    }
    
    console.log('Checking PDB file content, length:', content.length);
    const format = detectFileFormat(content, file.name);
    
    if (format !== 'pdb') {
      console.log('File content does not match PDB format, detected:', format);
      return false;
    }
    
    const isValid = validateFileContent(content, 'pdb');
    console.log('PDB validation result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating PDB file:', error);
    return false;
  }
};