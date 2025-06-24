import { FileFormat } from '@/types/protein';

/**
 * Detects the molecular file format based on file content
 * @param content The file content as string
 * @param fileName Optional filename to use as fallback for detection
 * @returns The detected file format or null if unknown
 */
export const detectFileFormat = (content: string, fileName?: string): FileFormat | null => {
  // Remove whitespace and normalize line endings
  const normalizedContent = content.trim();
  const firstLine = normalizedContent.split('\n')[0].trim();
  
  // PDB format detection - more strict validation
  if (
    (firstLine.startsWith('HEADER') || 
    firstLine.startsWith('TITLE') || 
    firstLine.startsWith('COMPND')) &&
    (normalizedContent.includes('ATOM  ') || 
    normalizedContent.includes('HETATM'))
  ) {
    return 'pdb';
  }
  
  // mmCIF format detection - more lenient
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
    if (extension === 'pdb') {
      // For PDB files, do a secondary check for common PDB keywords
      if (normalizedContent.includes('ATOM') || normalizedContent.includes('HETATM')) {
        return 'pdb';
      }
    }
    if (extension === 'cif' || extension === 'mmcif') return 'cif';
    if (extension === 'mol') return 'mol';
    if (extension === 'mol2') return 'mol2';
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
  
  switch (format) {
    case 'pdb':
      // More strict validation for PDB files
      return (
        (content.includes('ATOM  ') || content.includes('HETATM')) &&
        (content.includes('HEADER') || content.includes('TITLE') || content.includes('COMPND') || content.includes('REMARK'))
      );
    
    case 'cif':
      // More lenient validation for CIF files
      // Just check if it has some basic structure that looks like a CIF file
      return (
        content.includes('_') && 
        (content.includes('loop_') || 
         content.includes('data_') || 
         content.includes('_atom_site.') ||
         content.includes('_entry.') ||
         content.includes('_chem_comp.'))
      );
    
    case 'mol':
      // Check for essential MOL elements
      return (
        content.includes('V2000') || 
        content.includes('V3000')
      );
    
    case 'mol2':
      // Check for essential MOL2 elements
      return (
        content.includes('@<TRIPOS>MOLECULE') && 
        content.includes('@<TRIPOS>ATOM')
      );
    
    default:
      return false;
  }
};

/**
 * Checks if a file is a valid PDB file based on extension and content
 * @param file The file to check
 * @returns True if the file is a valid PDB file, false otherwise
 */
export const isPdbFile = async (file: File): Promise<boolean> => {
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'pdb') {
    return false;
  }
  
  try {
    // Check file content
    const content = await file.text();
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