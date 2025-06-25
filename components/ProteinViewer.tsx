import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Pressable } from 'react-native';
import { useProteinStore } from '@/store/proteinStore';
import { colors } from '@/constants/colors';
import { WebView } from 'react-native-webview';
import { RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Sample PDB data for testing when no protein is loaded
const SAMPLE_PDB = `HEADER    HYDROLASE                               23-FEB-81   1EST
TITLE     THE STRUCTURE OF NATIVE PORCINE PANCREATIC ELASTASE AT 1.65 ANGSTROMS
TITLE    2 RESOLUTION
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: ELASTASE;
COMPND   3 CHAIN: A;
COMPND   4 EC: 3.4.21.36
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: SUS SCROFA;
SOURCE   3 ORGANISM_COMMON: PIG;
SOURCE   4 ORGAN: PANCREAS
ATOM      1  N   ALA A   1      21.709  34.298  37.631  1.00 18.04           N  
ATOM      2  CA  ALA A   1      22.403  33.801  36.438  1.00 16.23           C  
ATOM      3  C   ALA A   1      23.895  33.722  36.679  1.00 14.30           C  
ATOM      4  O   ALA A   1      24.334  33.311  37.754  1.00 14.99           O  
ATOM      5  CB  ALA A   1      21.843  32.446  36.036  1.00 16.55           C  
ATOM      6  N   VAL A   2      24.698  34.116  35.693  1.00 12.71           N  
ATOM      7  CA  VAL A   2      26.151  34.089  35.784  1.00 11.42           C  
ATOM      8  C   VAL A   2      26.733  32.810  35.183  1.00 10.86           C  
ATOM      9  O   VAL A   2      26.313  32.350  34.121  1.00 11.46           O  
ATOM     10  CB  VAL A   2      26.792  35.289  35.062  1.00 11.47           C  
ATOM     11  CG1 VAL A   2      28.294  35.262  35.178  1.00 11.81           C  
ATOM     12  CG2 VAL A   2      26.242  36.591  35.623  1.00 12.61           C  
ATOM     13  N   LEU A   3      27.686  32.236  35.904  1.00 10.28           N  
ATOM     14  CA  LEU A   3      28.333  31.020  35.442  1.00  9.66           C  
ATOM     15  C   LEU A   3      29.830  31.230  35.336  1.00  9.39           C  
ATOM     16  O   LEU A   3      30.450  31.881  36.178  1.00 10.53           O  
ATOM     17  CB  LEU A   3      28.035  29.871  36.407  1.00 10.42           C  
ATOM     18  CG  LEU A   3      26.614  29.318  36.453  1.00 11.07           C  
ATOM     19  CD1 LEU A   3      26.402  28.454  37.683  1.00 12.11           C  
ATOM     20  CD2 LEU A   3      26.328  28.553  35.174  1.00 11.95           C  
END
`;

// Improved NGL Viewer HTML template for WebView with better initialization and error handling
const nglViewerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>NGL Protein Viewer</title>
  <style>
    html, body { 
      margin: 0; 
      padding: 0; 
      overflow: hidden; 
      width: 100%; 
      height: 100%; 
      touch-action: none;
    }
    #viewport { 
      width: 100%; 
      height: 100%; 
      position: absolute;
      top: 0;
      left: 0;
    }
    #loading { 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%);
      font-family: sans-serif;
      font-size: 16px;
      color: #333;
      z-index: 10;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 20px;
      border-radius: 10px;
    }
    #error {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      background-color: rgba(255, 82, 82, 0.9);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: sans-serif;
      font-size: 14px;
      display: none;
      z-index: 20;
    }
  </style>
  <script src="https://unpkg.com/ngl@2.0.0/dist/ngl.js"></script>
</head>
<body>
  <div id="viewport"></div>
  <div id="loading">Loading molecular viewer...</div>
  <div id="error"></div>
  
  <script>
    // Debug function
    function debug(message) {
      console.log("[NGL Debug]:", message);
      
      // Send debug info to React Native
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug',
          message: message
        }));
      } catch (e) {
        console.error('Failed to send debug message:', e);
      }
    }
    
    // Show error
    function showError(message) {
      const errorEl = document.getElementById('error');
      errorEl.style.display = 'block';
      errorEl.textContent = message;
      console.error("[NGL Error]:", message);
      
      // Send error to React Native
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'loadError',
          message: message
        }));
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    }
    
    // Hide loading indicator
    function hideLoading() {
      document.getElementById('loading').style.display = 'none';
    }
    
    // Create NGL Stage object
    let stage;
    let currentComponent = null;
    
    try {
      debug("Initializing NGL Stage");
      stage = new NGL.Stage("viewport", { backgroundColor: "white" });
      debug("NGL Stage initialized successfully");
      hideLoading();
      
      // Send ready message to React Native
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'viewerReady',
          message: 'NGL Viewer is ready'
        }));
      } catch (e) {
        debug('ReactNativeWebView not available: ' + e.message);
      }
      
      // Handle window resize
      window.addEventListener('resize', function() {
        if (stage) {
          debug("Window resized, handling resize");
          stage.handleResize();
        }
      });
      
      // Initial setup - load sample structure if no data is provided within 2 seconds
      setTimeout(function() {
        if (stage.compList.length === 0) {
          debug('No structure loaded after timeout, loading sample structure');
          loadSampleStructure();
        }
      }, 2000);
      
    } catch (e) {
      showError('Failed to initialize NGL Viewer: ' + e.message);
      console.error("NGL initialization error:", e);
    }
    
    // Helper function to apply representation and color scheme
    function applyRepresentation(component, representation, colorScheme) {
      if (!component) {
        debug("Cannot apply representation: component is null");
        return;
      }
      
      debug("Applying representation: " + representation + ", colorScheme: " + colorScheme);
      
      // Store current component for later reference
      currentComponent = component;
      
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
            scale: 1.0,
            opacity: 0.9
          });
          break;
        default:
          component.addRepresentation('cartoon', colorSchemeParams);
      }
      
      // Ensure proper view
      stage.autoView();
    }
    
    // Load a sample structure for testing
    function loadSampleStructure() {
      debug('Loading sample structure');
      if (!stage) {
        showError("Cannot load sample: NGL Stage not initialized");
        return;
      }
      
      stage.removeAllComponents();
      currentComponent = null;
      
      try {
        // Try to load a standard PDB from RCSB
        debug("Attempting to load 1MBN from RCSB");
        stage.loadFile("rcsb://1MBN", { defaultRepresentation: false })
          .then(function(component) {
            debug("Successfully loaded 1MBN");
            currentComponent = component;
            applyRepresentation(component, 'cartoon', 'structure');
            
            // Send success message
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'loadSuccess',
              message: 'Sample structure loaded successfully'
            }));
          })
          .catch(function(error) {
            debug('Failed to load 1MBN, trying fallback: ' + error.message);
            
            // Try loading a simple PDB structure
            stage.loadFile(new Blob([
              "HEADER    SAMPLE STRUCTURE
" +
              "ATOM      1  N   ALA A   1      21.709  34.298  37.631  1.00 18.04           N  
" +
              "ATOM      2  CA  ALA A   1      22.403  33.801  36.438  1.00 16.23           C  
" +
              "ATOM      3  C   ALA A   1      23.895  33.722  36.679  1.00 14.30           C  
" +
              "ATOM      4  O   ALA A   1      24.334  33.311  37.754  1.00 14.99           O  
" +
              "ATOM      5  CB  ALA A   1      21.843  32.446  36.036  1.00 16.55           C  
" +
              "ATOM      6  N   VAL A   2      24.698  34.116  35.693  1.00 12.71           N  
" +
              "ATOM      7  CA  VAL A   2      26.151  34.089  35.784  1.00 11.42           C  
" +
              "ATOM      8  C   VAL A   2      26.733  32.810  35.183  1.00 10.86           C  
" +
              "ATOM      9  O   VAL A   2      26.313  32.350  34.121  1.00 11.46           O  
" +
              "ATOM     10  CB  VAL A   2      26.792  35.289  35.062  1.00 11.47           C  
" +
              "END
"
            ], {type: 'text/plain'}), { ext: 'pdb', defaultRepresentation: false })
              .then(function(component) {
                debug("Successfully loaded fallback structure");
                currentComponent = component;
                applyRepresentation(component, 'cartoon', 'structure');
                
                // Send success message
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'loadSuccess',
                  message: 'Sample structure loaded successfully'
                }));
              })
              .catch(function(error) {
                showError('Failed to load sample structure: ' + error.message);
              });
          });
      } catch (e) {
        showError('Error in loadSampleStructure: ' + e.message);
      }
    }
    
    // Handle messages from React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        debug('Received message: ' + data.type);
        
        if (data.type === 'loadPDB') {
          // Clear any existing structures
          if (!stage) {
            showError("Cannot load PDB: NGL Stage not initialized");
            return;
          }
          
          stage.removeAllComponents();
          currentComponent = null;
          
          // Show loading indicator
          document.getElementById('loading').style.display = 'block';
          
          // Load PDB data
          const format = data.format || 'pdb';
          const ext = format === 'cif' ? 'cif' : (format === 'mol2' ? 'mol2' : 'pdb');
          
          debug('Loading structure: format=' + format + ', ext=' + ext + ', content length=' + data.content.length);
          
          // Create a blob with the content
          const blob = new Blob([data.content], {
            type: format === 'pdb' ? 'chemical/x-pdb' : 
                 (format === 'cif' ? 'chemical/x-cif' : 'chemical/x-mol')
          });
          
          debug("Created blob, now loading file");
          
          // Load the file
          stage.loadFile(blob, { 
            ext: ext,
            defaultRepresentation: false
          })
            .then(function(component) {
              // Hide loading indicator
              hideLoading();
              
              debug("Structure loaded successfully, applying representation");
              
              // Apply representation based on settings
              applyRepresentation(component, data.representation || 'cartoon', data.colorScheme || 'structure');
              
              // Send success message back to React Native
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loadSuccess',
                message: 'Structure loaded successfully'
              }));
              
              debug('Structure loaded and displayed successfully');
            })
            .catch(function(error) {
              hideLoading();
              debug('Failed to load structure: ' + error.message + '. Trying alternative loading method...');
              
              // Try alternative loading method
              try {
                // Try loading as string
                debug("Attempting to load as plain text");
                stage.loadFile(new Blob([data.content], {type: 'text/plain'}), { 
                  ext: ext,
                  defaultRepresentation: false
                }).then(function(component) {
                  debug("Alternative loading method succeeded");
                  applyRepresentation(component, 'ball-and-stick', 'element'); // Fallback to simpler representation
                  
                  // Send success message
                  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'loadSuccess',
                    message: 'Structure loaded with alternative method'
                  }));
                }).catch(function(error) {
                  debug("Alternative loading method failed: " + error.message);
                  showError('Failed to load structure: ' + error.message);
                });
              } catch (e) {
                debug("Error in alternative loading method: " + e.message);
                showError('Failed to load structure: ' + e.message);
              }
            });
        } else if (data.type === 'updateRepresentation') {
          // Update representation for all components
          if (currentComponent) {
            applyRepresentation(currentComponent, data.representation, data.colorScheme);
            debug('Updated representation: ' + data.representation + ', colorScheme: ' + data.colorScheme);
          } else {
            debug('No component to update representation');
          }
        } else if (data.type === 'updateBackground') {
          // Update background color
          if (stage) {
            stage.setParameters({ backgroundColor: data.color });
            debug('Updated background color: ' + data.color);
          }
        } else if (data.type === 'resetView') {
          // Reset view to default
          if (stage) {
            stage.autoView();
            debug('Reset view');
          }
        } else if (data.type === 'loadSample') {
          // Load sample structure
          loadSampleStructure();
        } else if (data.type === 'zoomIn') {
          if (stage && stage.viewer) {
            stage.viewer.zoom(1.2);
            debug('Zoomed in');
          }
        } else if (data.type === 'zoomOut') {
          if (stage && stage.viewer) {
            stage.viewer.zoom(0.8);
            debug('Zoomed out');
          }
        } else if (data.type === 'toggleRotation') {
          if (stage) {
            const currentSpin = stage.getParameters().spin;
            stage.setParameters({ spin: !currentSpin });
            debug(currentSpin ? 'Stopped rotation' : 'Started rotation');
          }
        } else if (data.type === 'fullscreen') {
          if (document.documentElement) {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(err => {
                debug('Failed to enter fullscreen: ' + err.message);
              });
              debug('Entered fullscreen');
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                  debug('Failed to exit fullscreen: ' + err.message);
                });
                debug('Exited fullscreen');
              }
            }
          }
        }
      } catch (error) {
        showError('Error processing message: ' + error.message);
      }
    });
  </script>
</body>
</html>
`;

export default function ProteinViewer() {
  const { currentProtein, annotations, viewerSettings } = useProteinStore();
  const webViewRef = useRef<WebView>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
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
          console.log('Viewer ready');
          setViewerReady(true);
          break;
        case 'loadSuccess':
          console.log('Load success:', data.message);
          setViewerError(null);
          break;
        case 'loadError':
          console.error('Load error:', data.message);
          setViewerError(data.message);
          break;
        case 'debug':
          console.log('Debug:', data.message);
          setDebugInfo(data.message);
          break;
        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Load protein structure when currentProtein changes or viewer is ready
  useEffect(() => {
    if (!viewerReady || !webViewRef.current) return;
    
    console.log('Viewer ready and ref available, checking for protein data');
    
    if (currentProtein && currentProtein.rawContent) {
      console.log('Current protein available, loading structure');
      loadProteinStructure();
    } else {
      console.log('No protein data, loading sample structure');
      // Load sample structure if no protein is loaded
      webViewRef.current.postMessage(JSON.stringify({
        type: 'loadSample'
      }));
    }
  }, [currentProtein, viewerReady]);

  // Update viewer settings when they change
  useEffect(() => {
    if (!viewerReady || !webViewRef.current) return;
    
    console.log('Updating viewer settings');
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'updateRepresentation',
      representation: viewerSettings.representation,
      colorScheme: viewerSettings.colorScheme,
    }));
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'updateBackground',
      color: viewerSettings.backgroundColor,
    }));
  }, [viewerSettings, viewerReady]);

  // Load protein structure
  const loadProteinStructure = () => {
    if (!currentProtein || !viewerReady || !webViewRef.current) {
      console.error('Cannot load protein structure: missing dependencies');
      return;
    }

    console.log('Loading protein structure:', currentProtein.name);
    
    // Use the raw content if available, otherwise generate PDB content
    const content = currentProtein.rawContent || generatePDBContent(currentProtein);
    
    if (!content) {
      setViewerError("Failed to generate protein structure content");
      return;
    }
    
    console.log('Sending content to WebView, length:', content.length);
    
    // Send the content to the WebView
    webViewRef.current.postMessage(JSON.stringify({
      type: 'loadPDB',
      content: content,
      format: currentProtein.fileFormat || 'pdb',
      representation: viewerSettings.representation,
      colorScheme: viewerSettings.colorScheme,
    }));
  };

  // Reset camera view
  const resetView = () => {
    if (!viewerReady || !webViewRef.current) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'resetView'
    }));
  };

  // Generate PDB content from protein structure
  const generatePDBContent = (protein: any): string => {
    if (!protein) return SAMPLE_PDB;
    
    // If the protein has raw content, use it
    if (protein.rawContent) {
      return protein.rawContent;
    }
    
    // Otherwise, generate a PDB file from the protein structure
    let pdbContent = '';
    
    // Add header
    pdbContent += `HEADER    ${protein.name || 'UNKNOWN'}
`;
    pdbContent += `TITLE     ${protein.description || 'No description'}
`;
    
    // Add atoms
    if (protein.atoms && protein.atoms.length > 0) {
      protein.atoms.forEach((atom: any, index: number) => {
        // Format according to PDB standard
        const atomId = atom.id || index + 1;
        const atomName = atom.element.padEnd(4, ' ');
        const resName = atom.residue.padEnd(3, ' ');
        const chainId = atom.chain || 'A';
        const resNum = atom.residueNumber || 1;
        const x = (atom.x || 0).toFixed(3).padStart(8, ' ');
        const y = (atom.y || 0).toFixed(3).padStart(8, ' ');
        const z = (atom.z || 0).toFixed(3).padStart(8, ' ');
        
        const atomLine = `ATOM  ${atomId.toString().padStart(5, ' ')} ${atomName} ${resName} ${chainId}${resNum.toString().padStart(4, ' ')}    ${x} ${y} ${z}  1.00  0.00           ${atom.element.padEnd(2, ' ')}
`;
        pdbContent += atomLine;
      });
    } else {
      // If no atoms, return sample PDB
      return SAMPLE_PDB;
    }
    
    // Add end
    pdbContent += 'END
';
    
    return pdbContent;
  };

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
              zIndex: 1,
            }}
            title="Protein Viewer"
          />
        ) : (
          // For native, use WebView
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: nglViewerHTML }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            mixedContentMode="always"
            onError={(e) => {
              console.error("WebView error:", e.nativeEvent.description);
              setViewerError(`WebView error: ${e.nativeEvent.description}`);
            }}
            renderError={(errorName) => (
              <View style={styles.webViewError}>
                <Text style={styles.webViewErrorText}>
                  Failed to load viewer: {errorName}
                </Text>
                <Pressable 
                  style={styles.resetButton}
                  onPress={() => webViewRef.current?.reload()}
                >
                  <Text style={styles.resetButtonText}>Reload Viewer</Text>
                </Pressable>
              </View>
            )}
          />
        )}
        
        {/* Reset view button overlay */}
        <Pressable 
          style={styles.resetViewButton}
          onPress={resetView}
        >
          <RotateCcw size={20} color={colors.gray[700]} />
        </Pressable>
        
        {/* Overlay with annotation information */}
        <View style={styles.annotationOverlay}>
          <Text style={styles.annotationText}>
            {currentProtein ? currentProtein.name : 'Sample Structure'}
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
          
          {debugInfo && __DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>{debugInfo}</Text>
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
  viewerContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.gray[100],
  },
  webViewErrorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  resetViewButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  annotationOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 70, // Make room for reset button
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 12,
    zIndex: 5,
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
  debugContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    color: colors.white,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});