// Lenia - Continuous Cellular Automata Simulation
// Main entry point that initializes the simulation

// Import modules
import { LeniaConfig } from './lenia/config.js';
import { LeniaSimulation } from './lenia/simulation.js';
import { UI } from './lenia/ui.js';
import { patterns } from './lenia/patterns.js';
import { kernels, generateUpdateShaderSource } from './lenia/kernels.js';

// Store global config and simulation instances
let config;
let simulation;
let ui;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Lenia simulation');
    try {
        // Create configuration (loads from localStorage if available)
        config = new LeniaConfig();
        console.log('Config loaded:', config.params);
        
        // Initialize the simulation with the loaded config
        simulation = new LeniaSimulation('leniaCanvas', config, patterns, kernels);
        
        // Initialize the UI with references to simulation and config
        ui = new UI(simulation, config);
        
        // Start the simulation
        simulation.start();
        console.log('Simulation started successfully');
    } catch (e) {
        console.error('Error initializing Lenia simulation:', e);
        console.error('Stack trace:', e.stack);
    }
}); 