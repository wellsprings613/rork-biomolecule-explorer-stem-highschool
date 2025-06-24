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
END`;

// Improved NGL Viewer HTML template for WebView with better initialization and error handling
const nglViewerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>NGL Protein Viewer</title>
  <style>
    body, html { 
      margin: 0; 
      padding: 0; 
      overflow: hidden; 
      width: 100%; 
      height: 100%; 
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      padding-bottom: env(safe-area-inset-bottom);
    }
    #viewport { 
      width: 100%; 
      height: 100%; 
      position: absolute;
      top: 0;
      left: 0;
      z-index: 5;
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
    #debug {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
      max-width: 80%;
      max-height: 100px;
      overflow: auto;
      display: none;
      z-index: 20;
    }
    #reset-view {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(255, 255, 255, 0.8);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      z-index: 15;
      display: none;
    }
    #reset-view:hover {
      background-color: rgba(240, 240, 240, 0.9);
    }
    #controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 8px;
      border-radius: 8px;
      z-index: 15;
    }
    .control-btn {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background-color: white;
      border: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .control-btn:hover {
      background-color: #f0f0f0;
    }
    .control-btn:active {
      background-color: #e0e0e0;
    }
    .control-icon {
      width: 24px;
      height: 24px;
      fill: #333;
    }
    .annotation-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 70px;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 8px;
      padding: 12px;
      z-index: 10;
    }
  </style>
  <!-- Use a specific version of NGL for stability -->
  <script src="https://unpkg.com/ngl@2.0.0-dev.37/dist/ngl.js"></script>
</head>
<body>
  <div id="viewport"></div>
  <div id="loading">Loading molecular viewer...</div>
  <div id="error"></div>
  <div id="debug"></div>
  <button id="reset-view" title="Reset View">Reset View</button>
  
  <div id="controls" style="display: none;">
    <button class="control-btn" id="zoom-in" title="Zoom In">
      <svg class="control-icon" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2z"/>
      </svg>
    </button>
    <button class="control-btn" id="zoom-out" title="Zoom Out">
      <svg class="control-icon" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        <path d="M7 9h5v1H7z"/>
      </svg>
    </button>
    <button class="control-btn" id="rotate" title="Toggle Rotation">
      <svg class="control-icon" viewBox="0 0 24 24">
        <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
      </svg>
    </button>
    <button class="control-btn" id="fullscreen" title="Toggle Fullscreen">
      <svg class="control-icon" viewBox="0 0 24 24">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
      </svg>
    </button>
  </div>
  
  <script>
    // Debug function
    function debug(message) {
      const debugEl = document.getElementById('debug');
      debugEl.style.display = 'block';
      debugEl.textContent = message;
      console.log(message);
      
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
      console.error(message);
      
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
      document.getElementById('controls').style.display = 'flex';
    }

    // Show reset view button
    function showResetViewButton() {
      document.getElementById('reset-view').style.display = 'block';
    }
    
    // Create NGL Stage object with improved configuration
    let stage;
    let currentComponent = null;
    let isRotating = false;
    let rotationInterval = null;
    
    try {
      // Initialize NGL Stage with better defaults for mobile
      stage = new NGL.Stage("viewport", { 
        backgroundColor: "white",
        quality: "medium", // Adjust based on device capability
        impostor: true,    // Use impostors for better performance
        antialias: true,   // Enable antialiasing for better visuals
        fogNear: 100,      // Improve depth perception
        fogFar: 100,
        clipNear: 0,       // Prevent clipping issues
        clipFar: 100,
        clipDist: 10,
        lightIntensity: 1.0, // Brighter lighting
        ambientIntensity: 0.2, // Add ambient light
        hoverTimeout: 0    // Disable hover for better mobile performance
      });
      
      // Configure camera and controls for better interaction
      stage.viewer.camera.position.z = 50;
      stage.viewer.camera.lookAt(new NGL.Vector3(0, 0, 0));
      
      // Improve mouse/touch controls
      stage.mouseControls.zoomSpeed = 1.0;
      stage.mouseControls.rotateSpeed = 1.0;
      stage.mouseControls.panSpeed = 1.0;
      
      // Enable all mouse actions for better interaction
      stage.mouseControls.enableRotate = true;
      stage.mouseControls.enableZoom = true;
      stage.mouseControls.enablePan = true;
      stage.mouseControls.enableDamping = true;
      
      hideLoading();
      showResetViewButton();
      
      // Add reset view button handler
      document.getElementById('reset-view').addEventListener('click', function() {
        if (stage) {
          stage.autoView(1000); // Smooth transition to default view
        }
      });
      
      // Add zoom in button handler
      document.getElementById('zoom-in').addEventListener('click', function() {
        if (stage) {
          stage.viewer.controls.dollyIn(1.2);
          stage.viewer.requestRender();
        }
      });
      
      // Add zoom out button handler
      document.getElementById('zoom-out').addEventListener('click', function() {
        if (stage) {
          stage.viewer.controls.dollyOut(1.2);
          stage.viewer.requestRender();
        }
      });
      
      // Add rotation button handler
      document.getElementById('rotate').addEventListener('click', function() {
        if (!stage) return;
        
        isRotating = !isRotating;
        
        if (isRotating) {
          // Start rotation
          this.style.backgroundColor = '#e0e0e0';
          rotationInterval = setInterval(function() {
            stage.viewer.controls.rotate(0.01, 0);
            stage.viewer.requestRender();
          }, 20);
        } else {
          // Stop rotation
          this.style.backgroundColor = 'white';
          clearInterval(rotationInterval);
        }
      });
      
      // Add fullscreen button handler
      document.getElementById('fullscreen').addEventListener('click', function() {
        if (stage) {
          stage.toggleFullscreen();
        }
      });
      
      // Send ready message to React Native
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'viewerReady',
          message: 'NGL Viewer is ready'
        }));
      } catch (e) {
        debug('ReactNativeWebView not available: ' + e.message);
      }
    } catch (e) {
      showError('Failed to initialize NGL Viewer: ' + e.message);
    }
    
    // Helper function to apply representation and color scheme with improved settings
    function applyRepresentation(component, representation, colorScheme) {
      if (!component) return;
      
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
            scale: 1.5,
            quality: 'medium'
          });
          return;
        default:
          colorSchemeParams = { color: 'chainid' };
      }
      
      // Apply representation with improved settings
      switch (representation) {
        case 'cartoon':
          component.addRepresentation('cartoon', {
            ...colorSchemeParams,
            aspectRatio: 3.0,
            scale: 1.5,
            quality: 'medium',
            smoothSheet: true
          });
          break;
        case 'ball-and-stick':
          component.addRepresentation('ball+stick', {
            ...colorSchemeParams,
            multipleBond: true,
            scale: 0.75,
            bondScale: 0.4,
            bondSpacing: 1.0,
            quality: 'medium'
          });
          break;
        case 'space-filling':
          component.addRepresentation('spacefill', {
            ...colorSchemeParams,
            scale: 0.8,
            quality: 'medium'
          });
          break;
        case 'ribbon':
          component.addRepresentation('ribbon', {
            ...colorSchemeParams,
            scale: 1.0,
            opacity: 0.9,
            quality: 'medium'
          });
          break;
        default:
          // Fallback to licorice representation if others fail
          try {
            component.addRepresentation('cartoon', {
              ...colorSchemeParams,
              quality: 'low'
            });
          } catch (e) {
            debug('Falling back to licorice representation');
            component.addRepresentation('licorice', {
              ...colorSchemeParams,
              quality: 'low'
            });
          }
      }
      
      // Add labels for binding sites if they exist
      if (representation !== 'space-filling') {
        try {
          component.addRepresentation('ball+stick', {
            sele: 'ligand',
            scale: 0.6,
            color: 'element',
            quality: 'medium'
          });
        } catch (e) {
          debug('No ligands found or error adding ligand representation');
        }
      }
      
      // Ensure proper view
      stage.autoView(1000);
    }
    
    // Load a sample structure for testing
    function loadSampleStructure() {
      debug('Loading sample structure');
      if (!stage) return;
      
      stage.removeAllComponents();
      currentComponent = null;
      
      try {
        // Load a simple PDB structure
        stage.loadFile(new Blob([
          "HEADER    SAMPLE STRUCTURE\\n" +
          "ATOM      1  N   ALA A   1      21.709  34.298  37.631  1.00 18.04           N  \\n" +
          "ATOM      2  CA  ALA A   1      22.403  33.801  36.438  1.00 16.23           C  \\n" +
          "ATOM      3  C   ALA A   1      23.895  33.722  36.679  1.00 14.30           C  \\n" +
          "ATOM      4  O   ALA A   1      24.334  33.311  37.754  1.00 14.99           O  \\n" +
          "ATOM      5  CB  ALA A   1      21.843  32.446  36.036  1.00 16.55           C  \\n" +
          "ATOM      6  N   VAL A   2      24.698  34.116  35.693  1.00 12.71           N  \\n" +
          "ATOM      7  CA  VAL A   2      26.151  34.089  35.784  1.00 11.42           C  \\n" +
          "ATOM      8  C   VAL A   2      26.733  32.810  35.183  1.00 10.86           C  \\n" +
          "ATOM      9  O   VAL A   2      26.313  32.350  34.121  1.00 11.46           O  \\n" +
          "ATOM     10  CB  VAL A   2      26.792  35.289  35.062  1.00 11.47           C  \\n" +
          "END"
        ], {type: 'text/plain'}), { ext: 'pdb' })
          .then(function(component) {
            currentComponent = component;
            applyRepresentation(component, 'cartoon', 'structure');
            stage.autoView(1000);
            debug('Sample structure loaded successfully');
            
            // Send success message
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'loadSuccess',
              message: 'Sample structure loaded successfully'
            }));
          })
          .catch(function(error) {
            showError('Failed to load sample structure: ' + error.message);
            
            // Try an even simpler fallback
            try {
              stage.loadFile("rcsb://1crn").then(function(o) {
                currentComponent = o;
                o.addRepresentation("licorice");
                stage.autoView(1000);
                debug('Fallback structure loaded');
              });
            } catch (e) {
              showError('All structure loading attempts failed');
            }
          });
      } catch (e) {
        showError('Error in loadSampleStructure: ' + e.message);
      }
    }
    
    // Handle messages from React Native with improved error handling
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        debug('Received message: ' + data.type);
        
        if (data.type === 'loadPDB') {
          // Clear any existing structures
          stage.removeAllComponents();
          currentComponent = null;
          
          // Show loading indicator
          document.getElementById('loading').style.display = 'block';
          document.getElementById('controls').style.display = 'none';
          
          // Load PDB data
          const format = data.format || 'pdb';
          const ext = format === 'cif' ? 'cif' : (format === 'mol2' ? 'mol2' : 'pdb');
          
          debug('Loading structure: format=' + format + ', ext=' + ext + ', content length=' + data.content.length);
          
          // Create a proper blob with the correct MIME type
          const blob = new Blob([data.content], {
            type: format === 'pdb' ? 'chemical/x-pdb' : 
                 (format === 'cif' ? 'chemical/x-cif' : 'chemical/x-mol')
          });
          
          // Load with better error handling and timeout
          const loadPromise = stage.loadFile(blob, { 
            ext: ext,
            defaultRepresentation: false
          });
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Loading timed out after 15 seconds')), 15000);
          });
          
          Promise.race([loadPromise, timeoutPromise])
            .then(function(component) {
              // Hide loading indicator
              hideLoading();
              
              // Apply representation based on settings
              applyRepresentation(component, data.representation, data.colorScheme);
              
              // Auto zoom to fit the structure with animation
              stage.autoView(1000);
              
              // Send success message back to React Native
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loadSuccess',
                message: 'Structure loaded successfully'
              }));
              
              debug('Structure loaded successfully');
            })
            .catch(function(error) {
              hideLoading();
              showError('Failed to load structure: ' + error.message);
              
              // Try alternative loading method
              debug('Trying alternative loading method...');
              
              try {
                // Try loading as string
                stage.loadFile(new Blob([data.content], {type: 'text/plain'}), { 
                  ext: ext,
                  defaultRepresentation: false
                }).then(function(component) {
                  applyRepresentation(component, 'ball-and-stick', 'element'); // Fallback to simpler representation
                  stage.autoView(1000);
                  debug('Structure loaded with alternative method');
                }).catch(function() {
                  // If all else fails, load sample structure
                  debug('All loading attempts failed, loading sample structure');
                  loadSampleStructure();
                });
              } catch (e) {
                loadSampleStructure();
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
          stage.setParameters({ backgroundColor: data.color });
          debug('Updated background color: ' + data.color);
        } else if (data.type === 'resetView') {
          // Reset view to default with animation
          stage.autoView(1000);
          debug('Reset view');
        } else if (data.type === 'zoomIn') {
          // Zoom in with better control
          stage.viewer.controls.dollyIn(1.2);
          stage.viewer.requestRender();
          debug('Zoom in');
        } else if (data.type === 'zoomOut') {
          // Zoom out with better control
          stage.viewer.controls.dollyOut(1.2);
          stage.viewer.requestRender();
          debug('Zoom out');
        } else if (data.type === 'move') {
          // Toggle mouse mode
          stage.mouseControls.togglePreset();
          debug('Toggle mouse mode');
        } else if (data.type === 'fullscreen') {
          // Toggle fullscreen
          stage.toggleFullscreen();
          debug('Toggle fullscreen');
        } else if (data.type === 'loadSample') {
          // Load sample structure
          loadSampleStructure();
        } else if (data.type === 'toggleRotation') {
          // Toggle rotation
          const rotateBtn = document.getElementById('rotate');
          if (rotateBtn) {
            rotateBtn.click();
          }
        }
      } catch (error) {
        showError('Error processing message: ' + error.message);
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (stage) {
        stage.handleResize();
        // Re-center view after resize
        setTimeout(() => stage.autoView(0), 100);
      }
    });
    
    // Initial setup - load sample structure if no data is provided within 2 seconds
    if (stage) {
      stage.handleResize();
      setTimeout(function() {
        if (stage.compList.length === 0) {
          debug('No structure loaded after timeout, loading sample structure');
          loadSampleStructure();
        }
      }, 2000);
    }
    
    // Prevent context menu to improve mobile experience
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
    
    // Prevent default touch behavior to improve mobile experience
    document.addEventListener('touchmove', function(e) {
      if (e.target.id === 'viewport') {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Ensure WebGL context is not lost
    window.addEventListener('webglcontextlost', function(e) {
      debug('WebGL context lost, attempting to restore');
      e.preventDefault();
      
      // Notify React Native
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'webglContextLost',
        message: 'WebGL context was lost, attempting to restore'
      }));
      
      // Try to restore after a short delay
      setTimeout(function() {
        if (stage) {
          try {
            stage.viewer.requestRender();
            debug('WebGL context restored');
          } catch (e) {
            showError('Failed to restore WebGL context: ' + e.message);
          }
        }
      }, 1000);
    }, false);
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

  // Handle messages from the WebView with improved error handling
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
        case 'webglContextLost':
          console.error('WebGL context lost:', data.message);
          setViewerError('WebGL context was lost. Please reload the viewer.');
          // Try to reload the WebView
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
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
    
    if (currentProtein && currentProtein.rawContent) {
      loadProteinStructure();
    } else {
      // Load sample structure if no protein is loaded
      webViewRef.current.postMessage(JSON.stringify({
        type: 'loadSample'
      }));
    }
  }, [currentProtein, viewerReady]);

  // Update viewer settings when they change
  useEffect(() => {
    if (!viewerReady || !webViewRef.current) return;
    
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

  // Load protein structure with improved error handling
  const loadProteinStructure = () => {
    if (!currentProtein || !viewerReady || !webViewRef.current) return;

    console.log('Loading protein structure:', currentProtein.name);
    
    // Use the raw content if available, otherwise generate PDB content
    const content = currentProtein.rawContent || generatePDBContent(currentProtein);
    
    if (!content) {
      setViewerError("Failed to generate protein structure content");
      return;
    }
    
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

  // Toggle rotation
  const toggleRotation = () => {
    if (!viewerReady || !webViewRef.current) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    webViewRef.current.postMessage(JSON.stringify({
      type: 'toggleRotation'
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
    pdbContent += `HEADER    ${protein.name || 'UNKNOWN'}\n`;
    pdbContent += `TITLE     ${protein.description || 'No description'}\n`;
    
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
        
        const atomLine = `ATOM  ${atomId.toString().padStart(5, ' ')} ${atomName} ${resName} ${chainId}${resNum.toString().padStart(4, ' ')}    ${x} ${y} ${z}  1.00  0.00           ${atom.element.padEnd(2, ' ')}\n`;
        pdbContent += atomLine;
      });
    } else {
      // If no atoms, return sample PDB
      return SAMPLE_PDB;
    }
    
    // Add end
    pdbContent += 'END\n';
    
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
          // For native, use WebView with improved configuration
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
            onError={(e) => setViewerError(`WebView error: ${e.nativeEvent.description}`)}
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