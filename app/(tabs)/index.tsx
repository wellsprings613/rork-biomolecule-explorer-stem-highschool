import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/constants/colors';
import { ArrowRight, Upload, Search, BookOpen } from 'lucide-react-native';
import FileUploader from '@/components/FileUploader';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Molecular Structure Explorer</Text>
        <Text style={styles.subtitle}>
          Interactive 3D visualization and analysis for educational purposes
        </Text>
      </View>
      
      <View style={styles.uploadSection}>
        <FileUploader />
      </View>
      
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featureCards}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.primary }]}>
              <Upload size={24} color={colors.white} />
            </View>
            <Text style={styles.featureTitle}>Upload & View</Text>
            <Text style={styles.featureDescription}>
              Upload molecular structure files (.pdb, .cif, .mol, .mol2) with automatic format detection
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.secondary }]}>
              <Search size={24} color={colors.white} />
            </View>
            <Text style={styles.featureTitle}>Analyze & Learn</Text>
            <Text style={styles.featureDescription}>
              Explore molecular structures with interactive controls and annotations
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: colors.protein.helix }]}>
              <BookOpen size={24} color={colors.white} />
            </View>
            <Text style={styles.featureTitle}>Educational Insights</Text>
            <Text style={styles.featureDescription}>
              Get plain-language summaries and explanations of molecular structures
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.formatSection}>
        <Text style={styles.sectionTitle}>Supported Formats</Text>
        <View style={styles.formatGrid}>
          <View style={styles.formatCard}>
            <Text style={styles.formatName}>.pdb</Text>
            <Text style={styles.formatDescription}>Protein Data Bank</Text>
          </View>
          <View style={styles.formatCard}>
            <Text style={styles.formatName}>.cif</Text>
            <Text style={styles.formatDescription}>Crystallographic Information File</Text>
          </View>
          <View style={styles.formatCard}>
            <Text style={styles.formatName}>.mol</Text>
            <Text style={styles.formatDescription}>MDL Molfile</Text>
          </View>
          <View style={styles.formatCard}>
            <Text style={styles.formatName}>.mol2</Text>
            <Text style={styles.formatDescription}>Tripos Mol2</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.getStartedSection}>
        <Text style={styles.getStartedTitle}>Ready to explore?</Text>
        <Text style={styles.getStartedDescription}>
          Upload a molecular structure file or go to the viewer to see examples
        </Text>
        <Link href="/viewer" asChild>
          <Pressable style={styles.getStartedButton}>
            <Text style={styles.getStartedButtonText}>Go to Viewer</Text>
            <ArrowRight size={20} color={colors.white} />
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    maxWidth: 300,
  },
  uploadSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  featureCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
  formatSection: {
    marginBottom: 32,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  formatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  getStartedSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  getStartedDescription: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});