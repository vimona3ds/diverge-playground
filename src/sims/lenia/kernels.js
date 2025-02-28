// Lenia Kernels Module
// Defines kernel functions for Lenia simulation

// Helper function to calculate Gaussian
export function gaussian(x, a, b) {
    return Math.exp(-Math.pow(x - a, 2) / Math.pow(b, 2));
}

// Define kernels with their shader code implementations
export const kernels = {
    // Standard Gaussian kernel (original Lenia)
    gaussian: {
        name: "Gaussian",
        description: "Standard symmetric kernel (original Lenia)",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                return gaussian(d, 0.5, 0.15);
            }
        `
    },
    
    // Ring kernel - creates circular waves
    ring: {
        name: "Ring",
        description: "Ring-shaped kernel that produces wave-like patterns",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                return gaussian(d, 0.7, 0.1);
            }
        `
    },
    
    // Bipolar kernel - creates attraction and repulsion zones
    bipolar: {
        name: "Bipolar",
        description: "Creates areas of attraction and repulsion",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Inner zone (attraction)
                float inner = gaussian(d, 0.2, 0.1) * 0.5;
                
                // Outer zone (repulsion)
                float outer = -gaussian(d, 0.6, 0.2) * 0.5;
                
                return inner + outer + 0.5;
            }
        `
    },
    
    // Multi-ring kernel - creates complex wave interactions
    multiRing: {
        name: "Multi-Ring",
        description: "Multiple concentric rings creating complex wave patterns",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Three rings at different distances
                float ring1 = gaussian(d, 0.3, 0.05) * 0.5;
                float ring2 = gaussian(d, 0.6, 0.05) * 0.3;
                float ring3 = gaussian(d, 0.9, 0.05) * 0.2;
                
                return ring1 + ring2 + ring3;
            }
        `
    },
    
    // Directional kernel - creates movement in a specific direction
    directional: {
        name: "Directional",
        description: "Asymmetric kernel that creates directional movement",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Use texCoord to get consistent direction
                vec2 dir = v_texCoord - vec2(0.5, 0.5);
                float angle = atan(dir.y, dir.x);
                
                // Calculate normalized position relative to center
                // (We need this in the convolution calculation)
                vec2 normPos = vec2(cos(angle), sin(angle)) * d;
                
                // Directional bias (stronger in one direction)
                float dirBias = cos(angle) * 0.3 + 0.7;
                
                return gaussian(d, 0.5, 0.15) * dirBias;
            }
        `
    },
    
    // Predator-prey kernel - creates chasing behavior
    predatorPrey: {
        name: "Predator-Prey",
        description: "Creates predator-prey like interactions",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Predator zone (center)
                float predator = gaussian(d, 0.2, 0.2);
                
                // Prey zone (ring)
                float prey = -gaussian(d, 0.6, 0.1);
                
                return predator + prey + 0.2;
            }
        `
    },
    
    // Fractal kernel - creates detailed multi-scale patterns
    fractal: {
        name: "Fractal",
        description: "Multi-scale patterns with fractal-like behavior",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Multi-scale rings
                float scale1 = gaussian(d, 0.2, 0.05);
                float scale2 = gaussian(d, 0.4, 0.05) * 0.75;
                float scale3 = gaussian(d, 0.6, 0.05) * 0.5;
                float scale4 = gaussian(d, 0.8, 0.05) * 0.25;
                
                return scale1 - scale2 + scale3 - scale4;
            }
        `
    },
    
    // Oscillating kernel - creates pulsating behaviors
    oscillating: {
        name: "Oscillating",
        description: "Creates pulsating, oscillating patterns",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Oscillating pattern
                float freq = 10.0;
                float wave = sin(d * freq) * 0.5 * exp(-d * 3.0) + 0.5;
                
                return wave * gaussian(d, 0.5, 0.5);
            }
        `
    },
    
    // SmoothLife kernel - inspired by SmoothLife CA
    smoothLife: {
        name: "SmoothLife",
        description: "Inspired by SmoothLife cellular automata",
        shaderCode: `
            float kernel(float r, float kernelRadius) {
                float d = r / kernelRadius;
                if (d > 1.0) return 0.0;
                
                // Inner circle (negative)
                float inner = step(d, 0.25) * -1.0;
                
                // Outer ring (positive)
                float outer = step(0.25, d) * step(d, 0.65);
                
                return (inner + outer) * 0.5 + 0.5;
            }
        `
    }
};

// Generate complete update shader source with a specific kernel
export function generateUpdateShaderSource(kernelType) {
    const selectedKernel = kernels[kernelType] || kernels.gaussian;
    
    return `
    precision highp float;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_growthCenter;
    uniform float u_growthWidth;
    uniform float u_timeScale;
    uniform float u_kernelRadius;
    
    // Helper function to calculate Gaussian
    float gaussian(float x, float a, float b) {
        return exp(-pow(x - a, 2.0) / pow(b, 2.0));
    }
    
    // Kernel function (dynamically inserted based on selection)
    ${selectedKernel.shaderCode}
    
    void main() {
        vec2 texCoord = v_texCoord;
        vec2 onePixel = 1.0 / u_resolution;
        
        // Current cell state
        float state = texture2D(u_texture, texCoord).r;
        
        // Calculate the convolution with the kernel
        float sum = 0.0;
        float radius = u_kernelRadius; // Use float for calculations
        int radiusInt = int(radius); // Convert to int for loop comparisons
        
        for (int y = -20; y <= 20; y++) {
            // Type-safe comparison: y must be within -radiusInt to radiusInt (inclusive)
            if (y < -radiusInt || y > radiusInt) continue;
            
            for (int x = -20; x <= 20; x++) {
                // Type-safe comparison: x must be within -radiusInt to radiusInt (inclusive)
                if (x < -radiusInt || x > radiusInt) continue;
                
                // Convert to float for distance calculation
                float fx = float(x);
                float fy = float(y);
                float r = sqrt(fx*fx + fy*fy);
                
                // Compare float to float for radius check
                if (r > radius) continue;
                
                vec2 offset = vec2(fx, fy) * onePixel;
                float neighbor = texture2D(u_texture, texCoord + offset).r;
                
                sum += neighbor * kernel(r, radius);
            }
        }
        
        // Growth function (Gaussian)
        float growth = gaussian(sum, u_growthCenter, u_growthWidth) * 2.0 - 1.0;
        
        // Update state with time scaling
        float newState = state + growth * u_timeScale * 0.1;
        
        // Clamp to [0, 1] to prevent out-of-range values
        newState = clamp(newState, 0.0, 1.0);
        
        gl_FragColor = vec4(newState, newState, newState, 1.0);
    }`;
} 