import { ProteinStructure, ProteinSummary } from '@/types/protein';

export const generateProteinSummary = async (protein: ProteinStructure): Promise<ProteinSummary> => {
  try {
    // Count secondary structures
    const helixCount = protein.chains.reduce((count, chain) => 
      count + chain.residues.filter(r => r.secondaryStructure === 'helix').length, 0);
    
    const sheetCount = protein.chains.reduce((count, chain) => 
      count + chain.residues.filter(r => r.secondaryStructure === 'sheet').length, 0);
    
    const loopCount = protein.chains.reduce((count, chain) => 
      count + chain.residues.filter(r => r.secondaryStructure === 'loop').length, 0);
    
    const functionalCount = protein.chains.reduce((count, chain) => 
      count + chain.residues.filter(r => r.isFunctional).length, 0);
    
    // Generate a prompt for the AI
    const prompt = `
      Generate a plain-language summary of a ${protein.fileFormat?.toUpperCase() || 'molecular'} structure with the following characteristics:
      Name: ${protein.name}
      Description: ${protein.description || 'Not provided'}
      Number of chains: ${protein.chains.length}
      Number of residues: ${protein.chains.reduce((sum, chain) => sum + chain.residues.length, 0)}
      Number of atoms: ${protein.atoms.length}
      File format: ${protein.fileFormat || 'Unknown'}
      Secondary structure composition:
      - Alpha helices: ${helixCount} residues
      - Beta sheets: ${sheetCount} residues
      - Loops: ${loopCount} residues
      Functional regions: ${functionalCount} residues identified as functional
      
      Please provide:
      1. A brief description of what this molecule is and its biological role
      2. An explanation of its structural features in simple terms
      3. A description of the functional regions and their importance
      4. The biological significance of this molecule
      
      Keep the language accessible to high school or undergraduate biology students.
    `;

    // Call the AI API
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful biology educator who explains molecular structures in simple terms.' },
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate molecular structure summary');
    }

    const data = await response.json();
    const aiResponse = data.completion;

    // Parse the AI response into sections
    const sections = aiResponse.split('\n\n');
    
    return {
      name: protein.name,
      description: sections[0] || 'No description available',
      structuralFeatures: sections.find((s: string) => s.includes('structural')) || 'No structural features identified',
      functionalRegions: sections.find((s: string) => s.includes('functional')) || 'No functional regions identified',
      biologicalSignificance: sections.find((s: string) => s.includes('biological')) || 'No biological significance information available',
    };
  } catch (error) {
    console.error('Error generating molecular structure summary:', error);
    return {
      name: protein.name,
      description: 'Failed to generate summary',
      structuralFeatures: 'Information not available',
      functionalRegions: 'Information not available',
      biologicalSignificance: 'Information not available',
    };
  }
};

export const exportSummaryAsTxt = (summary: ProteinSummary): string => {
  return `
MOLECULAR STRUCTURE SUMMARY: ${summary.name}

DESCRIPTION
${summary.description}

STRUCTURAL FEATURES
${summary.structuralFeatures}

FUNCTIONAL REGIONS
${summary.functionalRegions}

BIOLOGICAL SIGNIFICANCE
${summary.biologicalSignificance}
  `.trim();
};