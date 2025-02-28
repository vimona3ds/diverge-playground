// Lenia Configuration Module
// Manages default settings and localStorage persistence

export class LeniaConfig {
    constructor() {
        // Default configuration values
        this.defaults = {
            // Simulation parameters
            growthCenter: 0.15,
            growthWidth: 0.015,
            timeScale: 1.0,
            kernelRadius: 13,
            kernelType: 'gaussian', // Default kernel as string
            gridSize: 100, // Grid size (cells per unit length)
            
            // Rendering parameters
            colorScheme: 0, // Default: Black on white
            resolutionFactor: 1.0, // Default: 100%
            
            // Visual effects
            enableDither: false,
            ditherAmount: 0.03,
            enableBloom: false,
            bloomIntensity: 0.5,
            bloomRadius: 4,
            
            // User interaction
            brushSize: 10,
            brushIntensity: 0.8,
            
            // Current pattern
            currentPattern: 'orbium'
        };
        
        // Load stored settings or use defaults
        this.params = this.loadFromLocalStorage() || Object.assign({}, this.defaults);
        
        // Ensure all parameters exist (in case we add new ones in updates)
        for (const key in this.defaults) {
            if (this.params[key] === undefined) {
                this.params[key] = this.defaults[key];
            }
        }
    }
    
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('leniaConfig');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
        return null;
    }
    
    saveToLocalStorage() {
        try {
            localStorage.setItem('leniaConfig', JSON.stringify(this.params));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }
    
    updateParam(key, value) {
        if (this.params[key] !== value) {
            this.params[key] = value;
            this.saveToLocalStorage();
        }
    }
    
    resetToDefaults() {
        this.params = Object.assign({}, this.defaults);
        this.saveToLocalStorage();
    }
} 