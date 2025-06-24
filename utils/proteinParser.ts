import { ProteinStructure, Atom, Residue, Chain, FileFormat } from '@/types/protein';
import { detectFileFormat, validateFileContent } from './fileFormatDetector';

// Simple PDB parser (basic implementation)
export const parsePDB = (pdbData: string): ProteinStructure => {
  const lines = pdbData.split('\n');
  const atoms: Atom[] = [];
  const chainMap = new Map<string, Residue[]>();
  
  // Extract header information
  let name = 'Unknown Protein';
  let description = '';
  
  for (const line of lines) {
    if (line.startsWith('HEADER')) {
      name = line.substring(10, 50).trim();
    } else if (line.startsWith('TITLE')) {
      description += line.substring(10).trim() + ' ';
    } else if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
      // Parse atom data
      const atomId = parseInt(line.substring(6, 11).trim());
      const element = line.substring(76, 78).trim();
      const x = parseFloat(line.substring(30, 38).trim());
      const y = parseFloat(line.substring(38, 46).trim());
      const z = parseFloat(line.substring(46, 54).trim());
      const residueName = line.substring(17, 20).trim();
      const residueNumber = parseInt(line.substring(22, 26).trim());
      const chainId = line.substring(21, 22).trim();
      
      const atom: Atom = {
        id: atomId,
        element,
        x, y, z,
        residue: residueName,
        residueNumber,
        chain: chainId
      };
      
      atoms.push(atom);
      
      // Group atoms by chain and residue
      if (!chainMap.has(chainId)) {
        chainMap.set(chainId, []);
      }
      
      const chainResidues = chainMap.get(chainId)!;
      let residue = chainResidues.find(r => r.id === residueNumber);
      
      if (!residue) {
        residue = {
          id: residueNumber,
          name: residueName,
          chain: chainId,
          atoms: []
        };
        chainResidues.push(residue);
      }
      
      residue.atoms.push(atom);
    } else if (line.startsWith('HELIX')) {
      // Parse helix information
      const chainId = line.substring(19, 20).trim();
      const startRes = parseInt(line.substring(21, 25).trim());
      const endRes = parseInt(line.substring(33, 37).trim());
      
      if (chainMap.has(chainId)) {
        const chainResidues = chainMap.get(chainId)!;
        for (const residue of chainResidues) {
          if (residue.id >= startRes && residue.id <= endRes) {
            residue.secondaryStructure = 'helix';
          }
        }
      }
    } else if (line.startsWith('SHEET')) {
      // Parse sheet information
      const chainId = line.substring(21, 22).trim();
      const startRes = parseInt(line.substring(22, 26).trim());
      const endRes = parseInt(line.substring(33, 37).trim());
      
      if (chainMap.has(chainId)) {
        const chainResidues = chainMap.get(chainId)!;
        for (const residue of chainResidues) {
          if (residue.id >= startRes && residue.id <= endRes) {
            residue.secondaryStructure = 'sheet';
          }
        }
      }
    } else if (line.startsWith('SITE')) {
      // Parse binding site information
      const chainId = line.substring(22, 23).trim();
      const residueNumber = parseInt(line.substring(23, 27).trim());
      
      if (chainMap.has(chainId)) {
        const chainResidues = chainMap.get(chainId)!;
        const residue = chainResidues.find(r => r.id === residueNumber);
        if (residue) {
          residue.isFunctional = true;
          residue.functionalType = 'binding';
        }
      }
    }
  }
  
  // Set default secondary structure for residues without one
  for (const [chainId, residues] of chainMap.entries()) {
    for (const residue of residues) {
      if (!residue.secondaryStructure) {
        residue.secondaryStructure = 'loop';
      }
    }
  }
  
  // Create chains array
  const chains: Chain[] = [];
  for (const [chainId, residues] of chainMap.entries()) {
    chains.push({
      id: chainId,
      residues: residues.sort((a, b) => a.id - b.id)
    });
  }
  
  return {
    id: Date.now().toString(),
    name,
    description,
    chains,
    atoms,
    fileFormat: 'pdb',
    rawContent: pdbData
  };
};

// Improved mmCIF parser with better error handling
export const parseCIF = (cifData: string): ProteinStructure => {
  const lines = cifData.split('\n');
  const atoms: Atom[] = [];
  const chainMap = new Map<string, Residue[]>();
  
  let name = 'Unknown Protein';
  let description = '';
  
  // Find the _struct.title field for the name
  const titleLine = lines.find(line => line.trim().startsWith('_struct.title'));
  if (titleLine) {
    name = titleLine.split(/\s+/).slice(1).join(' ').replace(/['"]/g, '').trim();
  }
  
  // Try to find entity name if struct.title is not available
  if (name === 'Unknown Protein') {
    const entityNameLine = lines.find(line => line.trim().startsWith('_entity.pdbx_description'));
    if (entityNameLine) {
      name = entityNameLine.split(/\s+/).slice(1).join(' ').replace(/['"]/g, '').trim();
    }
  }
  
  // Find atom site loop
  let inAtomSiteLoop = false;
  let columnIndices: Record<string, number> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for atom site loop
    if (line === 'loop_') {
      let nextLine = '';
      let j = i + 1;
      
      // Look ahead to see if this is the atom_site loop
      while (j < lines.length && (nextLine = lines[j].trim()).startsWith('_')) {
        if (nextLine.startsWith('_atom_site.')) {
          inAtomSiteLoop = true;
          break;
        }
        j++;
      }
      
      if (inAtomSiteLoop) {
        // Map column indices
        let colIndex = 0;
        j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('_atom_site.')) {
          const colName = lines[j].trim().split('.')[1];
          columnIndices[colName] = colIndex;
          colIndex++;
          j++;
        }
        
        // Skip to the data rows
        i = j - 1;
        continue;
      }
    }
    
    // Process atom data
    if (inAtomSiteLoop && line && !line.startsWith('#') && !line.startsWith('_')) {
      if (line === 'loop_' || line.startsWith('data_')) {
        inAtomSiteLoop = false;
        continue;
      }
      
      const columns = line.split(/\s+/).filter(Boolean);
      if (columns.length < 5) continue; // Skip invalid lines
      
      try {
        // Try to extract atom information using various possible column names
        const getColumnValue = (keys: string[], defaultValue: string = ''): string => {
          for (const key of keys) {
            if (columnIndices[key] !== undefined && columns[columnIndices[key]]) {
              return columns[columnIndices[key]];
            }
          }
          return defaultValue;
        };
        
        const atomId = parseInt(getColumnValue(['id', 'label_atom_id'], '0'));
        const element = getColumnValue(['type_symbol', 'label_element'], 'X');
        const x = parseFloat(getColumnValue(['Cartn_x', 'x_coord'], '0'));
        const y = parseFloat(getColumnValue(['Cartn_y', 'y_coord'], '0'));
        const z = parseFloat(getColumnValue(['Cartn_z', 'z_coord'], '0'));
        const residueName = getColumnValue(['label_comp_id', 'comp_id'], 'UNK');
        const residueNumber = parseInt(getColumnValue(['label_seq_id', 'seq_id'], '0'));
        const chainId = getColumnValue(['auth_asym_id', 'label_asym_id', 'asym_id'], 'A');
        
        // Skip if we couldn't parse essential coordinates
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
          continue;
        }
        
        const atom: Atom = {
          id: atomId || atoms.length + 1, // Use counter if ID is missing
          element: element || 'X',
          x, y, z,
          residue: residueName,
          residueNumber: residueNumber || 1, // Default to 1 if missing
          chain: chainId
        };
        
        atoms.push(atom);
        
        // Group atoms by chain and residue
        if (!chainMap.has(chainId)) {
          chainMap.set(chainId, []);
        }
        
        const chainResidues = chainMap.get(chainId)!;
        let residue = chainResidues.find(r => r.id === residueNumber);
        
        if (!residue) {
          residue = {
            id: residueNumber || 1,
            name: residueName,
            chain: chainId,
            atoms: []
          };
          chainResidues.push(residue);
        }
        
        residue.atoms.push(atom);
      } catch (error) {
        console.error('Error parsing CIF atom line:', error);
        continue;
      }
    }
  }
  
  // If no atoms were found, try a simpler parsing approach
  if (atoms.length === 0) {
    console.log('No atoms found with standard parsing, trying simplified approach');
    
    // Simple approach: look for lines with coordinates
    let atomCounter = 1;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('_') && !trimmedLine.startsWith('loop_')) {
        const parts = trimmedLine.split(/\s+/).filter(Boolean);
        
        // Look for 3 consecutive numbers which could be coordinates
        for (let i = 0; i < parts.length - 2; i++) {
          const x = parseFloat(parts[i]);
          const y = parseFloat(parts[i + 1]);
          const z = parseFloat(parts[i + 2]);
          
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            const atom: Atom = {
              id: atomCounter++,
              element: 'C', // Default element
              x, y, z,
              residue: 'UNK',
              residueNumber: 1,
              chain: 'A'
            };
            
            atoms.push(atom);
            
            // Add to default chain
            if (!chainMap.has('A')) {
              chainMap.set('A', []);
            }
            
            let residue = chainMap.get('A')!.find(r => r.id === 1);
            if (!residue) {
              residue = {
                id: 1,
                name: 'UNK',
                chain: 'A',
                atoms: []
              };
              chainMap.get('A')!.push(residue);
            }
            
            residue.atoms.push(atom);
            break; // Found coordinates in this line, move to next line
          }
        }
      }
    }
  }
  
  // Set default secondary structure for all residues (CIF doesn't have clear secondary structure markers)
  for (const [chainId, residues] of chainMap.entries()) {
    for (const residue of residues) {
      residue.secondaryStructure = 'loop';
    }
  }
  
  // Create chains array
  const chains: Chain[] = [];
  for (const [chainId, residues] of chainMap.entries()) {
    chains.push({
      id: chainId,
      residues: residues.sort((a, b) => a.id - b.id)
    });
  }
  
  return {
    id: Date.now().toString(),
    name,
    description,
    chains,
    atoms,
    fileFormat: 'cif',
    rawContent: cifData
  };
};

// Basic MOL parser
export const parseMOL = (molData: string): ProteinStructure => {
  const lines = molData.split('\n');
  const atoms: Atom[] = [];
  
  // First line is typically the name
  let name = lines[0]?.trim() || 'Unknown Molecule';
  if (name.length === 0) name = 'Unknown Molecule';
  
  // Skip header (first 3 lines)
  // 4th line contains counts (atoms, bonds, etc.)
  if (lines.length < 4) {
    throw new Error('Invalid MOL file format');
  }
  
  const countsLine = lines[3].trim();
  const atomCount = parseInt(countsLine.substring(0, 3).trim());
  
  // Parse atoms (start at line 4)
  for (let i = 4; i < 4 + atomCount && i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < 30) continue;
    
    try {
      const x = parseFloat(line.substring(0, 10).trim());
      const y = parseFloat(line.substring(10, 20).trim());
      const z = parseFloat(line.substring(20, 30).trim());
      const element = line.substring(31, 34).trim();
      
      const atom: Atom = {
        id: i - 3,
        element,
        x, y, z,
        residue: 'MOL',
        residueNumber: 1,
        chain: 'A'
      };
      
      atoms.push(atom);
    } catch (error) {
      console.error('Error parsing MOL atom line:', error);
      continue;
    }
  }
  
  // Create a single chain with a single residue containing all atoms
  const residue: Residue = {
    id: 1,
    name: 'MOL',
    chain: 'A',
    atoms,
    secondaryStructure: 'loop'
  };
  
  const chain: Chain = {
    id: 'A',
    residues: [residue]
  };
  
  return {
    id: Date.now().toString(),
    name,
    description: 'Imported from MOL format',
    chains: [chain],
    atoms,
    fileFormat: 'mol',
    rawContent: molData
  };
};

// Basic MOL2 parser
export const parseMOL2 = (mol2Data: string): ProteinStructure => {
  const lines = mol2Data.split('\n');
  const atoms: Atom[] = [];
  const chainMap = new Map<string, Residue[]>();
  
  let name = 'Unknown Molecule';
  let inMoleculeSection = false;
  let inAtomSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '@<TRIPOS>MOLECULE') {
      inMoleculeSection = true;
      continue;
    }
    
    if (inMoleculeSection && line && !line.startsWith('@')) {
      name = line;
      inMoleculeSection = false;
      continue;
    }
    
    if (line === '@<TRIPOS>ATOM') {
      inAtomSection = true;
      continue;
    }
    
    if (line === '@<TRIPOS>BOND' || line.startsWith('@<TRIPOS>')) {
      inAtomSection = false;
      continue;
    }
    
    if (inAtomSection && line && !line.startsWith('#')) {
      const columns = line.split(/\s+/).filter(Boolean);
      if (columns.length < 6) continue;
      
      try {
        const atomId = parseInt(columns[0]);
        const atomName = columns[1];
        const x = parseFloat(columns[2]);
        const y = parseFloat(columns[3]);
        const z = parseFloat(columns[4]);
        const residueName = columns.length > 7 ? columns[7] : 'UNK';
        const residueNumber = columns.length > 6 ? parseInt(columns[6]) : 1;
        const chainId = columns.length > 8 ? columns[8] : 'A';
        
        // Extract element from atom name (usually first 1-2 characters)
        const element = atomName.replace(/[0-9]/g, '').substring(0, 2).trim();
        
        const atom: Atom = {
          id: atomId,
          element,
          x, y, z,
          residue: residueName,
          residueNumber,
          chain: chainId
        };
        
        atoms.push(atom);
        
        // Group atoms by chain and residue
        if (!chainMap.has(chainId)) {
          chainMap.set(chainId, []);
        }
        
        const chainResidues = chainMap.get(chainId)!;
        let residue = chainResidues.find(r => r.id === residueNumber);
        
        if (!residue) {
          residue = {
            id: residueNumber,
            name: residueName,
            chain: chainId,
            atoms: []
          };
          chainResidues.push(residue);
        }
        
        residue.atoms.push(atom);
      } catch (error) {
        console.error('Error parsing MOL2 atom line:', error);
        continue;
      }
    }
  }
  
  // Set default secondary structure for all residues
  for (const [chainId, residues] of chainMap.entries()) {
    for (const residue of residues) {
      residue.secondaryStructure = 'loop';
    }
  }
  
  // Create chains array
  const chains: Chain[] = [];
  for (const [chainId, residues] of chainMap.entries()) {
    chains.push({
      id: chainId,
      residues: residues.sort((a, b) => a.id - b.id)
    });
  }
  
  return {
    id: Date.now().toString(),
    name,
    description: 'Imported from MOL2 format',
    chains,
    atoms,
    fileFormat: 'mol2',
    rawContent: mol2Data
  };
};

// Function to handle different file types
export const parseProteinFile = async (fileContent: string, fileName: string): Promise<ProteinStructure | null> => {
  try {
    // Auto-detect file format
    const detectedFormat = detectFileFormat(fileContent, fileName);
    
    if (!detectedFormat) {
      throw new Error('Unknown or unsupported file format. Please upload a PDB, mmCIF, MOL, or MOL2 file.');
    }
    
    // Validate file content with more lenient validation
    if (!validateFileContent(fileContent, detectedFormat)) {
      throw new Error(`The file appears to be a ${detectedFormat.toUpperCase()} file but has invalid or corrupted content.`);
    }
    
    // Parse based on detected format
    try {
      switch (detectedFormat) {
        case 'pdb':
          return parsePDB(fileContent);
        case 'cif':
          return parseCIF(fileContent);
        case 'mol':
          return parseMOL(fileContent);
        case 'mol2':
          return parseMOL2(fileContent);
        default:
          throw new Error(`Unsupported file format: ${detectedFormat}`);
      }
    } catch (parsingError) {
      console.error(`Error parsing ${detectedFormat} file:`, parsingError);
      
      // Create a minimal fallback structure with the raw content
      // This ensures the viewer can still try to render something
      return {
        id: Date.now().toString(),
        name: fileName || `Unreadable ${detectedFormat.toUpperCase()} File`,
        description: `This file could not be fully parsed, but the viewer will attempt to render it directly.`,
        chains: [],
        atoms: [],
        fileFormat: detectedFormat,
        rawContent: fileContent
      };
    }
  } catch (error) {
    console.error('Error parsing protein file:', error);
    throw error;
  }
};