import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useProteinStore } from '@/store/proteinStore';
import { parseProteinFile } from '@/utils/proteinParser';
import { generateProteinSummary } from '@/utils/proteinSummary';
import { colors } from '@/constants/colors';
import { Upload, FileText } from 'lucide-react-native';
import { FileFormat } from '@/types/protein';
import * as Haptics from 'expo-haptics';
import { isPdbFile } from '@/utils/fileFormatDetector';
import * as FileSystem from 'expo-file-system';

export default function FileUploader() {
  const { setCurrentProtein, setProteinSummary, setLoading, setError } = useProteinStore();
  const [fileName, setFileName] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<FileFormat | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (fileObj: any) => {
    try {
      setLoading(true);
      setError(null);
      setDetectedFormat(null);
      setFileName(fileObj.name);

      // Check file extension - more permissive now
      const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['pdb', 'cif', 'mmcif', 'mol', 'mol2', 'txt'];
      
      if (!validExtensions.includes(fileExtension || '')) {
        setError(`Unsupported file extension. Please upload a file with one of these extensions: ${validExtensions.join(', ')}`);
        setLoading(false);
        return;
      }
      
      try {
        let fileContent: string;
        
        // Handle file reading differently based on platform
        if (Platform.OS === 'web') {
          // On web, use the File API
          if (fileObj instanceof File) {
            fileContent = await fileObj.text();
          } else {
            // Fallback for older browsers or non-File objects
            const reader = new FileReader();
            fileContent = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsText(fileObj);
            });
          }
        } else {
          // On native, use FileSystem
          if (fileObj.uri) {
            fileContent = await FileSystem.readAsStringAsync(fileObj.uri);
          } else {
            throw new Error("Invalid file object: missing URI");
          }
        }
        
        // Now parse the file content
        const protein = await parseProteinFile(fileContent, fileObj.name);
        
        if (protein) {
          // Store the raw content for rendering
          protein.rawContent = fileContent;
          
          setCurrentProtein(protein);
          setDetectedFormat(protein.fileFormat || null);
          
          // Generate summary
          const summary = await generateProteinSummary(protein);
          setProteinSummary(summary);
          
          // Provide success feedback
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          setError('Failed to parse file. Please check the file format.');
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } catch (error: any) {
        console.error('Error details:', error);
        setError(error.message || 'Failed to parse file.');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('An error occurred while processing the file.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      if (Platform.OS !== 'web') {
        // Provide haptic feedback on mobile
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/octet-stream', 'text/plain', 'chemical/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      await handleFile(file);
    } catch (error) {
      console.error('Error picking document:', error);
      setError('An error occurred while selecting the file.');
    }
  };

  // Web-only drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, []);

  // Handle native file input click
  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  // Trigger file input click
  const openFilePicker = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      pickDocument();
    }
  };

  // Load sample PDB file
  const loadSamplePDB = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Hemoglobin (4HHB) - a well-known protein structure
      const samplePdbUrl = 'https://files.rcsb.org/download/4HHB.pdb';
      
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        // Fetch the file on web
        const response = await fetch(samplePdbUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch sample PDB: ${response.statusText}`);
        }
        fileContent = await response.text();
      } else {
        // Download the file on native
        const downloadResult = await FileSystem.downloadAsync(
          samplePdbUrl,
          FileSystem.cacheDirectory + '4HHB.pdb'
        );
        
        if (downloadResult.status !== 200) {
          throw new Error(`Failed to download sample PDB: ${downloadResult.status}`);
        }
        
        fileContent = await FileSystem.readAsStringAsync(downloadResult.uri);
      }
      
      // Parse the file content
      const protein = await parseProteinFile(fileContent, '4HHB.pdb');
      
      if (protein) {
        // Store the raw content for rendering
        protein.rawContent = fileContent;
        
        setCurrentProtein(protein);
        setDetectedFormat('pdb');
        setFileName('4HHB.pdb (Hemoglobin)');
        
        // Generate summary
        const summary = await generateProteinSummary(protein);
        setProteinSummary(summary);
        
        // Provide success feedback
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setError('Failed to parse sample PDB file.');
      }
    } catch (error: any) {
      console.error('Error loading sample PDB:', error);
      setError(error.message || 'Failed to load sample PDB file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <Pressable 
          style={({ pressed }) => [
            styles.uploadArea,
            isDragging && styles.uploadAreaDragging,
            pressed && styles.uploadButtonPressed
          ]}
          onPress={openFilePicker}
          // @ts-ignore - These props are web-only
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={32} color={isDragging ? colors.primary : colors.gray[500]} />
          <Text style={[styles.uploadText, isDragging && styles.uploadTextDragging]}>
            {isDragging ? 'Drop molecular structure file here' : 'Drag & drop or click to browse'}
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdb,.cif,.mmcif,.mol,.mol2,.txt,text/plain,chemical/x-pdb,chemical/x-cif"
            onChange={handleNativeFileSelect}
            style={{ display: 'none' }}
          />
        </Pressable>
      ) : (
        <Pressable 
          style={({ pressed }) => [
            styles.uploadButton,
            pressed && styles.uploadButtonPressed
          ]}
          onPress={pickDocument}
        >
          <Upload size={24} color={colors.white} />
          <Text style={styles.uploadButtonText}>Upload Structure File</Text>
        </Pressable>
      )}
      
      {fileName && (
        <View style={styles.fileInfo}>
          <View style={styles.fileNameContainer}>
            <FileText size={16} color={colors.gray[600]} />
            <Text style={styles.fileName}>{fileName}</Text>
          </View>
          {detectedFormat && (
            <Text style={styles.formatText}>
              Format: {detectedFormat.toUpperCase()}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.supportedFormats}>
        <Text style={styles.supportedFormatsText}>
          Supported formats: .pdb, .cif, .mmcif, .mol, .mol2
        </Text>
        <Text style={styles.supportedFormatsSubtext}>
          Upload molecular structure files for 3D visualization
        </Text>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.sampleButton,
          pressed && styles.sampleButtonPressed
        ]}
        onPress={loadSamplePDB}
      >
        <Text style={styles.sampleButtonText}>
          Load Sample (Hemoglobin)
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  uploadArea: {
    width: '100%',
    maxWidth: 400,
    height: 180,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.gray[100],
  },
  uploadAreaDragging: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  uploadTextDragging: {
    color: colors.primary,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonPressed: {
    opacity: 0.8,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    width: '100%',
    maxWidth: 400,
  },
  fileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontSize: 14,
    color: colors.gray[800],
    flex: 1,
  },
  formatText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  supportedFormats: {
    marginTop: 12,
    width: '100%',
    maxWidth: 400,
  },
  supportedFormatsText: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
  supportedFormatsSubtext: {
    fontSize: 11,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 2,
  },
  sampleButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.gray[200],
    borderRadius: 6,
  },
  sampleButtonPressed: {
    backgroundColor: colors.gray[300],
  },
  sampleButtonText: {
    fontSize: 14,
    color: colors.gray[800],
  },
});