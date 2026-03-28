import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useProteinStore } from '@/store/proteinStore';
import { colors } from '@/constants/colors';
import { ChevronRight, ChevronDown, Download } from 'lucide-react-native';
import { exportSummaryAsTxt } from '@/utils/proteinSummary';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ProteinInfoSidebar() {
  const { currentProtein, proteinSummary } = useProteinStore();
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    structure: false,
    function: false,
    significance: false,
  });

  if (!currentProtein || !proteinSummary) {
    return null;
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const exportSummary = async () => {
    if (!proteinSummary) return;
    
    const summaryText = exportSummaryAsTxt(proteinSummary);
    const fileName = `${proteinSummary.name.replace(/\s+/g, '_')}_summary.txt`;
    
    if (Platform.OS === 'web') {
      // For web, create a download link
      const blob = new Blob([summaryText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For native platforms
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, summaryText);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    }
  };

  const Section = ({ 
    title, 
    content, 
    isExpanded, 
    onToggle 
  }: { 
    title: string; 
    content: string; 
    isExpanded: boolean; 
    onToggle: () => void;
  }) => (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggle}>
        {isExpanded ? 
          <ChevronDown size={20} color={colors.gray[700]} /> : 
          <ChevronRight size={20} color={colors.gray[700]} />
        }
        <Text style={styles.sectionTitle}>{title}</Text>
      </Pressable>
      
      {isExpanded && (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{proteinSummary.name}</Text>
        <Pressable 
          style={styles.exportButton} 
          onPress={exportSummary}
        >
          <Download size={18} color={colors.primary} />
          <Text style={styles.exportButtonText}>Export</Text>
        </Pressable>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <Section 
          title="Overview" 
          content={proteinSummary.description}
          isExpanded={expandedSections.overview}
          onToggle={() => toggleSection('overview')}
        />
        
        <Section 
          title="Structural Features" 
          content={proteinSummary.structuralFeatures}
          isExpanded={expandedSections.structure}
          onToggle={() => toggleSection('structure')}
        />
        
        <Section 
          title="Functional Regions" 
          content={proteinSummary.functionalRegions}
          isExpanded={expandedSections.function}
          onToggle={() => toggleSection('function')}
        />
        
        <Section 
          title="Biological Significance" 
          content={proteinSummary.biologicalSignificance}
          isExpanded={expandedSections.significance}
          onToggle={() => toggleSection('significance')}
        />
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>File Format:</Text>
            <Text style={styles.statValue}>{currentProtein.fileFormat?.toUpperCase() || 'Unknown'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Chains:</Text>
            <Text style={styles.statValue}>{currentProtein.chains.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Residues:</Text>
            <Text style={styles.statValue}>
              {currentProtein.chains.reduce((sum, chain) => sum + chain.residues.length, 0)}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Atoms:</Text>
            <Text style={styles.statValue}>{currentProtein.atoms.length}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray[200],
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[700],
  },
  statsContainer: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[800],
  },
});