// Lenia Simulation Module
// Core simulation logic using WebGL

import { generateUpdateShaderSource } from './kernels.js';
import { vertexShaderSource, renderShaderSource } from './shaders.js';

export class LeniaSimulation {
    constructor(canvasId, config, patterns, kernels) {
        this.canvas = document.getElementById(canvasId);
        
        if (!this.canvas) {
            throw new Error(`Canvas element with ID '${canvasId}' was not found. Check your HTML.`);
        }
        
        this.gl = this.canvas.getContext('webgl', {
            preserveDrawingBuffer: true,
            antialias: false
        });
        
        if (!this.gl) {
            throw new Error('WebGL not supported by your browser!');
        }
        
        // Check extension availability
        const ext = this.gl.getExtension('OES_texture_float');
        if (!ext) {
            console.warn('OES_texture_float not supported - falling back to UNSIGNED_BYTE textures');
            this.useFloatTextures = false;
        } else {
            this.useFloatTextures = true;
        }
        
        // Store references to config and patterns
        this.config = config;
        this.patterns = patterns;
        this.kernels = kernels;
        
        // Initialize simulation state
        this.isRunning = true;
        this.lastTime = 0;
        this.frameCount = 0;
        
        // User interaction state
        this.isDrawing = false;
        this.lastDrawX = null;
        this.lastDrawY = null;
        
        // Zoom and pan state
        this.zoomFactor = 1.0;
        this.panOffsetX = 0;
        this.panOffsetY = 0;
        this.isPanning = false;
        this.lastPanX = null;
        this.lastPanY = null;
        
        // Initialize dimensions first to avoid zero-size textures
        this.simulationWidth = 512;  // Default size until resize
        this.simulationHeight = 512; // Default size until resize
        
        // Grid size (cells per unit)
        this.gridSize = this.config.params.gridSize || 100;
        
        // Initialize WebGL
        this.initGL();
        
        // Set up the interaction
        this.setupInteraction();
        
        // Resize canvas and recreate textures
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }
    
    initGL() {
        const gl = this.gl;
        
        // Create vertex buffer for a full-screen quad
        const vertices = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0
        ]);
        
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Create shader programs
        this.createShaderPrograms();
    }
    
    createShaderPrograms() {
        const gl = this.gl;
        
        // Create render shader program
        this.renderProgram = this.createShaderProgram(vertexShaderSource, renderShaderSource);
        
        // Check if render program was created successfully
        if (!this.renderProgram) {
            console.error('Failed to create render shader program');
            return;
        }
        
        // Get attribute and uniform locations for render program
        this.renderProgram.attributes = {
            position: gl.getAttribLocation(this.renderProgram, 'a_position')
        };
        this.renderProgram.uniforms = {
            texture: gl.getUniformLocation(this.renderProgram, 'u_texture'),
            colorScheme: gl.getUniformLocation(this.renderProgram, 'u_colorScheme'),
            enableDither: gl.getUniformLocation(this.renderProgram, 'u_enableDither'),
            ditherAmount: gl.getUniformLocation(this.renderProgram, 'u_ditherAmount'),
            enableBloom: gl.getUniformLocation(this.renderProgram, 'u_enableBloom'),
            bloomIntensity: gl.getUniformLocation(this.renderProgram, 'u_bloomIntensity'),
            bloomRadius: gl.getUniformLocation(this.renderProgram, 'u_bloomRadius'),
            zoomFactor: gl.getUniformLocation(this.renderProgram, 'u_zoomFactor'),
            panOffset: gl.getUniformLocation(this.renderProgram, 'u_panOffset')
        };
        
        // Create update shader program with current kernel
        this.updateKernelType(this.config.params.kernelType);
    }
    
    updateKernelType(kernelType) {
        const gl = this.gl;
        
        // Generate update shader source with the selected kernel
        const updateShaderSource = generateUpdateShaderSource(kernelType);
        
        // Create update shader program
        this.updateProgram = this.createShaderProgram(vertexShaderSource, updateShaderSource);
        
        // Check if update program was created successfully
        if (!this.updateProgram) {
            console.error('Failed to create update shader program');
            return;
        }
        
        // Get attribute and uniform locations for update program
        this.updateProgram.attributes = {
            position: gl.getAttribLocation(this.updateProgram, 'a_position')
        };
        this.updateProgram.uniforms = {
            texture: gl.getUniformLocation(this.updateProgram, 'u_texture'),
            resolution: gl.getUniformLocation(this.updateProgram, 'u_resolution'),
            growthCenter: gl.getUniformLocation(this.updateProgram, 'u_growthCenter'),
            growthWidth: gl.getUniformLocation(this.updateProgram, 'u_growthWidth'),
            timeScale: gl.getUniformLocation(this.updateProgram, 'u_timeScale'),
            kernelRadius: gl.getUniformLocation(this.updateProgram, 'u_kernelRadius')
        };
    }
    
    createShaderProgram(vsSource, fsSource) {
        const gl = this.gl;
        
        // Compile shaders with detailed error checking
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        // Check if shaders were successfully compiled
        if (!vertexShader || !fragmentShader) {
            console.error('Failed to compile shaders - cannot create shader program');
            return null;
        }
        
        // Create and link the program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const infoLog = gl.getProgramInfoLog(program);
            console.error('Shader program linking failed:', infoLog);
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            return null;
        }
        
        // Cleanup shaders - they're linked to the program now and no longer needed separately
        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
        return program;
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const infoLog = gl.getShaderInfoLog(shader);
            const shaderType = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
            console.error(`${shaderType} shader compilation failed:`, infoLog);
            
            // Debug: output the problematic shader code with line numbers
            console.debug('Shader source:');
            const lines = source.split('\n');
            lines.forEach((line, i) => {
                console.debug(`${i+1}: ${line}`);
            });
            
            // Try to parse error messages to highlight the problematic lines
            const errorLines = new Set();
            const errorLineRegex = /ERROR:\s*\d+:(\d+):/g;
            let match;
            while ((match = errorLineRegex.exec(infoLog)) !== null) {
                errorLines.add(parseInt(match[1]));
            }
            
            if (errorLines.size > 0) {
                console.error('Errors found in the following lines:');
                errorLines.forEach(lineNum => {
                    if (lineNum > 0 && lineNum <= lines.length) {
                        console.error(`Line ${lineNum}: ${lines[lineNum-1]}`);
                    }
                });
            }
            
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createTextures() {
        const gl = this.gl;
        const width = this.simulationWidth;
        const height = this.simulationHeight;
        
        console.log(`Creating textures with dimensions: ${width}x${height}`);
        
        // Ensure we have valid dimensions
        if (width <= 0 || height <= 0) {
            console.error(`Invalid texture dimensions: ${width}x${height}`);
            return;
        }
        
        // Create textures
        this.textures = [
            this.createTexture(width, height),
            this.createTexture(width, height)
        ];
        
        // Create drawing texture for user interaction
        this.drawingTexture = this.createTexture(width, height);
        
        // Create framebuffers
        this.framebuffers = [
            this.createFramebuffer(this.textures[0]),
            this.createFramebuffer(this.textures[1])
        ];
        
        // Create drawing framebuffer
        this.drawingFramebuffer = this.createFramebuffer(this.drawingTexture);
        
        this.currentTexture = 0;
        
        // Initialize with a pattern
        this.resetSimulation();
    }
    
    createTexture(width, height) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // Use UNSIGNED_BYTE format for better compatibility
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        return texture;
    }
    
    createFramebuffer(texture) {
        const gl = this.gl;
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        // Check framebuffer is complete
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete:', status);
        }
        
        return framebuffer;
    }
    
    resizeCanvas() {
        // Get the simulation container dimensions
        const container = this.canvas.parentElement;
        if (!container) {
            console.error('Canvas parent element not found');
            return;
        }
        
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        
        console.log(`Container dimensions: ${width}x${height}`);
        
        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Calculate simulation dimensions based on grid size
        const gridSize = this.config.params.gridSize || 100; // Default grid size
        
        // Calculate dimensions based on aspect ratio and grid size
        const aspectRatio = width / height;
        if (aspectRatio >= 1) {
            // Landscape or square
            this.simulationHeight = gridSize;
            this.simulationWidth = Math.round(gridSize * aspectRatio);
        } else {
            // Portrait
            this.simulationWidth = gridSize;
            this.simulationHeight = Math.round(gridSize / aspectRatio);
        }
        
        console.log(`New simulation dimensions: ${this.simulationWidth}x${this.simulationHeight}`);
        
        // Clean up old textures if they exist
        if (this.textures) {
            const gl = this.gl;
            
            // Delete old textures and framebuffers
            for (let i = 0; i < 2; i++) {
                if (this.textures[i]) gl.deleteTexture(this.textures[i]);
                if (this.framebuffers[i]) gl.deleteFramebuffer(this.framebuffers[i]);
            }
            
            if (this.drawingTexture) gl.deleteTexture(this.drawingTexture);
            if (this.drawingFramebuffer) gl.deleteFramebuffer(this.drawingFramebuffer);
        }
        
        // Create new textures
        this.createTextures();
        
        // Set the viewport
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    initializePattern(patternName) {
        const gl = this.gl;
        const width = this.simulationWidth;
        const height = this.simulationHeight;
        
        // Ensure we have valid dimensions
        if (width <= 0 || height <= 0 || !this.textures || !this.textures[0]) {
            console.error('Cannot initialize pattern with invalid state');
            return;
        }
        
        // Get the pattern data
        const pattern = this.patterns[patternName] || this.patterns.random;
        const textureData = pattern(gl, width, height);
        
        // Upload the pattern data to both textures
        for (let i = 0; i < 2; i++) {
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
        }
        
        // Clear the drawing texture
        const emptyData = new Uint8Array(width * height * 4).fill(0);
        gl.bindTexture(gl.TEXTURE_2D, this.drawingTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, emptyData);
        
        // Update the current pattern in config
        this.config.updateParam('currentPattern', patternName);
    }
    
    resetSimulation() {
        this.initializePattern(this.config.params.currentPattern);
    }
    
    updateSimulation() {
        if (!this.isRunning || !this.textures || !this.framebuffers || !this.updateProgram) return;
        
        const gl = this.gl;
        
        // Apply any user drawing to the current texture
        this.applyDrawing();
        
        // Use the update shader program
        gl.useProgram(this.updateProgram);
        
        // Bind the source texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[this.currentTexture]);
        gl.uniform1i(this.updateProgram.uniforms.texture, 0);
        
        // Set uniforms
        gl.uniform2f(this.updateProgram.uniforms.resolution, this.simulationWidth, this.simulationHeight);
        gl.uniform1f(this.updateProgram.uniforms.growthCenter, this.config.params.growthCenter);
        gl.uniform1f(this.updateProgram.uniforms.growthWidth, this.config.params.growthWidth);
        gl.uniform1f(this.updateProgram.uniforms.timeScale, this.config.params.timeScale);
        gl.uniform1f(this.updateProgram.uniforms.kernelRadius, this.config.params.kernelRadius);
        
        // Set the vertex attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.updateProgram.attributes.position);
        gl.vertexAttribPointer(this.updateProgram.attributes.position, 2, gl.FLOAT, false, 0, 0);
        
        // Bind the destination framebuffer
        const nextTexture = (this.currentTexture + 1) % 2;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[nextTexture]);
        gl.viewport(0, 0, this.simulationWidth, this.simulationHeight);
        
        // Draw the full-screen quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Swap textures
        this.currentTexture = nextTexture;
    }
    
    renderSimulation() {
        if (!this.textures || !this.renderProgram) return;
        
        const gl = this.gl;
        
        // Use the render shader program
        gl.useProgram(this.renderProgram);
        
        // Pass zoom and pan uniforms
        if (this.renderProgram.uniforms.zoomFactor) {
            gl.uniform1f(this.renderProgram.uniforms.zoomFactor, this.zoomFactor);
        }
        if (this.renderProgram.uniforms.panOffset) {
            gl.uniform2f(this.renderProgram.uniforms.panOffset, this.panOffsetX, this.panOffsetY);
        }
        
        // Bind the current state texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textures[this.currentTexture]);
        gl.uniform1i(this.renderProgram.uniforms.texture, 0);
        
        // Set render uniforms
        gl.uniform1i(this.renderProgram.uniforms.colorScheme, this.config.params.colorScheme);
        gl.uniform1i(this.renderProgram.uniforms.enableDither, this.config.params.enableDither ? 1 : 0);
        gl.uniform1f(this.renderProgram.uniforms.ditherAmount, this.config.params.ditherAmount);
        gl.uniform1i(this.renderProgram.uniforms.enableBloom, this.config.params.enableBloom ? 1 : 0);
        gl.uniform1f(this.renderProgram.uniforms.bloomIntensity, this.config.params.bloomIntensity);
        gl.uniform1f(this.renderProgram.uniforms.bloomRadius, this.config.params.bloomRadius);
        
        // Set the vertex attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.renderProgram.attributes.position);
        gl.vertexAttribPointer(this.renderProgram.attributes.position, 2, gl.FLOAT, false, 0, 0);
        
        // Render to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the full-screen quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    setupInteraction() {
        // Mouse and touch event handling
        this.canvas.addEventListener('mousedown', this.handlePointerStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePointerEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handlePointerEnd.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handlePointerEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handlePointerEnd.bind(this));
        
        // Zoom events
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this));
        
        // Add panning with middle mouse button
        this.canvas.addEventListener('mousedown', this.handlePanStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handlePanMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePanEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handlePanEnd.bind(this));
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.handlePointerStart({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handlePointerStart(e) {
        this.isDrawing = true;
        this.draw(e);
    }
    
    handlePointerMove(e) {
        if (!this.isDrawing) return;
        this.draw(e);
    }
    
    handlePointerEnd() {
        this.isDrawing = false;
        this.lastDrawX = null;
        this.lastDrawY = null;
    }
    
    handleZoom(e) {
        e.preventDefault();
        
        // Determine zoom direction from wheel delta
        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        
        // Calculate zoom change based on direction
        const zoomSpeed = 0.1;
        const zoomChange = 1 + (zoomDirection * zoomSpeed);
        
        // Get mouse position relative to canvas for zoom target
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate normalized position (0-1)
        const normalizedX = mouseX / this.canvas.width;
        const normalizedY = mouseY / this.canvas.height;
        
        // Calculate simulation position before zoom
        const simX = (normalizedX - 0.5) / this.zoomFactor + 0.5 - this.panOffsetX;
        const simY = (normalizedY - 0.5) / this.zoomFactor + 0.5 - this.panOffsetY;
        
        // Apply zoom
        this.zoomFactor *= zoomChange;
        
        // Clamp zoom factor to reasonable limits
        this.zoomFactor = Math.max(0.25, Math.min(10.0, this.zoomFactor));
        
        // Update pan offset to keep mouse position fixed
        const newSimX = (normalizedX - 0.5) / this.zoomFactor + 0.5;
        const newSimY = (normalizedY - 0.5) / this.zoomFactor + 0.5;
        
        this.panOffsetX += newSimX - simX;
        this.panOffsetY += newSimY - simY;
        
        // Clamp pan offset to avoid going too far out
        const maxPan = 1 - 1/this.zoomFactor;
        this.panOffsetX = Math.max(-maxPan, Math.min(maxPan, this.panOffsetX));
        this.panOffsetY = Math.max(-maxPan, Math.min(maxPan, this.panOffsetY));
    }
    
    handlePanStart(e) {
        // Only middle mouse button (button 1) for panning
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
        }
    }
    
    handlePanMove(e) {
        if (!this.isPanning) return;
        
        const dx = e.clientX - this.lastPanX;
        const dy = e.clientY - this.lastPanY;
        
        // Convert pixel difference to normalized coordinates (scaled by zoom)
        this.panOffsetX += dx / (this.canvas.width * this.zoomFactor);
        this.panOffsetY += dy / (this.canvas.height * this.zoomFactor);
        
        // Clamp pan offset
        const maxPan = 1 - 1/this.zoomFactor;
        this.panOffsetX = Math.max(-maxPan, Math.min(maxPan, this.panOffsetX));
        this.panOffsetY = Math.max(-maxPan, Math.min(maxPan, this.panOffsetY));
        
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
    }
    
    handlePanEnd(e) {
        this.isPanning = false;
    }
    
    draw(e) {
        if (!this.textures || !this.drawingFramebuffer) return;
        
        const gl = this.gl;
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate position in canvas coordinates
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        
        // Convert to normalized coordinates (0-1)
        const normalizedX = canvasX / this.canvas.width;
        const normalizedY = canvasY / this.canvas.height;
        
        // Apply zoom and pan transformations
        const zoomedX = (normalizedX - 0.5) / this.zoomFactor + 0.5 - this.panOffsetX;
        const zoomedY = (normalizedY - 0.5) / this.zoomFactor + 0.5 - this.panOffsetY;
        
        // Convert to simulation coordinates
        const simX = Math.floor(zoomedX * this.simulationWidth);
        const simY = Math.floor(zoomedY * this.simulationHeight);
        
        // Check if coordinates are within bounds
        if (simX < 0 || simX >= this.simulationWidth || simY < 0 || simY >= this.simulationHeight) {
            return; // Outside simulation area
        }
        
        // If we have previous coordinates, interpolate between them
        if (this.lastDrawX !== null && this.lastDrawY !== null) {
            const dx = simX - this.lastDrawX;
            const dy = simY - this.lastDrawY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Only interpolate if points are not too far apart
            if (dist < 30) {
                const steps = Math.max(1, Math.ceil(dist));
                
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const x = Math.round(this.lastDrawX + dx * t);
                    const y = Math.round(this.lastDrawY + dy * t);
                    this.drawPoint(x, y);
                }
            } else {
                this.drawPoint(simX, simY);
            }
        } else {
            this.drawPoint(simX, simY);
        }
        
        this.lastDrawX = simX;
        this.lastDrawY = simY;
    }
    
    drawPoint(x, y) {
        const gl = this.gl;
        const brushSize = this.config.params.brushSize;
        const intensity = this.config.params.brushIntensity * 255;
        
        // Bind the drawing framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.drawingFramebuffer);
        gl.viewport(0, 0, this.simulationWidth, this.simulationHeight);
        
        // Create a temporary canvas for the brush
        const brushCanvas = document.createElement('canvas');
        brushCanvas.width = brushSize * 2;
        brushCanvas.height = brushSize * 2;
        const ctx = brushCanvas.getContext('2d');
        
        // Draw a gradient circle
        const gradient = ctx.createRadialGradient(
            brushSize, brushSize, 0,
            brushSize, brushSize, brushSize
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity / 255})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, brushSize * 2, brushSize * 2);
        
        // Upload the brush texture to the drawing texture
        gl.bindTexture(gl.TEXTURE_2D, this.drawingTexture);
        
        // Define the region to update
        const x1 = Math.max(0, x - brushSize);
        const y1 = Math.max(0, y - brushSize);
        const width = Math.min(brushSize * 2, this.simulationWidth - x1);
        const height = Math.min(brushSize * 2, this.simulationHeight - y1);
        
        if (width <= 0 || height <= 0) return;
        
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0,
            x1, y1, width, height,
            gl.RGBA, gl.UNSIGNED_BYTE,
            brushCanvas
        );
    }
    
    applyDrawing() {
        if (!this.textures || !this.drawingTexture) return;
        
        const gl = this.gl;
        
        // Use a simple additive blending shader to merge drawing with simulation
        // For simplicity, we'll just do a direct copy for now
        // In a full implementation, you'd want a shader for this
        
        // Read drawing texture
        const width = this.simulationWidth;
        const height = this.simulationHeight;
        const pixels = new Uint8Array(width * height * 4);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.drawingFramebuffer);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // Check if drawing texture has any non-zero pixels
        let hasDrawing = false;
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 0) {
                hasDrawing = true;
                break;
            }
        }
        
        if (!hasDrawing) return;
        
        // Read current simulation texture
        const simPixels = new Uint8Array(width * height * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.currentTexture]);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, simPixels);
        
        // Blend drawing onto simulation
        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 0) {
                simPixels[i] = Math.min(255, simPixels[i] + pixels[i]);
                simPixels[i+1] = Math.min(255, simPixels[i+1] + pixels[i+1]);
                simPixels[i+2] = Math.min(255, simPixels[i+2] + pixels[i+2]);
            }
        }
        
        // Upload merged result back to simulation texture
        gl.bindTexture(gl.TEXTURE_2D, this.textures[this.currentTexture]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, simPixels);
        
        // Clear drawing texture
        const emptyData = new Uint8Array(width * height * 4).fill(0);
        gl.bindTexture(gl.TEXTURE_2D, this.drawingTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, emptyData);
    }
    
    start() {
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }
    
    animate(time) {
        // Calculate time delta
        const dt = Math.min(time - this.lastTime, 50); // Cap at 50ms
        this.lastTime = time;
        
        // Update and render
        this.updateSimulation();
        this.renderSimulation();
        
        // Request next frame
        requestAnimationFrame((t) => this.animate(t));
    }
} 