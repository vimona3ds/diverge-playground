// Lenia Shaders Module
// Contains the shader source code for rendering

// Vertex shader for rendering a full-screen quad
export const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Fragment shader for rendering the simulation to the screen
export const renderShaderSource = `
precision highp float;

varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform int u_colorScheme;
uniform bool u_enableDither;
uniform float u_ditherAmount;
uniform bool u_enableBloom;
uniform float u_bloomIntensity;
uniform float u_bloomRadius;
uniform float u_zoomFactor;
uniform vec2 u_panOffset;

// Improved dithering noise function
float dither(vec2 position, float amount) {
    // High-frequency noise
    float noise1 = fract(sin(dot(position + 0.5, vec2(12.9898, 78.233))) * 43758.5453);
    
    // Different frequency for more interesting texture
    float noise2 = fract(sin(dot(position * 1.5, vec2(26.6514, 36.7539))) * 50643.2341);
    
    // Combine noises for more organic look
    return ((noise1 * 0.7 + noise2 * 0.3) * 2.0 - 1.0) * amount;
}

// Apply zoom and pan to texture coordinates
vec2 applyZoomPan(vec2 texCoord) {
    // Convert to centered coordinates (-0.5 to 0.5)
    vec2 centered = texCoord - 0.5;
    
    // Apply zoom factor
    centered /= u_zoomFactor;
    
    // Apply pan offset
    centered -= u_panOffset;
    
    // Convert back to 0-1 range
    return centered + 0.5;
}

// Enhanced bloom effect with stronger glow
vec3 bloom(vec2 uv, float radius, float intensity) {
    float sum = 0.0;
    float total = 0.0;
    
    // Larger and more weighted bloom kernel
    int bloomRadiusInt = int(radius);
    
    // Increase sample radius for stronger bloom
    const int maxRadius = 12;
    int sampleRadius = bloomRadiusInt + 4;
    // Ensure we don't exceed maxRadius using explicit condition
    if (sampleRadius > maxRadius) {
        sampleRadius = maxRadius;
    }
    
    for (int i = -maxRadius; i <= maxRadius; i++) {
        // Use explicit range check instead of abs() for integers
        if (i < -sampleRadius || i > sampleRadius) continue;
        
        for (int j = -maxRadius; j <= maxRadius; j++) {
            // Use explicit range check instead of abs() for integers
            if (j < -sampleRadius || j > sampleRadius) continue;
            
            // Circular falloff for more natural bloom
            float dist = sqrt(float(i*i + j*j));
            if (dist > float(sampleRadius)) continue;
            
            // Enhanced Gaussian-like weight with stronger center
            float weight = exp(-dist * dist / (radius * 0.5));
            
            // Sample the texture with zoom applied
            vec2 sampleOffset = vec2(float(i), float(j)) / 80.0; // Reduced divisor for wider bloom
            vec2 sampleCoord = applyZoomPan(uv + sampleOffset);
            
            // Check if the sample is within bounds
            if (sampleCoord.x < 0.0 || sampleCoord.x > 1.0 || sampleCoord.y < 0.0 || sampleCoord.y > 1.0) {
                continue;
            }
            
            float sample = texture2D(u_texture, sampleCoord).r;
            
            // Apply non-linear intensity boost to bright pixels
            sample = pow(sample, 0.8); // Boost bright values
            
            sum += sample * weight;
            total += weight;
        }
    }
    
    // Ensure we don't divide by zero
    if (total <= 0.0) return vec3(0.0);
    
    float bloomValue = sum / total;
    
    // Add more vibrant color variation to the bloom
    vec3 bloomColor = vec3(
        bloomValue * 1.2,  // More red for warmer glow
        bloomValue * 0.8,  // Less green
        bloomValue * 0.7   // Even less blue
    );
    
    // Enhance overall bloom intensity
    bloomColor = pow(bloomColor, vec3(0.8)); // Boost contrast
    
    return bloomColor * intensity * 1.5; // Multiply by 1.5 for stronger effect
}

void main() {
    // Apply zoom and pan to get the correct texture coordinate
    vec2 zoomedTexCoord = v_texCoord;
    
    // Check if we have zoom factor uniform (backward compatibility)
    if (u_zoomFactor > 0.0) {
        zoomedTexCoord = applyZoomPan(v_texCoord);
        
        // Handle out-of-bounds coordinates
        if (zoomedTexCoord.x < 0.0 || zoomedTexCoord.x > 1.0 || 
            zoomedTexCoord.y < 0.0 || zoomedTexCoord.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
    }
    
    // Read the current state
    float state = texture2D(u_texture, zoomedTexCoord).r;
    
    // Apply dithering if enabled
    if (u_enableDither) {
        state += dither(v_texCoord, u_ditherAmount);
        state = clamp(state, 0.0, 1.0);
    }
    
    // Initialize with default color scheme (black on white)
    vec3 color = vec3(1.0 - state);
    
    // Apply bloom effect if enabled
    if (u_enableBloom) {
        vec3 bloomColor = bloom(v_texCoord, u_bloomRadius, u_bloomIntensity);
        
        // Mix bloom based on state and intensity - use more intense mixing
        float bloomMix = u_bloomIntensity * 1.2 * state;
        color = mix(color, bloomColor, clamp(bloomMix, 0.0, 1.0));
    }
    
    // Apply color scheme
    if (u_colorScheme == 0) {
        // Black on white (already set as default)
    } 
    else if (u_colorScheme == 1) {
        // White on black
        color = vec3(state);
    }
    else if (u_colorScheme == 2) {
        // Green scale
        color = vec3(0.0, state, 0.0);
    }
    else if (u_colorScheme == 3) {
        // Heat map (red-yellow gradient)
        color = vec3(state, state * 0.6, state * 0.1);
    }
    else if (u_colorScheme == 4) {
        // Cool blue
        color = vec3(state * 0.1, state * 0.5, state);
    }
    
    gl_FragColor = vec4(color, 1.0);
}`; 