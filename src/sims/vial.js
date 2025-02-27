import * as THREE from 'three';

// Initialize fluid simulation
export function initFluidSimulation(containerId) {
    // Setup
    const container = document.getElementById(containerId);
    const canvas = document.createElement('canvas');
    canvas.id = 'fluid-canvas';
    container.appendChild(canvas);
    
    // Container dimensions
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
    const gravity = 0.1;
    const damping = 0.98;
    const repulsionRadius = 10;
    const repulsionStrength = 0.05;
    
    // Boundaries (with offset for particle size)
    const bounds = {
        left: -containerWidth / 2 + particleSize,
        right: containerWidth / 2 - particleSize,
        top: containerHeight / 2 - particleSize,
        bottom: -containerHeight / 2 + particleSize
    };
    
    // Create particles
    const particles = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(numParticles * 3);
    
    for (let i = 0; i < numParticles; i++) {
        // Create particles in the upper part of the container
        const x = Math.random() * (bounds.right - bounds.left) + bounds.left;
        const y = Math.random() * (containerHeight / 3) + bounds.bottom;
        const z = 0;
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Store particle data for physics
        particles.push({
            position: new THREE.Vector2(x, y),
            velocity: new THREE.Vector2(0, 0),
            index: i
        });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create point material
    const material = new THREE.PointsMaterial({
        color: 0x000000,
        size: particleSize,
        sizeAttenuation: false
    });
    
    const pointSystem = new THREE.Points(geometry, material);
    scene.add(pointSystem);
    
    // Update loop
    const positionAttribute = geometry.getAttribute('position');
    
    function updateParticles() {
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            
            // Apply gravity
            particle.velocity.y -= gravity;
            
            // Apply simple fluid behavior (repulsion between particles)
            for (let j = 0; j < particles.length; j++) {
                if (i === j) continue;
                
                const other = particles[j];
                const dx = particle.position.x - other.position.x;
                const dy = particle.position.y - other.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < repulsionRadius && distance > 0) {
                    const force = repulsionStrength * (1 - distance / repulsionRadius);
                    particle.velocity.x += dx / distance * force;
                    particle.velocity.y += dy / distance * force;
                }
            }
            
            // Update position
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
            
            // Apply damping
            particle.velocity.x *= damping;
            particle.velocity.y *= damping;
            
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
        renderer.dispose();
    };
} 