import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useProteinStore } from '@/store/proteinStore';
import { colors } from '@/constants/colors';

export default function AnnotationControls() {
  const { annotations, toggleAnnotation } = useProteinStore();

  const AnnotationToggle = ({ 
    label, 
    value, 
    onToggle, 
    color 
  }: { 
    label: string; 
    value: boolean; 
    onToggle: () => void; 
    color: string;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.labelContainer}>
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray[300], true: color }}
        thumbColor={value ? colors.white : colors.white}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Annotations</Text>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Secondary Structure</Text>
          <AnnotationToggle
            label="Alpha Helices"
            value={annotations.showHelices}
            onToggle={() => toggleAnnotation('showHelices')}
            color={colors.protein.helix}
          />
          <AnnotationToggle
            label="Beta Sheets"
            value={annotations.showSheets}
            onToggle={() => toggleAnnotation('showSheets')}
            color={colors.protein.sheet}
          />
          <AnnotationToggle
            label="Loops"
            value={annotations.showLoops}
            onToggle={() => toggleAnnotation('showLoops')}
            color={colors.protein.loop}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Functional Regions</Text>
          <AnnotationToggle
            label="Binding Sites"
            value={annotations.showBindingSites}
            onToggle={() => toggleAnnotation('showBindingSites')}
            color={colors.protein.binding}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Properties</Text>
          <AnnotationToggle
            label="Hydrophobic"
            value={annotations.showHydrophobic}
            onToggle={() => toggleAnnotation('showHydrophobic')}
            color={colors.protein.hydrophobic}
          />
          <AnnotationToggle
            label="Hydrophilic"
            value={annotations.showHydrophilic}
            onToggle={() => toggleAnnotation('showHydrophilic')}
            color={colors.protein.hydrophilic}
          />
          <AnnotationToggle
            label="Charged"
            value={annotations.showCharged}
            onToggle={() => toggleAnnotation('showCharged')}
            color={colors.protein.charged}
          />
          <AnnotationToggle
            label="Neutral"
            value={annotations.showNeutral}
            onToggle={() => toggleAnnotation('showNeutral')}
            color={colors.protein.neutral}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: 300,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.gray[700],
  },
});