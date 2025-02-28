// Lenia Patterns Module
// Defines predefined patterns for Lenia simulation initialization

export const patterns = {
    random: (gl, width, height, density = 0.5) => {
        const data = new Uint8Array(width * height * 4);
        for (let i = 0; i < data.length; i += 4) {
            const val = Math.random() < density ? Math.floor(Math.random() * 180) + 75 : 0;
            data[i] = val;
            data[i+1] = val;
            data[i+2] = val;
            data[i+3] = 255;
        }
        return data;
    },
    
    randomClusters: (gl, width, height, clusterSize = 20, clusterCount = 15) => {
        const data = new Uint8Array(width * height * 4).fill(0);
        
        // Create several random clusters
        for (let c = 0; c < clusterCount; c++) {
            const centerX = Math.random() * width;
            const centerY = Math.random() * height;
            const radius = (Math.random() * 0.5 + 0.5) * clusterSize;
            
            for (let y = Math.max(0, centerY - radius); y < Math.min(height, centerY + radius); y++) {
                for (let x = Math.max(0, centerX - radius); x < Math.min(width, centerX + radius); x++) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < radius) {
                        // Add some variation to the density within the cluster
                        const factor = 1 - distance / radius;
                        const noise = Math.random() * 0.4 + 0.6;
                        const val = Math.floor(255 * factor * noise);
                        
                        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
                        data[index] = Math.max(data[index], val);
                        data[index+1] = Math.max(data[index+1], val);
                        data[index+2] = Math.max(data[index+2], val);
                        data[index+3] = 255;
                    }
                }
            }
        }
        
        return data;
    },
    
    orbium: (gl, width, height) => {
        // Orbium pattern - a known Lenia organism
        const data = new Uint8Array(width * height * 4).fill(0);
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Orbium shape data (optimized for movement)
        const orbiumData = [
            [0, 0, 25, 85, 85, 25, 0, 0],
            [0, 77, 153, 217, 217, 153, 77, 0],
            [25, 153, 217, 255, 255, 217, 153, 25],
            [85, 217, 255, 255, 255, 255, 217, 85],
            [85, 217, 255, 255, 255, 255, 217, 85],
            [25, 153, 217, 255, 255, 217, 153, 25],
            [0, 77, 153, 217, 217, 153, 77, 0],
            [0, 0, 25, 85, 85, 25, 0, 0]
        ];
        
        const patternWidth = orbiumData[0].length;
        const patternHeight = orbiumData.length;
        
        // Draw larger to make it more visible
        const scale = 3;
        
        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const pixelX = Math.floor(centerX - (patternWidth * scale)/2 + (x * scale) + sx);
                        const pixelY = Math.floor(centerY - (patternHeight * scale)/2 + (y * scale) + sy);
                        const index = (pixelY * width + pixelX) * 4;
                        
                        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                            const val = orbiumData[y][x];
                            data[index] = val;
                            data[index+1] = val;
                            data[index+2] = val;
                            data[index+3] = 255;
                        }
                    }
                }
            }
        }
        
        return data;
    },
    
    glider: (gl, width, height) => {
        // Glider pattern - designed to move across the field
        const data = new Uint8Array(width * height * 4).fill(0);
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Asymmetric pattern that tends to move
        const gliderData = [
            [0, 25, 0, 0, 0],
            [0, 0, 180, 77, 0],
            [77, 230, 255, 180, 25],
            [77, 180, 230, 127, 0],
            [0, 25, 77, 0, 0]
        ];
        
        const patternWidth = gliderData[0].length;
        const patternHeight = gliderData.length;
        
        // Draw larger to make it more visible
        const scale = 3;
        
        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const pixelX = Math.floor(centerX - (patternWidth * scale)/2 + (x * scale) + sx);
                        const pixelY = Math.floor(centerY - (patternHeight * scale)/2 + (y * scale) + sy);
                        const index = (pixelY * width + pixelX) * 4;
                        
                        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                            const val = gliderData[y][x];
                            data[index] = val;
                            data[index+1] = val;
                            data[index+2] = val;
                            data[index+3] = 255;
                        }
                    }
                }
            }
        }
        
        return data;
    },
    
    gemini: (gl, width, height) => {
        // Gemini pattern - splits into two organisms
        const data = new Uint8Array(width * height * 4).fill(0);
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Pattern designed to split
        const geminiData = [
            [0, 25, 102, 102, 25, 0],
            [25, 179, 230, 230, 179, 25],
            [102, 230, 179, 179, 230, 102],
            [102, 230, 77, 77, 230, 102],
            [25, 179, 25, 25, 179, 25],
            [0, 25, 0, 0, 25, 0]
        ];
        
        const patternWidth = geminiData[0].length;
        const patternHeight = geminiData.length;
        
        // Draw larger to make it more visible
        const scale = 3;
        
        for (let y = 0; y < patternHeight; y++) {
            for (let x = 0; x < patternWidth; x++) {
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const pixelX = Math.floor(centerX - (patternWidth * scale)/2 + (x * scale) + sx);
                        const pixelY = Math.floor(centerY - (patternHeight * scale)/2 + (y * scale) + sy);
                        const index = (pixelY * width + pixelX) * 4;
                        
                        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                            const val = geminiData[y][x];
                            data[index] = val;
                            data[index+1] = val;
                            data[index+2] = val;
                            data[index+3] = 255;
                        }
                    }
                }
            }
        }
        
        return data;
    },
    
    multiSeeds: (gl, width, height, count = 5) => {
        // Multiple small seeds that interact with each other
        const data = new Uint8Array(width * height * 4).fill(0);
        
        // Seed patterns
        const seeds = [
            // Small orbium
            [
                [77, 179, 77],
                [179, 255, 179],
                [77, 179, 77]
            ],
            // Small asymmetric pattern
            [
                [0, 128, 0],
                [179, 255, 77],
                [77, 128, 0]
            ],
            // Tiny glider-like
            [
                [0, 179, 77],
                [179, 255, 0],
                [77, 0, 0]
            ]
        ];
        
        // Place them randomly
        for (let i = 0; i < count; i++) {
            // Choose a random seed pattern
            const seed = seeds[Math.floor(Math.random() * seeds.length)];
            const seedWidth = seed[0].length;
            const seedHeight = seed.length;
            
            // Choose a random position, but not too close to the edges
            const margin = 30;
            const posX = margin + Math.floor(Math.random() * (width - 2 * margin));
            const posY = margin + Math.floor(Math.random() * (height - 2 * margin));
            
            // Draw the seed
            for (let y = 0; y < seedHeight; y++) {
                for (let x = 0; x < seedWidth; x++) {
                    const pixelX = posX + x;
                    const pixelY = posY + y;
                    const index = (pixelY * width + pixelX) * 4;
                    
                    if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
                        const val = seed[y][x];
                        data[index] = val;
                        data[index+1] = val;
                        data[index+2] = val;
                        data[index+3] = 255;
                    }
                }
            }
        }
        
        return data;
    },
    
    spiral: (gl, width, height) => {
        // Spiral pattern that tends to rotate and evolve
        const data = new Uint8Array(width * height * 4).fill(0);
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 6;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > maxRadius) continue;
                
                // Create a spiral pattern
                const angle = Math.atan2(dy, dx);
                const spiralPhase = distance / 5 - angle * 2 / Math.PI;
                const spiralVal = Math.cos(spiralPhase * Math.PI * 2) * 0.5 + 0.5;
                
                // Add density gradient
                const densityFactor = 1 - distance / maxRadius;
                const val = Math.floor(spiralVal * densityFactor * 255);
                
                const index = (y * width + x) * 4;
                data[index] = val;
                data[index+1] = val;
                data[index+2] = val;
                data[index+3] = 255;
            }
        }
        
        return data;
    },
    
    lines: (gl, width, height) => {
        // Line patterns that create interesting interactions
        const data = new Uint8Array(width * height * 4).fill(0);
        const centerX = width / 2;
        const centerY = height / 2;
        const lineCount = 3;
        const lineWidth = 4;
        const lineLength = Math.min(width, height) / 2;
        
        for (let i = 0; i < lineCount; i++) {
            // Random angle for the line
            const angle = Math.random() * Math.PI * 2;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            // Start at a random position near center
            const offsetRadius = Math.random() * 20;
            const offsetAngle = Math.random() * Math.PI * 2;
            const startX = centerX + Math.cos(offsetAngle) * offsetRadius;
            const startY = centerY + Math.sin(offsetAngle) * offsetRadius;
            
            // Draw the line
            for (let d = -lineLength/2; d <= lineLength/2; d++) {
                for (let w = -lineWidth/2; w <= lineWidth/2; w++) {
                    const x = Math.floor(startX + dirX * d + dirY * w);
                    const y = Math.floor(startY + dirY * d - dirX * w);
                    
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        const distFromCenter = Math.abs(d) / (lineLength/2);
                        const val = Math.floor(255 * (1 - distFromCenter * 0.7));
                        
                        const index = (y * width + x) * 4;
                        data[index] = val;
                        data[index+1] = val;
                        data[index+2] = val;
                        data[index+3] = 255;
                    }
                }
            }
        }
        
        return data;
    }
}; 