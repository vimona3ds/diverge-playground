import * as THREE from 'three';

// Initialize Chladni plate simulation
export function initFluidSimulation(containerId) {
    // Setup
    const container = document.getElementById(containerId);
    
    // Create simulation container first (without controls inside)
    const simulationContainer = document.createElement('div');
    simulationContainer.style.position = 'relative';
    simulationContainer.style.width = '100%';
    simulationContainer.style.height = '100%';
    container.appendChild(simulationContainer);
    
    // Create canvas directly in the simulation container
    const canvas = document.createElement('canvas');
    canvas.id = 'fluid-canvas';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    simulationContainer.appendChild(canvas);
    
    // Add controls container - now absolutely positioned at the bottom of the screen
    const controlsContainer = document.createElement('div');
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.bottom = '20px';
    controlsContainer.style.left = '50%';
    controlsContainer.style.transform = 'translateX(-50%)';
    controlsContainer.style.padding = '10px';
    controlsContainer.style.backgroundColor = 'rgba(245, 245, 245, 0.85)';
    controlsContainer.style.borderRadius = '5px';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.justifyContent = 'space-between';
    controlsContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    controlsContainer.style.zIndex = '1000';
    controlsContainer.style.width = 'auto';
    controlsContainer.style.minWidth = '400px';
    document.body.appendChild(controlsContainer);
    
    // Left side controls - frequency
    const freqContainer = document.createElement('div');
    controlsContainer.appendChild(freqContainer);
    
    const freqLabel = document.createElement('label');
    freqLabel.textContent = 'Frequency: 100 Hz';
    freqLabel.style.display = 'block';
    freqLabel.style.marginBottom = '5px';
    freqContainer.appendChild(freqLabel);
    
    // We'll use a log scale for the frequency slider for more natural control
    const freqSlider = document.createElement('input');
    freqSlider.type = 'range';
    freqSlider.min = '0'; // Will map 0-100 to 0.01-20000 Hz logarithmically
    freqSlider.max = '100';
    freqSlider.step = '0.01'; // Add fine-grained control
    freqSlider.value = '40'; // Maps to approximately 100 Hz
    freqSlider.style.width = '200px';
    freqContainer.appendChild(freqSlider);
    
    // Add frequency auto-play controls
    const freqPlayContainer = document.createElement('div');
    freqPlayContainer.style.display = 'flex';
    freqPlayContainer.style.alignItems = 'center';
    freqPlayContainer.style.marginTop = '8px';
    freqContainer.appendChild(freqPlayContainer);
    
    // Play/pause button
    const playButton = document.createElement('button');
    playButton.textContent = '▶';
    playButton.style.padding = '5px 10px';
    playButton.style.marginRight = '10px';
    playButton.style.borderRadius = '4px';
    playButton.style.backgroundColor = '#f0f0f0';
    playButton.style.cursor = 'pointer';
    freqPlayContainer.appendChild(playButton);
    
    // Speed control
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed: 0';
    speedLabel.style.marginRight = '5px';
    speedLabel.style.fontSize = '12px';
    freqPlayContainer.appendChild(speedLabel);
    
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '-10';
    speedSlider.max = '10';
    speedSlider.value = '0';
    speedSlider.style.width = '120px';
    freqPlayContainer.appendChild(speedSlider);
    
    // Auto-play state and interval
    let isFrequencyPlaying = false;
    let frequencyPlayInterval = null;
    let frequencyPlaySpeed = 0;
    
    // Update speed label when slider changes
    speedSlider.addEventListener('input', function() {
        frequencyPlaySpeed = parseInt(this.value);
        speedLabel.textContent = `Speed: ${frequencyPlaySpeed}`;
        
        // If playing, clear and restart interval with new speed
        if (isFrequencyPlaying) {
            clearInterval(frequencyPlayInterval);
            startFrequencyPlay();
        }
    });
    
    // Toggle play/pause
    playButton.addEventListener('click', function() {
        isFrequencyPlaying = !isFrequencyPlaying;
        
        if (isFrequencyPlaying) {
            playButton.textContent = '⏸';
            playButton.style.backgroundColor = '#d4f0d4'; // Light green when active
            startFrequencyPlay();
        } else {
            playButton.textContent = '▶';
            playButton.style.backgroundColor = '#f0f0f0';
            clearInterval(frequencyPlayInterval);
        }
    });
    
    // Function to start auto-playing frequency
    function startFrequencyPlay() {
        if (frequencyPlaySpeed === 0) return;
        
        frequencyPlayInterval = setInterval(() => {
            // Calculate new frequency value
            let newFreq = parseFloat(freqSlider.value) + frequencyPlaySpeed;
            
            // Ensure we stay within bounds
            newFreq = Math.max(parseFloat(freqSlider.min), Math.min(parseFloat(freqSlider.max), newFreq));
            
            // Update slider value
            freqSlider.value = newFreq;
            
            // Trigger the input event to update simulation
            const inputEvent = new Event('input', { bubbles: true });
            freqSlider.dispatchEvent(inputEvent);
            
            // Check if we've reached the end and should stop
            if (newFreq <= parseFloat(freqSlider.min) || newFreq >= parseFloat(freqSlider.max)) {
                isFrequencyPlaying = false;
                playButton.textContent = '▶';
                playButton.style.backgroundColor = '#f0f0f0';
                clearInterval(frequencyPlayInterval);
            }
        }, 100); // Update every 100ms
    }
    
    // Right side controls - sound toggle and instructions
    const rightControls = document.createElement('div');
    controlsContainer.appendChild(rightControls);
    
    const soundContainer = document.createElement('div');
    rightControls.appendChild(soundContainer);
    
    const soundCheckbox = document.createElement('input');
    soundCheckbox.type = 'checkbox';
    soundCheckbox.id = 'sound-toggle';
    soundCheckbox.checked = true; // Enable sonification by default
    soundContainer.appendChild(soundCheckbox);
    
    const soundLabel = document.createElement('label');
    soundLabel.textContent = 'Sonification';
    soundLabel.htmlFor = 'sound-toggle';
    soundLabel.style.marginLeft = '5px';
    soundContainer.appendChild(soundLabel);
    
    // Add simulation speed control
    const speedControlContainer = document.createElement('div');
    speedControlContainer.style.marginTop = '10px';
    rightControls.appendChild(speedControlContainer);
    
    const simSpeedLabel = document.createElement('label');
    simSpeedLabel.textContent = 'Particle Speed: 0.05';
    simSpeedLabel.style.display = 'block';
    simSpeedLabel.style.marginBottom = '5px';
    speedControlContainer.appendChild(simSpeedLabel);
    
    const simSpeedSlider = document.createElement('input');
    simSpeedSlider.type = 'range';
    simSpeedSlider.min = '0.01';
    simSpeedSlider.max = '5.0';
    simSpeedSlider.step = '0.01'; // Change from 0.05 to 0.01 for finer control
    simSpeedSlider.value = '0.05';
    simSpeedSlider.style.width = '150px';
    speedControlContainer.appendChild(simSpeedSlider);
    
    // Add force strength control
    const forceControlContainer = document.createElement('div');
    forceControlContainer.style.marginTop = '10px';
    rightControls.appendChild(forceControlContainer);
    
    const forceLabel = document.createElement('label');
    forceLabel.textContent = 'Force Strength: 4.0';
    forceLabel.style.display = 'block';
    forceLabel.style.marginBottom = '5px';
    forceControlContainer.appendChild(forceLabel);
    
    const forceSlider = document.createElement('input');
    forceSlider.type = 'range';
    forceSlider.min = '1';
    forceSlider.max = '30';
    forceSlider.step = '1';
    forceSlider.value = '4';
    forceSlider.style.width = '150px';
    forceControlContainer.appendChild(forceSlider);
    
    // Add damping control
    const dampingControlContainer = document.createElement('div');
    dampingControlContainer.style.marginTop = '10px';
    rightControls.appendChild(dampingControlContainer);
    
    const dampingLabel = document.createElement('label');
    dampingLabel.textContent = 'Damping: 0.65';
    dampingLabel.style.display = 'block';
    dampingLabel.style.marginBottom = '5px';
    dampingControlContainer.appendChild(dampingLabel);
    
    const dampingSlider = document.createElement('input');
    dampingSlider.type = 'range';
    dampingSlider.min = '0.1';
    dampingSlider.max = '0.95';
    dampingSlider.step = '0.05';
    dampingSlider.value = '0.65';
    dampingSlider.style.width = '150px';
    dampingControlContainer.appendChild(dampingSlider);
    
    // Add instruction text
    const instructionText = document.createElement('div');
    instructionText.textContent = 'Click and hold to spawn particles';
    instructionText.style.marginTop = '10px';
    instructionText.style.fontSize = '12px';
    instructionText.style.color = '#555';
    rightControls.appendChild(instructionText);
    
    // Create a separate container for all sonification controls
    const sonificationContainer = document.createElement('div');
    sonificationContainer.style.position = 'fixed';
    sonificationContainer.style.right = '20px';
    sonificationContainer.style.top = '20px';
    sonificationContainer.style.padding = '15px';
    sonificationContainer.style.backgroundColor = 'rgba(245, 245, 245, 0.85)';
    sonificationContainer.style.borderRadius = '5px';
    sonificationContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    sonificationContainer.style.zIndex = '1000';
    sonificationContainer.style.width = '250px';
    sonificationContainer.style.maxHeight = '80vh';
    sonificationContainer.style.overflowY = 'auto';
    document.body.appendChild(sonificationContainer);
    
    // Sonification header
    const sonificationHeader = document.createElement('h3');
    sonificationHeader.textContent = 'Sonification Controls';
    sonificationHeader.style.margin = '0 0 10px 0';
    sonificationHeader.style.fontSize = '16px';
    sonificationHeader.style.textAlign = 'center';
    sonificationContainer.appendChild(sonificationHeader);
    
    // Create a function to add sliders to the sonification container
    function addSonificationSlider(name, min, max, step, defaultValue, callback) {
        const controlContainer = document.createElement('div');
        controlContainer.style.marginBottom = '10px';
        sonificationContainer.appendChild(controlContainer);
        
        const label = document.createElement('label');
        label.textContent = `${name}: ${defaultValue}`;
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        label.style.fontSize = '12px';
        controlContainer.appendChild(label);
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = defaultValue;
        slider.style.width = '100%';
        controlContainer.appendChild(slider);
        
        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            label.textContent = `${name}: ${value.toFixed(2)}`;
            if (callback) callback(value);
        });
        
        return slider;
    }
    
    // Variables to store slider references for use in the audio initialization
    let modulationDepthSlider, modulationFreqSlider, harmonicsLevelSlider;
    let filterCutoffSlider, filterResonanceSlider, reverbMixSlider;
    let noiseVolumeSlider, delayTimeSlider, delayFeedbackSlider;
    let phaserRateSlider, phaserDepthSlider, subOscVolumeSlider;
    
    // Create UI sliders (actual connections will happen when audio is initialized)
    modulationDepthSlider = addSonificationSlider('Modulation Depth', 0, 100, 1, 20);
    modulationFreqSlider = addSonificationSlider('Modulation Freq', 0.1, 20, 0.1, 5);
    harmonicsLevelSlider = addSonificationSlider('Harmonics', 0, 1, 0.01, 0.1);
    filterCutoffSlider = addSonificationSlider('Filter Cutoff', 50, 15000, 10, 2000);
    filterResonanceSlider = addSonificationSlider('Filter Resonance', 0.1, 20, 0.1, 1);
    reverbMixSlider = addSonificationSlider('Reverb Mix', 0, 1, 0.01, 0.3);
    
    // Sliders for new components
    // 1. Noise Generator
    const noiseHeader = document.createElement('h4');
    noiseHeader.textContent = 'Noise Generator';
    noiseHeader.style.margin = '15px 0 10px 0';
    noiseHeader.style.fontSize = '14px';
    sonificationContainer.appendChild(noiseHeader);
    
    noiseVolumeSlider = addSonificationSlider('Noise Volume', 0, 1, 0.01, 0.05);
    
    // 2. Delay Effect
    const delayHeader = document.createElement('h4');
    delayHeader.textContent = 'Delay Effect';
    delayHeader.style.margin = '15px 0 10px 0';
    delayHeader.style.fontSize = '14px';
    sonificationContainer.appendChild(delayHeader);
    
    delayTimeSlider = addSonificationSlider('Delay Time', 0.01, 1, 0.01, 0.25);
    delayFeedbackSlider = addSonificationSlider('Feedback', 0, 0.9, 0.01, 0.3);
    
    // 3. Phaser Effect
    const phaserHeader = document.createElement('h4');
    phaserHeader.textContent = 'Phaser Effect';
    phaserHeader.style.margin = '15px 0 10px 0';
    phaserHeader.style.fontSize = '14px';
    sonificationContainer.appendChild(phaserHeader);
    
    phaserRateSlider = addSonificationSlider('Rate', 0.1, 10, 0.1, 0.5);
    phaserDepthSlider = addSonificationSlider('Depth', 0, 1, 0.01, 0.3);
    
    // 4. Sub Oscillator
    const subOscHeader = document.createElement('h4');
    subOscHeader.textContent = 'Sub Oscillator';
    subOscHeader.style.margin = '15px 0 10px 0';
    subOscHeader.style.fontSize = '14px';
    sonificationContainer.appendChild(subOscHeader);
    
    subOscVolumeSlider = addSonificationSlider('Sub Volume', 0, 1, 0.01, 0.2);
    
    // 5. Stereo Field Controls
    const stereoHeader = document.createElement('h4');
    stereoHeader.textContent = 'Stereo Field';
    stereoHeader.style.margin = '15px 0 10px 0';
    stereoHeader.style.fontSize = '14px';
    sonificationContainer.appendChild(stereoHeader);
    
    const stereoWidthSlider = addSonificationSlider('Stereo Width', 0, 1, 0.01, 0.7);
    const stereoDensitySlider = addSonificationSlider('Particle Density', 0, 1, 0.01, 0.5);
    
    // 6. Particle Sonification
    const particleSoniHeader = document.createElement('h4');
    particleSoniHeader.textContent = 'Particle Sonification';
    particleSoniHeader.style.margin = '15px 0 10px 0';
    particleSoniHeader.style.fontSize = '14px';
    sonificationContainer.appendChild(particleSoniHeader);
    
    const particleGainSlider = addSonificationSlider('Particle Gain', 0, 1, 0.01, 0.3);
    const particleRangeSlider = addSonificationSlider('Speed Range', 0, 1, 0.01, 0.5);
    const particleDensitySlider = addSonificationSlider('Sonic Density', 0, 1, 0.01, 0.3);
    
    // Container dimensions (full size now)
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    
    // Create orthographic camera for 2D view
    const camera = new THREE.OrthographicCamera(
        -containerWidth / 2, 
        containerWidth / 2, 
        containerHeight / 2, 
        -containerHeight / 2, 
        1, 
        1000
    );
    camera.position.z = 10;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Particle system parameters
    const numParticles = Math.round(containerWidth * containerHeight * 0.5 / 16); // Fill ~50% of container with smaller divisor for more particles
    const particleSize = 3;
    const particleRadius = particleSize / 2;
    const gravity = 0; // No gravity for Chladni patterns
    let damping = 0.65; // Increased damping to allow particles to settle faster
    
    // Collision parameters
    const collisionDamping = 0.8; // Energy loss in collisions
    const minDistance = particleSize * 0.9; // Minimum distance between particles (slightly less than particle size to allow some overlap)
    const repulsionStrength = 0.15; // Strength of repulsion when particles collide
    
    // Spatial partitioning for efficient collision detection
    const gridSize = Math.max(containerWidth, containerHeight) / 20; // Size of each grid cell
    const spatialGrid = {};
    
    // Function to get grid cell key from position
    function getGridKey(x, y) {
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        return `${gridX},${gridY}`;
    }
    
    // Function to update spatial grid
    function updateSpatialGrid() {
        // Clear grid
        for (const key in spatialGrid) {
            delete spatialGrid[key];
        }
        
        // Add particles to grid
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const key = getGridKey(p.position.x, p.position.y);
            
            if (!spatialGrid[key]) {
                spatialGrid[key] = [];
            }
            
            spatialGrid[key].push(i);
        }
    }
    
    // Function to get nearby particles
    function getNearbyParticles(x, y) {
        const width = bounds.right - bounds.left;
        const height = bounds.top - bounds.bottom;
        const nearbyIndices = [];
        
        // Check cells around the position, considering wrapping
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                // Calculate grid position, potentially wrapped around edges
                let checkX = x + dx * gridSize;
                let checkY = y + dy * gridSize;
                
                // Apply wrapping for spatial partitioning
                if (checkX < bounds.left) checkX += width;
                else if (checkX > bounds.right) checkX -= width;
                
                if (checkY < bounds.bottom) checkY += height;
                else if (checkY > bounds.top) checkY -= height;
                
                const key = getGridKey(checkX, checkY);
                
                if (spatialGrid[key]) {
                    nearbyIndices.push(...spatialGrid[key]);
                }
            }
        }
        
        return nearbyIndices;
    }
    
    // Chladni simulation parameters
    let baseFrequency = 100; // Starting frequency in Hz
    let simulationSpeed = 0.05; // Speed multiplier for the simulation
    let forceStrength = 4.0; // Stronger force for more dramatic patterns
    const nodeTolerance = 0.05; // If amplitude is below this, considered a node
    
    // Mode calculation based on frequency
    let m = 2; // Initial mode number for x dimension
    let n = 2; // Initial mode number for y dimension
    
    // Mouse interaction variables
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    const spawnInterval = 1; // Spawn a particle every frame when mouse is down (increased rate)
    let frameCount = 0;
    const particlesPerSpawn = 3; // Spawn multiple particles at once
    
    // Setup Web Audio API
    let audioContext = null;
    let oscillator = null;
    let gainNode = null;
    
    // Additional audio nodes for sonification
    let filterNode = null;
    let modulatorOsc = null;
    let modulatorGain = null;
    let analyser = null;
    let reverbNode = null;
    let harmonicsOsc = null;
    let harmonicsGain = null;
    
    // New audio components
    let noiseSource = null;
    let noiseGain = null;
    let noiseFilter = null;
    
    let delayNode = null;
    let delayFeedback = null;
    let delayMix = null;
    
    let phaserLFO = null;
    let phaserGain = null;
    let phaserFilter = null;
    
    let subOscillator = null;
    let subOscGain = null;
    
    // Stereo panning components
    let stereoPanner = null;
    let leftGain = null;
    let rightGain = null;
    let centerGain = null;
    let particleOscillators = [];

    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyzer for visualization
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            
            // Primary oscillator (base frequency)
            oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = baseFrequency;
            
            // Secondary oscillator for modulation
            modulatorOsc = audioContext.createOscillator();
            modulatorOsc.type = 'sine';
            modulatorOsc.frequency.value = parseFloat(modulationFreqSlider.value);
            
            // Harmonics oscillator for texture
            harmonicsOsc = audioContext.createOscillator();
            harmonicsOsc.type = 'sawtooth';
            harmonicsOsc.frequency.value = baseFrequency * 1.5; // Shifted harmony
            
            // Gain nodes
            gainNode = audioContext.createGain();
            gainNode.gain.value = 0.2; // Start enabled with moderate volume
            
            modulatorGain = audioContext.createGain();
            modulatorGain.gain.value = parseFloat(modulationDepthSlider.value);
            
            harmonicsGain = audioContext.createGain();
            harmonicsGain.gain.value = parseFloat(harmonicsLevelSlider.value);
            
            // Filter nodes for spectral effects
            filterNode = audioContext.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.value = parseFloat(filterCutoffSlider.value);
            filterNode.Q.value = parseFloat(filterResonanceSlider.value);
            
            const harmonicsFilter = audioContext.createBiquadFilter();
            harmonicsFilter.type = 'bandpass';
            harmonicsFilter.frequency.value = 1000;
            harmonicsFilter.Q.value = 2;
            
            // Create convolver for reverb
            reverbNode = audioContext.createConvolver();
            
            // Generate impulse response for reverb
            const sampleRate = audioContext.sampleRate;
            const length = sampleRate * 2.5; // 2.5 seconds reverb
            const impulse = audioContext.createBuffer(2, length, sampleRate);
            
            for (let channel = 0; channel < 2; channel++) {
                const impulseData = impulse.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    // Exponential decay impulse response
                    impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                }
            }
            
            reverbNode.buffer = impulse;
            
            // Connect modulator to primary oscillator frequency
            modulatorOsc.connect(modulatorGain);
            modulatorGain.connect(oscillator.frequency);
            
            // Set up stereo field
            leftGain = audioContext.createGain();
            rightGain = audioContext.createGain();
            centerGain = audioContext.createGain();
            
            // Create stereo channel merger
            const merger = audioContext.createChannelMerger(2);
            
            // Connect main signal path with stereo splitting
            oscillator.connect(filterNode);
            filterNode.connect(centerGain);
            
            // Connect harmonics path
            harmonicsOsc.connect(harmonicsFilter);
            harmonicsFilter.connect(harmonicsGain);
            harmonicsGain.connect(centerGain);
            
            // Connect center channel to both left and right
            centerGain.connect(leftGain);
            centerGain.connect(rightGain);
            
            // Connect to stereo merger
            leftGain.connect(merger, 0, 0); // Left channel
            rightGain.connect(merger, 0, 1); // Right channel
            
            // Connect merger to gain node
            merger.connect(gainNode);
            
            // Split to dry/wet paths for reverb
            const dryGain = audioContext.createGain();
            dryGain.gain.value = 1 - parseFloat(reverbMixSlider.value);
            
            const wetGain = audioContext.createGain();
            wetGain.gain.value = parseFloat(reverbMixSlider.value);
            
            gainNode.connect(dryGain);
            gainNode.connect(reverbNode);
            reverbNode.connect(wetGain);
            
            // Initialize and connect Noise Generator
            const bufferSize = 2 * audioContext.sampleRate;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            
            // Fill the buffer with noise
            for (let i = 0; i < bufferSize; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            
            noiseSource = audioContext.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;
            
            noiseFilter = audioContext.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 800;
            noiseFilter.Q.value = 0.8;
            
            noiseGain = audioContext.createGain();
            noiseGain.gain.value = parseFloat(noiseVolumeSlider.value);
            
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(dryGain);
            
            // Initialize and connect Delay Effect
            delayNode = audioContext.createDelay();
            delayNode.delayTime.value = parseFloat(delayTimeSlider.value);
            
            delayFeedback = audioContext.createGain();
            delayFeedback.gain.value = parseFloat(delayFeedbackSlider.value);
            
            delayMix = audioContext.createGain();
            delayMix.gain.value = 0.3; // Fixed mix amount
            
            // Connect delay network
            dryGain.connect(delayNode);
            delayNode.connect(delayFeedback);
            delayFeedback.connect(delayNode);
            delayNode.connect(delayMix);
            
            // Initialize and connect Phaser Effect
            phaserLFO = audioContext.createOscillator();
            phaserLFO.type = 'sine';
            phaserLFO.frequency.value = parseFloat(phaserRateSlider.value);
            
            phaserGain = audioContext.createGain();
            phaserGain.gain.value = 300 * parseFloat(phaserDepthSlider.value); // Scale for frequency modulation
            
            phaserFilter = audioContext.createBiquadFilter();
            phaserFilter.type = 'allpass';
            phaserFilter.frequency.value = 1000;
            phaserFilter.Q.value = 5;
            
            // Connect phaser network
            phaserLFO.connect(phaserGain);
            phaserGain.connect(phaserFilter.frequency);
            dryGain.connect(phaserFilter);
            
            // Initialize and connect Sub Oscillator (one octave below main)
            subOscillator = audioContext.createOscillator();
            subOscillator.type = 'sine';
            subOscillator.frequency.value = baseFrequency / 2; // One octave lower
            
            subOscGain = audioContext.createGain();
            subOscGain.gain.value = parseFloat(subOscVolumeSlider.value);
            
            subOscillator.connect(subOscGain);
            subOscGain.connect(dryGain);
            
            // Initialize a small pool of oscillators for particle sonification
            // We'll reuse these rather than creating a new one for each particle
            const maxParticleOscillators = 16; // Limit to prevent audio overload
            for (let i = 0; i < maxParticleOscillators; i++) {
                const particleOsc = audioContext.createOscillator();
                particleOsc.type = 'sine';
                particleOsc.frequency.value = baseFrequency;
                
                const particleGain = audioContext.createGain();
                particleGain.gain.value = 0; // Start silent
                
                const particlePanner = audioContext.createStereoPanner();
                particlePanner.pan.value = 0; // Center
                
                particleOsc.connect(particleGain);
                particleGain.connect(particlePanner);
                particlePanner.connect(dryGain);
                
                particleOsc.start();
                
                particleOscillators.push({
                    oscillator: particleOsc,
                    gain: particleGain,
                    panner: particlePanner,
                    inUse: false
                });
            }
            
            // Final connections to output
            dryGain.connect(analyser);
            wetGain.connect(analyser);
            delayMix.connect(analyser);
            phaserFilter.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // Start oscillators
            oscillator.start();
            modulatorOsc.start();
            harmonicsOsc.start();
            noiseSource.start();
            phaserLFO.start();
            subOscillator.start();
            
            // Connect UI controls to audio parameters
            modulationDepthSlider.addEventListener('input', function() {
                modulatorGain.gain.value = parseFloat(this.value);
            });
            
            modulationFreqSlider.addEventListener('input', function() {
                modulatorOsc.frequency.value = parseFloat(this.value);
            });
            
            harmonicsLevelSlider.addEventListener('input', function() {
                harmonicsGain.gain.value = parseFloat(this.value);
            });
            
            filterCutoffSlider.addEventListener('input', function() {
                filterNode.frequency.value = parseFloat(this.value);
            });
            
            filterResonanceSlider.addEventListener('input', function() {
                filterNode.Q.value = parseFloat(this.value);
            });
            
            reverbMixSlider.addEventListener('input', function() {
                const wetAmount = parseFloat(this.value);
                wetGain.gain.value = wetAmount;
                dryGain.gain.value = 1 - wetAmount;
            });
            
            noiseVolumeSlider.addEventListener('input', function() {
                noiseGain.gain.value = parseFloat(this.value);
            });
            
            delayTimeSlider.addEventListener('input', function() {
                delayNode.delayTime.value = parseFloat(this.value);
            });
            
            delayFeedbackSlider.addEventListener('input', function() {
                delayFeedback.gain.value = parseFloat(this.value);
            });
            
            phaserRateSlider.addEventListener('input', function() {
                phaserLFO.frequency.value = parseFloat(this.value);
            });
            
            phaserDepthSlider.addEventListener('input', function() {
                phaserGain.gain.value = 300 * parseFloat(this.value);
            });
            
            subOscVolumeSlider.addEventListener('input', function() {
                subOscGain.gain.value = parseFloat(this.value);
            });
            
            // Configure stereo width
            stereoWidthSlider.addEventListener('input', function() {
                updateStereoField();
            });
            
            // Update stereo field based on slider value
            function updateStereoField() {
                const width = parseFloat(stereoWidthSlider.value);
                // Adjust the balance between center and sides
                // At 0, everything is center, at 1 we maximize the stereo spread
                const centerAmount = 1 - width * 0.5;
                const sideAmount = width * 0.5;
                
                // Center channel gets reduced as width increases
                centerGain.gain.value = centerAmount;
                // Left and right get boosted by the same amount for balance
                leftGain.gain.value = 0.5 + sideAmount;
                rightGain.gain.value = 0.5 + sideAmount;
            }
            
            // Initialize stereo field
            updateStereoField();
            
            return true;
        } catch (e) {
            console.error('Web Audio API is not supported in this browser', e);
            return false;
        }
    }
    
    // Function to update audio based on particle state
    function updateSonification() {
        if (!audioContext || !soundCheckbox.checked) return;
        
        // Count particles on nodes and calculate average velocity
        let nodalParticles = 0;
        let avgVelocity = 0;
        let maxVelocity = 0;
        let leftSideCount = 0;
        let rightSideCount = 0;
        let topCount = 0;
        let bottomCount = 0;
        
        // Track velocity directions
        let vxSum = 0;
        let vySum = 0;
        
        // Store particle information by position for stereo field
        const leftSideParticles = [];
        const rightSideParticles = [];
        const centerParticles = [];
        
        // Reset all particle oscillators to not in use
        particleOscillators.forEach(po => {
            po.inUse = false;
            po.gain.gain.value = 0; // Silence unused oscillators
        });
        
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const velocity = Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.y * p.velocity.y);
            
            avgVelocity += velocity;
            maxVelocity = Math.max(maxVelocity, velocity);
            vxSum += p.velocity.x;
            vySum += p.velocity.y;
            
            if (p.onNode) {
                nodalParticles++;
            }
            
            // Categorize particles by position for stereo field
            const normalizedX = p.position.x / (bounds.right - bounds.left); // -0.5 to 0.5
            
            // Store particle data with its properties for sonification
            const particleData = {
                velocity,
                normalizedX,
                normalizedY: p.position.y / (bounds.top - bounds.bottom),
                onNode: p.onNode
            };
            
            // Track spatial distribution
            if (p.position.x < 0) {
                leftSideCount++;
                leftSideParticles.push(particleData);
            } else if (p.position.x > 0) {
                rightSideCount++;
                rightSideParticles.push(particleData);
            } else {
                centerParticles.push(particleData);
            }
            
            if (p.position.y > 0) {
                topCount++;
            } else {
                bottomCount++;
            }
        }
        
        // Calculate averages and ratios
        avgVelocity = avgVelocity / particles.length;
        const vxAvg = vxSum / particles.length;
        const vyAvg = vySum / particles.length;
        const nodalRatio = nodalParticles / particles.length;
        const horizontalBalance = (leftSideCount - rightSideCount) / particles.length;
        const verticalBalance = (topCount - bottomCount) / particles.length;
        
        // Adjust audio parameters based on particle behavior
        if (oscillator && filterNode && modulatorOsc && harmonicsOsc) {
            // Modulation frequency based on average velocity
            modulatorOsc.frequency.value = Math.max(0.1, Math.min(20, parseFloat(modulationFreqSlider.value) + avgVelocity * 2));
            
            // Filter cutoff based on force strength and particle count
            filterNode.frequency.value = Math.max(50, Math.min(15000, parseFloat(filterCutoffSlider.value) + (forceStrength * 100)));
            
            // Harmonics frequency based on nodal line patterns
            harmonicsOsc.frequency.value = baseFrequency * (1 + 0.5 * nodalRatio);
            
            // Secondary parameters
            // Add a slight detuning based on simulation speed and horizontal movement
            oscillator.detune.value = simulationSpeed * 50 + vxAvg * 20;
            
            // Update the noise components based on simulation state
            if (noiseFilter) {
                noiseFilter.frequency.value = 200 + 2000 * Math.abs(verticalBalance);
            }
            
            // Delay: adjust time slightly based on pattern complexity
            if (delayNode) {
                // Small variations around the user setting
                const baseDelay = parseFloat(delayTimeSlider.value);
                delayNode.delayTime.value = Math.max(0.01, Math.min(1, baseDelay + (nodalRatio * 0.1)));
            }
            
            // Phaser: adjust rate based on particle movement
            if (phaserLFO) {
                // Vary rate with avg velocity
                const baseRate = parseFloat(phaserRateSlider.value);
                phaserLFO.frequency.value = Math.max(0.1, Math.min(10, baseRate * (1 + avgVelocity)));
            }
            
            // Sub oscillator: adjust based on force strength
            if (subOscillator) {
                // Keep at half the main frequency but adjust detuning
                subOscillator.frequency.value = baseFrequency / 2;
                subOscillator.detune.value = forceStrength * -5; // Negative detune for thicker sound with higher force
            }
            
            // NEW: Sonify individual particles based on their position and speed
            const particleGain = parseFloat(particleGainSlider.value);
            const particleRange = parseFloat(particleRangeSlider.value);
            const density = parseFloat(particleDensitySlider.value);
            
            // Function to sonify a set of particles with a specific pan position
            function sonifyParticleGroup(particles, panPosition) {
                // Sort particles by velocity for priority
                particles.sort((a, b) => b.velocity - a.velocity);
                
                // Only process the fastest particles based on density setting
                // Higher density = more particles sonified
                const particlesToSonify = Math.max(1, Math.floor(particles.length * density));
                
                for (let i = 0; i < Math.min(particlesToSonify, particles.length); i++) {
                    // Find an available oscillator
                    const availableOsc = particleOscillators.find(po => !po.inUse);
                    if (!availableOsc) break; // No more oscillators available
                    
                    const particle = particles[i];
                    availableOsc.inUse = true;
                    
                    // Set panning based on normalized X position (-1 to 1)
                    availableOsc.panner.pan.value = panPosition;
                    
                    // Scale velocity to frequency range
                    // Map velocity to frequency detune within range
                    const velocityFactor = Math.min(1, particle.velocity / 2); // Cap at reasonable velocity
                    const detune = velocityFactor * 1200 * particleRange; // Up to an octave depending on range
                    
                    // Base frequency depends on position in the plate
                    const positionFactor = Math.abs(particle.normalizedY);
                    const baseFreqMultiplier = 0.5 + positionFactor; // 0.5 to 1.5x base frequency
                    
                    availableOsc.oscillator.frequency.value = baseFrequency * baseFreqMultiplier;
                    availableOsc.oscillator.detune.value = detune;
                    
                    // Set gain based on particle's speed and whether it's on a node
                    const speedGain = velocityFactor * particleGain;
                    // Particles on nodes get extra emphasis
                    const nodeBoost = particle.onNode ? 2 : 1;
                    
                    // Apply gain with smooth transition
                    availableOsc.gain.gain.setTargetAtTime(
                        speedGain * nodeBoost * 0.05, // Keep individual particles quiet
                        audioContext.currentTime,
                        0.05 // Quick but not instant transition
                    );
                }
            }
            
            // Sonify particle groups with appropriate panning
            sonifyParticleGroup(leftSideParticles, -1.0 * parseFloat(stereoWidthSlider.value));
            sonifyParticleGroup(rightSideParticles, 1.0 * parseFloat(stereoWidthSlider.value));
            sonifyParticleGroup(centerParticles, 0);
        }
    }
    
    // Initialize audio when checkbox is checked
    soundCheckbox.addEventListener('change', function() {
        if (this.checked) {
            if (!audioContext) {
                if (initAudio()) {
                    gainNode.gain.value = 0.2; // Unmute
                    // Show sonification controls
                    sonificationContainer.style.display = 'block';
                } else {
                    this.checked = false; // Failed to initialize
                    sonificationContainer.style.display = 'none';
                }
            } else {
                gainNode.gain.value = 0.2; // Unmute
                sonificationContainer.style.display = 'block';
            }
        } else if (gainNode) {
            gainNode.gain.value = 0; // Mute
            sonificationContainer.style.display = 'none';
        }
    });
    
    // Initialize audio by default since sonification is enabled by default
    if (soundCheckbox.checked) {
        initAudio();
    } else {
        // Hide sonification controls if sonification is not enabled
        sonificationContainer.style.display = 'none';
    }
    
    // Update frequency from slider
    freqSlider.addEventListener('input', function() {
        // Convert slider value to frequency using logarithmic scale
        // Map 0-100 to 0.01-20000 Hz logarithmically
        const sliderValue = parseFloat(this.value);
        const minFreq = Math.log(0.01);
        const maxFreq = Math.log(20000);
        const scale = (maxFreq - minFreq) / 100;
        
        baseFrequency = Math.exp(minFreq + scale * sliderValue);
        // Show 2 decimal places for values less than 10, otherwise round to whole numbers
        const displayFreq = baseFrequency < 10 ? baseFrequency.toFixed(2) : Math.round(baseFrequency);
        freqLabel.textContent = `Frequency: ${displayFreq} Hz`;
        
        // Update audio frequency if enabled
        if (oscillator && soundCheckbox.checked) {
            oscillator.frequency.value = baseFrequency;
        }
        
        // Update modes based on frequency
        updateModes();
    });
    
    // Update simulation speed from slider
    simSpeedSlider.addEventListener('input', function() {
        simulationSpeed = parseFloat(this.value);
        simSpeedLabel.textContent = `Particle Speed: ${simulationSpeed.toFixed(2)}`;
    });
    
    // Update force strength from slider
    forceSlider.addEventListener('input', function() {
        forceStrength = parseFloat(this.value);
        forceLabel.textContent = `Force Strength: ${forceStrength.toFixed(1)}`;
    });
    
    // Update damping from slider
    dampingSlider.addEventListener('input', function() {
        damping = parseFloat(this.value);
        dampingLabel.textContent = `Damping: ${damping.toFixed(2)}`;
    });
    
    // Function to update modes based on frequency
    function updateModes() {
        // Map frequency to modes - higher frequencies create more complex patterns
        // This creates a relationship between the audio frequency and visual patterns
        // Using a more logarithmic approach now with the expanded frequency range
        m = Math.max(2, Math.min(20, Math.floor(Math.log(baseFrequency / 20) / Math.log(20) * 10)));
        n = Math.max(2, Math.min(20, Math.ceil(Math.log(baseFrequency / 20) / Math.log(15) * 10)));
    }
    
    // Boundaries (with offset for particle size)
    const bounds = {
        left: -containerWidth / 2 + particleSize,
        right: containerWidth / 2 - particleSize,
        top: containerHeight / 2 - particleSize,
        bottom: -containerHeight / 2 + particleSize
    };
    
    // Create particles
    const particles = [];
    let geometry = new THREE.BufferGeometry();
    let positions = new Float32Array(numParticles * 3);
    
    for (let i = 0; i < numParticles; i++) {
        // Create particles randomly distributed across the plate
        const x = Math.random() * (bounds.right - bounds.left) + bounds.left;
        const y = Math.random() * (bounds.top - bounds.bottom) + bounds.bottom;
        const z = 0;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Store particle data for physics
        particles.push({
            position: new THREE.Vector2(x, y),
            velocity: new THREE.Vector2(0, 0),
            index: i,
            onNode: false, // Track if particle is on a node
            mass: 1 + Math.random() * 0.5 // Random mass for more interesting collisions
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create point material
    const material = new THREE.PointsMaterial({
        color: 0x000000,
        size: particleSize,
        sizeAttenuation: false
    });
    
    let pointSystem = new THREE.Points(geometry, material);
    scene.add(pointSystem);
    
    // Update loop
    let positionAttribute = geometry.getAttribute('position');
    let time = 0;
    
    // Function to add new particles at the specified position
    function addParticle(x, y) {
        const newIndex = particles.length;
        
        // Create a new particle
        particles.push({
            position: new THREE.Vector2(x, y),
            velocity: new THREE.Vector2((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2),
            index: newIndex,
            onNode: false,
            mass: 1 + Math.random() * 0.5 // Random mass
        });
        
        // Rebuild geometry with new particle
        rebuildGeometry();
    }
    
    // Function to rebuild the geometry when particles are added
    function rebuildGeometry() {
        // Remove old point system
        scene.remove(pointSystem);
        
        // Create new geometry with all particles
        const newPositions = new Float32Array(particles.length * 3);
        
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            particle.index = i; // Update index
            
            newPositions[i * 3] = particle.position.x;
            newPositions[i * 3 + 1] = particle.position.y;
            newPositions[i * 3 + 2] = 0;
        }
        
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
        
        // Create new point system
        pointSystem = new THREE.Points(geometry, material);
        scene.add(pointSystem);
        
        // Update reference to position attribute
        positionAttribute = geometry.getAttribute('position');
    }
    
    // Mouse event listeners for particle spawning
    canvas.addEventListener('mousedown', function(event) {
        isMouseDown = true;
        updateMousePosition(event);
    });
    
    canvas.addEventListener('mousemove', function(event) {
        updateMousePosition(event);
    });
    
    window.addEventListener('mouseup', function() {
        isMouseDown = false;
    });
    
    // Convert mouse coordinates to simulation coordinates
    function updateMousePosition(event) {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * containerWidth - containerWidth / 2;
        const y = -((event.clientY - rect.top) / rect.height) * containerHeight + containerHeight / 2;
        
        mouseX = x;
        mouseY = y;
    }
    
    // Function to calculate Chladni plate wave amplitude at position (x, y)
    function chladniWaveAmplitude(x, y, m, n, time) {
        // Normalize coordinates to [0, 1] for wave calculation
        const normX = (x - bounds.left) / (bounds.right - bounds.left);
        const normY = (y - bounds.bottom) / (bounds.top - bounds.bottom);
        
        // Classic Chladni pattern equation: standing waves in two dimensions
        return Math.sin(m * Math.PI * normX) * Math.sin(n * Math.PI * normY) * Math.cos(baseFrequency * time);
    }
    
    // Function to calculate gradient of wave function (for force direction)
    function chladniGradient(x, y, m, n, time) {
        // Normalize coordinates
        const normX = (x - bounds.left) / (bounds.right - bounds.left);
        const normY = (y - bounds.bottom) / (bounds.top - bounds.bottom);
        
        // Width and height for derivative scaling
        const width = bounds.right - bounds.left;
        const height = bounds.top - bounds.bottom;
        
        // Partial derivatives of the Chladni equation with respect to x and y
        const dx = (m * Math.PI / width) * Math.cos(m * Math.PI * normX) * Math.sin(n * Math.PI * normY) * Math.cos(baseFrequency * time);
        const dy = (n * Math.PI / height) * Math.sin(m * Math.PI * normX) * Math.cos(n * Math.PI * normY) * Math.cos(baseFrequency * time);
        
        return { dx, dy };
    }
    
    function updateParticles() {
        // Increment time at simulation speed
        time += simulationSpeed;
        frameCount++;
        
        // Update audio sonification based on particle state
        if (frameCount % 10 === 0) { // Update audio less frequently for performance
            updateSonification();
        }
        
        // Handle particle spawning on mouse click-and-hold
        if (isMouseDown && frameCount % spawnInterval === 0) {
            // Spawn multiple particles at once for faster accumulation
            for (let i = 0; i < particlesPerSpawn; i++) {
                // Add slight randomness to spawn position
                const spawnX = mouseX + (Math.random() - 0.5) * 8;
                const spawnY = mouseY + (Math.random() - 0.5) * 8;
                
                // Only spawn if within bounds
                if (spawnX > bounds.left && spawnX < bounds.right && 
                    spawnY > bounds.bottom && spawnY < bounds.top) {
                    addParticle(spawnX, spawnY);
                }
            }
        }
        
        // Update spatial grid for collision detection
        updateSpatialGrid();
        
        // First pass: Update velocities based on Chladni forces and detect collisions
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Calculate Chladni wave amplitude at particle position
            const amplitude = chladniWaveAmplitude(
                particle.position.x, 
                particle.position.y, 
                m, n, time
            );
            
            // Check if particle is on a nodal line (where amplitude is near zero)
            particle.onNode = Math.abs(amplitude) < nodeTolerance;
            
            // If particle is already on a node, add just a tiny bit of random motion
            // to prevent particles from stacking perfectly on top of each other
            if (particle.onNode) {
                particle.velocity.x += (Math.random() - 0.5) * 0.02;
                particle.velocity.y += (Math.random() - 0.5) * 0.02;
            } 
            // If not on a node, calculate force to push toward nodal lines
            else {
                const gradient = chladniGradient(
                    particle.position.x, 
                    particle.position.y, 
                    m, n, time
                );
                
                // The key: particles move down the gradient of wave amplitude squared
                // This pushes them toward nodes (where amplitude = 0)
                particle.velocity.x -= gradient.dx * forceStrength * amplitude;
                particle.velocity.y -= gradient.dy * forceStrength * amplitude;
                
                // Add a small amount of random motion to help particles not get stuck
                particle.velocity.x += (Math.random() - 0.5) * 0.05;
                particle.velocity.y += (Math.random() - 0.5) * 0.05;
            }
            
            // Handle collisions with other particles
            const nearbyParticles = getNearbyParticles(particle.position.x, particle.position.y);
            
            for (let j = 0; j < nearbyParticles.length; j++) {
                const otherIndex = nearbyParticles[j];
                if (otherIndex === i) continue; // Skip self
                
                const other = particles[otherIndex];
                
                // Calculate distance between particles
                const dx = other.position.x - particle.position.x;
                const dy = other.position.y - particle.position.y;
                const distanceSquared = dx * dx + dy * dy;
                const distance = Math.sqrt(distanceSquared);
                
                // Check for collision
                if (distance < minDistance && distance > 0) {
                    // Calculate collision normal
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // Calculate relative velocity
                    const rvx = other.velocity.x - particle.velocity.x;
                    const rvy = other.velocity.y - particle.velocity.y;
                    
                    // Calculate relative velocity along normal
                    const velAlongNormal = rvx * nx + rvy * ny;
                    
                    // Only resolve if objects are moving toward each other
                    if (velAlongNormal < 0) {
                        // Calculate impulse scalar (simplified)
                        const totalMass = particle.mass + other.mass;
                        const j = -(1 + collisionDamping) * velAlongNormal;
                        const impulseScalar = j / totalMass;
                        
                        // Apply impulse
                        const impulseX = impulseScalar * nx;
                        const impulseY = impulseScalar * ny;
                        
                        particle.velocity.x -= impulseX * other.mass / totalMass;
                        particle.velocity.y -= impulseY * other.mass / totalMass;
                        other.velocity.x += impulseX * particle.mass / totalMass;
                        other.velocity.y += impulseY * particle.mass / totalMass;
                        
                        // Separation (prevent sticking)
                        const overlap = minDistance - distance;
                        const separationX = nx * overlap * 0.5;
                        const separationY = ny * overlap * 0.5;
                        
                        particle.position.x -= separationX;
                        particle.position.y -= separationY;
                        other.position.x += separationX;
                        other.position.y += separationY;
                    }
                }
            }
            
            // Apply a tiny bit of virtual gravity if needed (generally set to 0)
            particle.velocity.y -= gravity;
            
            // Update position
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
            
            // Apply damping - stronger damping if on a node to help particles settle
            particle.velocity.x *= particle.onNode ? 0.5 : damping;
            particle.velocity.y *= particle.onNode ? 0.5 : damping;
            
            // Handle toroidal wrapping (loop around edges)
            // Calculate width and height of simulation area
            const width = bounds.right - bounds.left;
            const height = bounds.top - bounds.bottom;
            
            // Wrap around horizontally
            if (particle.position.x < bounds.left) {
                particle.position.x = bounds.right;
            } else if (particle.position.x > bounds.right) {
                particle.position.x = bounds.left;
            }
            
            // Wrap around vertically
            if (particle.position.y < bounds.bottom) {
                particle.position.y = bounds.top;
            } else if (particle.position.y > bounds.top) {
                particle.position.y = bounds.bottom;
            }
            
            // Update the position in the geometry
            positionAttribute.setXYZ(
                i,
                particle.position.x,
                particle.position.y,
                0
            );
        }
        
        positionAttribute.needsUpdate = true;
    }
    
    // Set initial modes
    updateModes();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        updateParticles();
        renderer.render(scene, camera);
    }
    
    // Resize handler
    function handleResize() {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        // Update camera
        camera.left = -newWidth / 2;
        camera.right = newWidth / 2;
        camera.top = newHeight / 2;
        camera.bottom = -newHeight / 2;
        camera.updateProjectionMatrix();
        
        // Update renderer
        renderer.setSize(newWidth, newHeight);
        
        // Update boundaries
        bounds.left = -newWidth / 2 + particleSize;
        bounds.right = newWidth / 2 - particleSize;
        bounds.top = newHeight / 2 - particleSize;
        bounds.bottom = -newHeight / 2 + particleSize;
    }
    
    window.addEventListener('resize', handleResize);
    
    // Start animation
    animate();
    
    // Return cleanup function if needed
    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mouseup', function() {
            isMouseDown = false;
        });
        
        // Clear frequency play interval if active
        if (frequencyPlayInterval) {
            clearInterval(frequencyPlayInterval);
        }
        
        // Remove the controls from the document body
        if (document.body.contains(controlsContainer)) {
            document.body.removeChild(controlsContainer);
        }
        
        if (oscillator) {
            oscillator.stop();
        }
        if (audioContext) {
            audioContext.close();
        }
        renderer.dispose();
    };
} 