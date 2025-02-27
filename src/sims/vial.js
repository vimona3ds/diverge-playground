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
    
    const freqSlider = document.createElement('input');
    freqSlider.type = 'range';
    freqSlider.min = '50';
    freqSlider.max = '1000';
    freqSlider.value = '100';
    freqSlider.style.width = '200px';
    freqContainer.appendChild(freqSlider);
    
    // Right side controls - sound toggle and instructions
    const rightControls = document.createElement('div');
    controlsContainer.appendChild(rightControls);
    
    const soundContainer = document.createElement('div');
    rightControls.appendChild(soundContainer);
    
    const soundCheckbox = document.createElement('input');
    soundCheckbox.type = 'checkbox';
    soundCheckbox.id = 'sound-toggle';
    soundContainer.appendChild(soundCheckbox);
    
    const soundLabel = document.createElement('label');
    soundLabel.textContent = 'Play Sound';
    soundLabel.htmlFor = 'sound-toggle';
    soundLabel.style.marginLeft = '5px';
    soundContainer.appendChild(soundLabel);
    
    // Add instruction text
    const instructionText = document.createElement('div');
    instructionText.textContent = 'Click and hold to spawn particles';
    instructionText.style.marginTop = '5px';
    instructionText.style.fontSize = '12px';
    instructionText.style.color = '#555';
    rightControls.appendChild(instructionText);
    
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
    const numParticles = Math.round(containerWidth * containerHeight * 0.25 / 25); // Fill ~25% of container
    const particleSize = 3;
    const gravity = 0; // No gravity for Chladni patterns
    const damping = 0.65; // Increased damping to allow particles to settle faster
    
    // Chladni simulation parameters
    let baseFrequency = 100; // Starting frequency in Hz
    let simulationSpeed = 0.05; // Speed multiplier for the simulation
    const forceStrength = 4.0; // Stronger force for more dramatic patterns
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
    
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            oscillator = audioContext.createOscillator();
            gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = baseFrequency;
            gainNode.gain.value = 0; // Start muted
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            
            return true;
        } catch (e) {
            console.error('Web Audio API is not supported in this browser', e);
            return false;
        }
    }
    
    // Initialize audio when checkbox is checked
    soundCheckbox.addEventListener('change', function() {
        if (this.checked) {
            if (!audioContext) {
                if (initAudio()) {
                    gainNode.gain.value = 0.2; // Unmute
                } else {
                    this.checked = false; // Failed to initialize
                }
            } else {
                gainNode.gain.value = 0.2; // Unmute
            }
        } else if (gainNode) {
            gainNode.gain.value = 0; // Mute
        }
    });
    
    // Update frequency from slider
    freqSlider.addEventListener('input', function() {
        baseFrequency = parseInt(this.value);
        freqLabel.textContent = `Frequency: ${baseFrequency} Hz`;
        
        // Update audio frequency if enabled
        if (oscillator && soundCheckbox.checked) {
            oscillator.frequency.value = baseFrequency;
        }
        
        // Update modes based on frequency
        updateModes();
    });
    
    // Function to update modes based on frequency
    function updateModes() {
        // Map frequency to modes - higher frequencies create more complex patterns
        // This creates a relationship between the audio frequency and visual patterns
        m = Math.max(2, Math.min(12, Math.floor(baseFrequency / 100)));
        n = Math.max(2, Math.min(12, Math.ceil(baseFrequency / 120)));
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
            onNode: false // Track if particle is on a node
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
            onNode: false
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
            
            // Apply a tiny bit of virtual gravity if needed (generally set to 0)
            particle.velocity.y -= gravity;
            
            // Update position
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
            
            // Apply damping - stronger damping if on a node to help particles settle
            particle.velocity.x *= particle.onNode ? 0.5 : damping;
            particle.velocity.y *= particle.onNode ? 0.5 : damping;
            
            // Constrain to boundaries
            if (particle.position.x < bounds.left) {
                particle.position.x = bounds.left;
                particle.velocity.x *= -0.5; // Bounce with energy loss
            }
            if (particle.position.x > bounds.right) {
                particle.position.x = bounds.right;
                particle.velocity.x *= -0.5;
            }
            if (particle.position.y < bounds.bottom) {
                particle.position.y = bounds.bottom;
                particle.velocity.y *= -0.5;
            }
            if (particle.position.y > bounds.top) {
                particle.position.y = bounds.top;
                particle.velocity.y *= -0.5;
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