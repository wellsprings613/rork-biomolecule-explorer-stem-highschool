import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { useProteinStore } from '@/store/proteinStore';
import ProteinViewer from '@/components/ProteinViewer';
import ProteinInfoSidebar from '@/components/ProteinInfoSidebar';
import AnnotationControls from '@/components/AnnotationControls';
import ViewerControls from '@/components/ViewerControls';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorMessage from '@/components/ErrorMessage';
import FileUploader from '@/components/FileUploader';

export default function ViewerScreen() {
  const { width } = useWindowDimensions();
  const { currentProtein, isLoading, error, setError } = useProteinStore();
  const isWideScreen = width > 768;

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} message="Processing protein structure..." />
      
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}
      
      {isWideScreen ? (
        <View style={styles.wideLayout}>
          <View style={styles.viewerContainer}>
            <ProteinViewer />
            <ViewerControls />
            <AnnotationControls />
          </View>
          
          <View style={styles.sidebarContainer}>
            {!currentProtein && (
              <View style={styles.uploadContainer}>
                <FileUploader />
              </View>
            )}
            {currentProtein && <ProteinInfoSidebar />}
          </View>
        </View>
      ) : (
        <View style={styles.narrowLayout}>
          {!currentProtein ? (
            <View style={styles.uploadContainer}>
              <FileUploader />
            </View>
          ) : (
            <>
              <ProteinViewer />
              <ViewerControls />
              <AnnotationControls />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  wideLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  narrowLayout: {
    flex: 1,
  },
  viewerContainer: {
    flex: 3,
  },
  sidebarContainer: {
    flex: 1,
    maxWidth: 350,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});