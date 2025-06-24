import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useProteinStore } from '@/store/proteinStore';
import { colors } from '@/constants/colors';
import { WebView } from 'react-native-webview';

// NGL Viewer HTML template for WebView
const nglViewerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NGL Viewer</title>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
    #viewport { width: 100%; height: 100%; }
  </style>
  <script src="https://unpkg.com/ngl@2.0.0-dev.37/dist/ngl.js"></script>
</head>
<body>
  <div id="viewport"></div>
  <script>
    // Create NGL Stage object
    const stage = new NGL.Stage("viewport");
    
    // Handle background color
    stage.setParameters({ backgroundColor: "white" });
    
    // Handle messages from React Native
    window.addEventListener('message', function(event) {
      const data = JSON.parse(event.data);
      
      if (data.type === 'loadPDB') {
        // Clear any existing structures
        stage.removeAllComponents();
        
        // Load PDB data
        if (data.format === 'pdb') {
          stage.loadFile(new Blob([data.content], {type: 'text/plain'}), { ext: 'pdb' })
            .then(function(component) {
              // Apply representation based on settings
              applyRepresentation(component, data.representation, data.colorScheme);
              
              // Auto zoom to fit the structure
              stage.autoView();
              
              // Send success message back to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loadSuccess',
                message: 'Structure loaded successfully'
              }));
            })
            .catch(function(error) {
              // Send error message back to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loadError',
                message: error.message
              }));
            });
        } else if (data.format === 'cif') {
          stage.loadFile(new Blob([data.content], {type: 'text/plain'}), { ext: 'cif' })
            .then(function(component) {
              // Apply representation based on settings
              applyRepresentation(component, data.representation, data.colorScheme);
              
              // Auto zoom to fit the structure
              stage.autoView();
              
              // Send success message back to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loadSuccess',
                message: 'Structure loaded successfully'
              }));
            })
            .catch(function(error) {
              // Send error message back to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loadError',
                message: error.message
              }));
            });
        }
      } else if (data.type === 'updateRepresentation') {
        // Update representation for all components
        stage.eachComponent(function(component) {
          component.removeAllRepresentations();
          applyRepresentation(component, data.representation, data.colorScheme);
        });
      } else if (data.type === 'updateBackground') {
        // Update background color
        stage.setParameters({ backgroundColor: data.color });
      } else if (data.type === 'resetView') {
        // Reset view to default
        stage.autoView();
      }
    });
    
    // Helper function to apply representation and color scheme
    function applyRepresentation(component, representation, colorScheme) {
      // Remove existing representations
      component.removeAllRepresentations();
      
      // Apply color scheme
      let colorSchemeParams = {};
      switch (colorScheme) {
        case 'chain':
          colorSchemeParams = { color: 'chainid' };
          break;
        case 'residue':
          colorSchemeParams = { color: 'resname' };
          break;
        case 'structure':
          colorSchemeParams = { color: 'sstruc' };
          break;
        case 'custom':
          // Custom color scheme for different structural elements
          component.addRepresentation('cartoon', {
            color: 'sstruc',
            aspectRatio: 3.0,
            scale: 1.5
          });
          return;
        default:
          colorSchemeParams = { color: 'chainid' };
      }
      
      // Apply representation
      switch (representation) {
        case 'cartoon':
          component.addRepresentation('cartoon', {
            ...colorSchemeParams,
            aspectRatio: 3.0,
            scale: 1.5
          });
          break;
        case 'ball-and-stick':
          component.addRepresentation('ball+stick', {
            ...colorSchemeParams,
            multipleBond: true,
            scale: 0.75
          });
          break;
        case 'space-filling':
          component.addRepresentation('spacefill', {
            ...colorSchemeParams,
            scale: 0.8
          });
          break;
        case 'ribbon':
          component.addRepresentation('ribbon', {
            ...colorSchemeParams,
            scale: 1.0
          });
          break;
        default:
          component.addRepresentation('cartoon', colorSchemeParams);
      }
      
      // Add labels for binding sites if they exist
      if (representation !== 'space-filling') {
        component.addRepresentation('ball+stick', {
          sele: 'ligand',
          scale: 0.6,
          color: 'element'
        });
      }
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
      stage.handleResize();
    });
    
    // Initial setup
    stage.handleResize();
    
    // Send ready message to React Native
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'viewerReady',
      message: 'NGL Viewer is ready'
    }));
  </script>
</body>
</html>
`;

export default function ProteinViewer() {
  const { currentProtein, annotations, viewerSettings } = useProteinStore();
  const webViewRef = useRef<WebView>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription.remove();
  }, []);

  // Handle messages from the WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'viewerReady':
          setViewerReady(true);
          loadProteinStructure();
          break;
        case 'loadSuccess':
          setViewerError(null);
          break;
        case 'loadError':
          setViewerError(data.message);
          break;
        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Load protein structure when currentProtein changes or viewer is ready
  const loadProteinStructure = () => {
    if (!currentProtein || !viewerReady || !webViewRef.current) return;

    // Get the raw PDB content from the currentProtein
    // In a real app, you would need to convert your protein structure back to PDB format
    // For this example, we'll assume the raw content is stored somewhere
    const pdbContent = generatePDBContent(currentProtein);
    
    // Send the PDB content to the WebView
    webViewRef.current.postMessage(JSON.stringify({
      type: 'loadPDB',
      content: pdbContent,
      format: currentProtein.fileFormat || 'pdb',
      representation: viewerSettings.representation,
      colorScheme: viewerSettings.colorScheme,
    }));
  };

  // Update viewer settings when they change
  useEffect(() => {
    if (!viewerReady || !webViewRef.current || !currentProtein) return;
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'updateRepresentation',
      representation: viewerSettings.representation,
      colorScheme: viewerSettings.colorScheme,
    }));
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'updateBackground',
      color: viewerSettings.backgroundColor,
    }));
  }, [viewerSettings, viewerReady, currentProtein]);

  // Load protein structure when it changes
  useEffect(() => {
    loadProteinStructure();
  }, [currentProtein, viewerReady]);

  // Generate PDB content from protein structure
  // This is a simplified version - in a real app, you would need a more sophisticated conversion
  const generatePDBContent = (protein: any): string => {
    if (!protein) return '';
    
    // For demo purposes, we'll generate a simple PDB file
    let pdbContent = '';
    
    // Add header
    pdbContent += `HEADER    ${protein.name}\n`;
    pdbContent += `TITLE     ${protein.description || 'No description'}\n`;
    
    // Add atoms
    protein.atoms.forEach((atom: any) => {
      // Format according to PDB standard
      const atomLine = `ATOM  ${atom.id.toString().padStart(5, ' ')} ${atom.element.padEnd(4, ' ')} ${atom.residue.padEnd(3, ' ')} ${atom.chain}${atom.residueNumber.toString().padStart(4, ' ')}    ${atom.x.toFixed(3).padStart(8, ' ')} ${atom.y.toFixed(3).padStart(8, ' ')} ${atom.z.toFixed(3).padStart(8, ' ')}  1.00  0.00           ${atom.element.padEnd(2, ' ')}\n`;
      pdbContent += atomLine;
    });
    
    // Add end
    pdbContent += 'END\n';
    
    return pdbContent;
  };

  // If no protein is loaded, show placeholder
  if (!currentProtein) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Upload a protein structure file to view it here
        </Text>
      </View>
    );
  }

  // Render the 3D viewer using WebView
  return (
    <View style={styles.container}>
      <View style={styles.viewerContainer}>
        {Platform.OS === 'web' ? (
          // For web, use an iframe with the NGL Viewer
          <iframe
            src={"data:text/html;charset=utf-8," + encodeURIComponent(nglViewerHTML)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: viewerSettings.backgroundColor,
            }}
            title="Protein Viewer"
          />
        ) : (
          // For native, use WebView
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: nglViewerHTML }}
            style={{ backgroundColor: viewerSettings.backgroundColor }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
        
        {/* Overlay with annotation information */}
        <View style={styles.annotationOverlay}>
          <Text style={styles.annotationText}>
            {currentProtein.name}
          </Text>
          
          {/* Legend for visible annotations */}
          <View style={styles.legend}>
            {annotations.showHelices && (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.protein.helix }]} />
                <Text style={styles.legendText}>Alpha Helices</Text>
              </View>
            )}
            
            {annotations.showSheets && (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.protein.sheet }]} />
                <Text style={styles.legendText}>Beta Sheets</Text>
              </View>
            )}
            
            {annotations.showBindingSites && (
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: colors.protein.binding }]} />
                <Text style={styles.legendText}>Binding Sites</Text>
              </View>
            )}
          </View>
          
          {viewerError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{viewerError}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  viewerContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  annotationOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 12,
  },
  annotationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.gray[800],
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: `${colors.error}20`,
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
  },
});