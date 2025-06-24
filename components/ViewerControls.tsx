import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useProteinStore } from '@/store/proteinStore';
import { colors } from '@/constants/colors';
import { RotateCcw, ZoomIn, ZoomOut, Move, Maximize2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function ViewerControls() {
  const { viewerSettings, updateViewerSettings } = useProteinStore();
  const webViewRef = React.useRef<any>(null);

  const representations = [
    { id: 'cartoon', label: 'Cartoon' },
    { id: 'ball-and-stick', label: 'Ball & Stick' },
    { id: 'space-filling', label: 'Space Filling' },
    { id: 'ribbon', label: 'Ribbon' },
  ] as const;

  const colorSchemes = [
    { id: 'chain', label: 'By Chain' },
    { id: 'residue', label: 'By Residue' },
    { id: 'structure', label: 'By Structure' },
    { id: 'custom', label: 'Custom' },
  ] as const;

  const handleControlAction = (action: string) => {
    // Provide haptic feedback on mobile
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Send messages to the WebView to control the 3D viewer
    const message = { type: action };
    
    if (Platform.OS === 'web') {
      // For web, post message to iframe
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify(message), '*');
      }
    }
    
    // The actual control actions will be handled by the WebView
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        <Pressable 
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed
          ]}
          onPress={() => handleControlAction('resetView')}
        >
          <RotateCcw size={20} color={colors.gray[700]} />
        </Pressable>
        <Pressable 
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed
          ]}
          onPress={() => handleControlAction('zoomIn')}
        >
          <ZoomIn size={20} color={colors.gray[700]} />
        </Pressable>
        <Pressable 
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed
          ]}
          onPress={() => handleControlAction('zoomOut')}
        >
          <ZoomOut size={20} color={colors.gray[700]} />
        </Pressable>
        <Pressable 
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed
          ]}
          onPress={() => handleControlAction('move')}
        >
          <Move size={20} color={colors.gray[700]} />
        </Pressable>
        <Pressable 
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlButtonPressed
          ]}
          onPress={() => handleControlAction('fullscreen')}
        >
          <Maximize2 size={20} color={colors.gray[700]} />
        </Pressable>
      </View>
      
      <View style={styles.optionsContainer}>
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Representation</Text>
          <View style={styles.optionButtons}>
            {representations.map((rep) => (
              <Pressable
                key={rep.id}
                style={({ pressed }) => [
                  styles.optionButton,
                  viewerSettings.representation === rep.id && styles.optionButtonActive,
                  pressed && styles.optionButtonPressed
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  updateViewerSettings({ representation: rep.id });
                  
                  // Also send direct message to update immediately
                  if (Platform.OS === 'web') {
                    const iframe = document.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.postMessage(JSON.stringify({
                        type: 'updateRepresentation',
                        representation: rep.id,
                        colorScheme: viewerSettings.colorScheme
                      }), '*');
                    }
                  }
                }}
              >
                <Text 
                  style={[
                    styles.optionButtonText,
                    viewerSettings.representation === rep.id && styles.optionButtonTextActive
                  ]}
                >
                  {rep.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        <View style={styles.optionGroup}>
          <Text style={styles.optionLabel}>Color Scheme</Text>
          <View style={styles.optionButtons}>
            {colorSchemes.map((scheme) => (
              <Pressable
                key={scheme.id}
                style={({ pressed }) => [
                  styles.optionButton,
                  viewerSettings.colorScheme === scheme.id && styles.optionButtonActive,
                  pressed && styles.optionButtonPressed
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  updateViewerSettings({ colorScheme: scheme.id });
                  
                  // Also send direct message to update immediately
                  if (Platform.OS === 'web') {
                    const iframe = document.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                      iframe.contentWindow.postMessage(JSON.stringify({
                        type: 'updateRepresentation',
                        representation: viewerSettings.representation,
                        colorScheme: scheme.id
                      }), '*');
                    }
                  }
                }}
              >
                <Text 
                  style={[
                    styles.optionButtonText,
                    viewerSettings.colorScheme === scheme.id && styles.optionButtonTextActive
                  ]}
                >
                  {scheme.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
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
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  controlButtonPressed: {
    backgroundColor: colors.gray[200],
  },
  optionsContainer: {
    gap: 16,
  },
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonPressed: {
    opacity: 0.8,
  },
  optionButtonText: {
    fontSize: 12,
    color: colors.gray[800],
  },
  optionButtonTextActive: {
    color: colors.white,
  },
});