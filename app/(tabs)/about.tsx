import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { ExternalLink, Mail, Github, BookOpen } from 'lucide-react-native';

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>About This App</Text>
        <Text style={styles.subtitle}>
          A bio-educational tool for exploring molecular structures
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purpose</Text>
        <Text style={styles.sectionText}>
          This application was designed to help students and educators visualize and understand molecular structures in an interactive way. It provides tools for exploring 3D models, identifying structural features, and learning about their biological significance.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Automatic file format detection for PDB, mmCIF, MOL, and MOL2 files</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Interactive 3D visualization with zoom, rotate, and pan controls</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Highlight structural elements like alpha helices and beta sheets</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Identify functional regions such as binding sites</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Generate plain-language summaries of molecular structures</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureBullet} />
            <Text style={styles.featureText}>Export summaries for educational use</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supported File Formats</Text>
        <View style={styles.formatList}>
          <View style={styles.formatItem}>
            <Text style={styles.formatName}>.pdb</Text>
            <Text style={styles.formatDescription}>Protein Data Bank format - standard for 3D structural data of proteins and nucleic acids</Text>
          </View>
          <View style={styles.formatItem}>
            <Text style={styles.formatName}>.cif / .mmcif</Text>
            <Text style={styles.formatDescription}>Crystallographic Information File - modern alternative to PDB format with richer data representation</Text>
          </View>
          <View style={styles.formatItem}>
            <Text style={styles.formatName}>.mol</Text>
            <Text style={styles.formatDescription}>MDL Molfile - contains information about atoms, bonds, connectivity and coordinates</Text>
          </View>
          <View style={styles.formatItem}>
            <Text style={styles.formatName}>.mol2</Text>
            <Text style={styles.formatDescription}>Tripos Mol2 - extended format with atom types and partial charges</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Use</Text>
        <Text style={styles.sectionText}>
          1. Upload a molecular structure file from the Home or Viewer screen.
        </Text>
        <Text style={styles.sectionText}>
          2. The app will automatically detect the file format and parse it accordingly.
        </Text>
        <Text style={styles.sectionText}>
          3. Use the viewer controls to rotate, zoom, and pan the 3D model.
        </Text>
        <Text style={styles.sectionText}>
          4. Toggle annotations to highlight different structural features.
        </Text>
        <Text style={styles.sectionText}>
          5. Read the generated summary to understand the structure and function.
        </Text>
        <Text style={styles.sectionText}>
          6. Export the summary for your notes or assignments.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <Pressable 
          style={styles.resourceLink}
          onPress={() => openLink('https://www.rcsb.org/')}
        >
          <ExternalLink size={16} color={colors.primary} />
          <Text style={styles.resourceLinkText}>RCSB Protein Data Bank</Text>
        </Pressable>
        <Pressable 
          style={styles.resourceLink}
          onPress={() => openLink('https://pdb101.rcsb.org/')}
        >
          <ExternalLink size={16} color={colors.primary} />
          <Text style={styles.resourceLinkText}>PDB-101 Educational Resources</Text>
        </Pressable>
        <Pressable 
          style={styles.resourceLink}
          onPress={() => openLink('https://molstar.org/')}
        >
          <ExternalLink size={16} color={colors.primary} />
          <Text style={styles.resourceLinkText}>Mol* Viewer Documentation</Text>
        </Pressable>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Created for educational purposes. All molecular data is processed locally on your device.
        </Text>
        <View style={styles.footerLinks}>
          <Pressable style={styles.footerLink}>
            <Mail size={20} color={colors.gray[600]} />
          </Pressable>
          <Pressable style={styles.footerLink}>
            <Github size={20} color={colors.gray[600]} />
          </Pressable>
          <Pressable style={styles.footerLink}>
            <BookOpen size={20} color={colors.gray[600]} />
          </Pressable>
        </View>
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
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 8,
    lineHeight: 20,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  formatList: {
    gap: 12,
  },
  formatItem: {
    marginBottom: 8,
  },
  formatName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  formatDescription: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  resourceLinkText: {
    fontSize: 14,
    color: colors.primary,
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
  },
  footerLink: {
    padding: 8,
  },
});