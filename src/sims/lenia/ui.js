// Lenia UI Module
// Manages user interface controls and interactions

export class UI {
    constructor(simulation, config) {
        this.simulation = simulation;
        this.config = config;
        this.tabs = [];
        this.activeTab = null;
        
        // Initialize the UI
        this.setupTabs();
        this.setupControls();
    }
    
    setupTabs() {
        // Set up the tabbed interface
        const controlContainer = document.getElementById('controls');
        
        // Create tab container
        const tabContainer = document.createElement('div');
        tabContainer.className = 'tab-container';
        controlContainer.prepend(tabContainer);
        
        // Create tab content container
        const tabContentContainer = document.createElement('div');
        tabContentContainer.className = 'tab-content-container';
        controlContainer.appendChild(tabContentContainer);
        
        // Define tabs
        const tabs = [
            { id: 'basic', label: 'Basic Controls', default: true },
            { id: 'patterns', label: 'Patterns & Kernels' },
            { id: 'rendering', label: 'Visual Effects' },
            { id: 'interaction', label: 'Interaction' }
        ];
        
        // Create tab elements
        tabs.forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'tab';
            tabEl.dataset.tabId = tab.id;
            tabEl.textContent = tab.label;
            tabContainer.appendChild(tabEl);
            
            // Create content container for this tab
            const contentEl = document.createElement('div');
            contentEl.className = 'tab-content';
            contentEl.id = `tab-content-${tab.id}`;
            tabContentContainer.appendChild(contentEl);
            
            // Store tab data
            this.tabs.push({
                id: tab.id,
                tabEl,
                contentEl
            });
            
            // Set up click handler
            tabEl.addEventListener('click', () => {
                this.activateTab(tab.id);
            });
            
            // Set default active tab
            if (tab.default) {
                this.activeTab = tab.id;
                tabEl.classList.add('active');
                contentEl.classList.add('active');
            }
        });
        
        // Add some CSS for tabs
        this.addTabStyles();
    }
    
    addTabStyles() {
        // Add CSS styles for the tabs
        const style = document.createElement('style');
        style.textContent = `
            .tab-container {
                display: flex;
                border-bottom: 1px solid #ccc;
                margin-bottom: 10px;
                user-select: none;
            }
            
            .tab {
                padding: 8px 15px;
                margin-right: 5px;
                cursor: pointer;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-bottom: none;
                border-radius: 5px 5px 0 0;
                position: relative;
                top: 1px;
            }
            
            .tab.active {
                background-color: white;
                border-bottom: 1px solid white;
            }
            
            .tab-content-container {
                flex-grow: 1;
                overflow-y: auto;
                padding: 10px 0;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            #controls {
                height: 200px;
                display: flex;
                flex-direction: column;
            }
            
            .control-row {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }
            
            .control-group {
                display: flex;
                align-items: center;
                margin-right: 20px;
                margin-bottom: 5px;
            }
            
            label {
                margin-right: 8px;
                font-size: 14px;
                min-width: 100px;
            }
            
            input[type="range"] {
                width: 150px;
            }
            
            .value-display {
                min-width: 40px;
                text-align: right;
                margin-left: 8px;
                font-size: 12px;
            }
            
            button {
                padding: 5px 15px;
                margin-right: 10px;
                background-color: #333;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            button:hover {
                background-color: #555;
            }
            
            select {
                padding: 4px;
                margin-right: 10px;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                cursor: pointer;
            }
            
            .checkbox-label input {
                margin-right: 5px;
            }
            
            .section-title {
                font-weight: bold;
                margin-right: 15px;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
    
    activateTab(tabId) {
        // Deactivate all tabs
        this.tabs.forEach(tab => {
            tab.tabEl.classList.remove('active');
            tab.contentEl.classList.remove('active');
        });
        
        // Activate the selected tab
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.tabEl.classList.add('active');
            tab.contentEl.classList.add('active');
            this.activeTab = tabId;
        }
    }
    
    setupControls() {
        // Move existing controls to their respective tabs
        const basicTab = document.getElementById('tab-content-basic');
        const patternsTab = document.getElementById('tab-content-patterns');
        const renderingTab = document.getElementById('tab-content-rendering');
        const interactionTab = document.getElementById('tab-content-interaction');
        
        // Clear existing controls from container
        const controlRows = document.querySelectorAll('.control-row');
        controlRows.forEach(row => row.remove());
        
        // Basic Controls Tab
        this.setupBasicControls(basicTab);
        
        // Patterns & Kernels Tab
        this.setupPatternsControls(patternsTab);
        
        // Rendering Tab
        this.setupRenderingControls(renderingTab);
        
        // Interaction Tab
        this.setupInteractionControls(interactionTab);
    }
    
    setupBasicControls(container) {
        // Create row for play/pause and reset
        const controlRow1 = document.createElement('div');
        controlRow1.className = 'control-row';
        container.appendChild(controlRow1);
        
        // Play/Pause button
        const controlGroup1 = document.createElement('div');
        controlGroup1.className = 'control-group';
        controlRow1.appendChild(controlGroup1);
        
        const playPauseButton = document.createElement('button');
        playPauseButton.id = 'play-pause';
        playPauseButton.textContent = this.simulation.isRunning ? 'Pause' : 'Play';
        controlGroup1.appendChild(playPauseButton);
        
        // Reset button
        const resetButton = document.createElement('button');
        resetButton.id = 'reset';
        resetButton.textContent = 'Reset';
        controlGroup1.appendChild(resetButton);
        
        // Growth center slider
        const controlRow2 = document.createElement('div');
        controlRow2.className = 'control-row';
        container.appendChild(controlRow2);
        
        const growthCenterGroup = document.createElement('div');
        growthCenterGroup.className = 'control-group';
        controlRow2.appendChild(growthCenterGroup);
        
        const growthCenterLabel = document.createElement('label');
        growthCenterLabel.htmlFor = 'growth-center';
        growthCenterLabel.textContent = 'Growth Center:';
        growthCenterGroup.appendChild(growthCenterLabel);
        
        const growthCenterSlider = document.createElement('input');
        growthCenterSlider.type = 'range';
        growthCenterSlider.id = 'growth-center';
        growthCenterSlider.min = '0';
        growthCenterSlider.max = '1';
        growthCenterSlider.step = '0.01';
        growthCenterSlider.value = this.config.params.growthCenter;
        growthCenterGroup.appendChild(growthCenterSlider);
        
        const growthCenterValue = document.createElement('span');
        growthCenterValue.id = 'growth-center-value';
        growthCenterValue.className = 'value-display';
        growthCenterValue.textContent = this.config.params.growthCenter.toFixed(2);
        growthCenterGroup.appendChild(growthCenterValue);
        
        // Growth width slider
        const growthWidthGroup = document.createElement('div');
        growthWidthGroup.className = 'control-group';
        controlRow2.appendChild(growthWidthGroup);
        
        const growthWidthLabel = document.createElement('label');
        growthWidthLabel.htmlFor = 'growth-width';
        growthWidthLabel.textContent = 'Growth Width:';
        growthWidthGroup.appendChild(growthWidthLabel);
        
        const growthWidthSlider = document.createElement('input');
        growthWidthSlider.type = 'range';
        growthWidthSlider.id = 'growth-width';
        growthWidthSlider.min = '0.001';
        growthWidthSlider.max = '0.5';
        growthWidthSlider.step = '0.001';
        growthWidthSlider.value = this.config.params.growthWidth;
        growthWidthGroup.appendChild(growthWidthSlider);
        
        const growthWidthValue = document.createElement('span');
        growthWidthValue.id = 'growth-width-value';
        growthWidthValue.className = 'value-display';
        growthWidthValue.textContent = this.config.params.growthWidth.toFixed(3);
        growthWidthGroup.appendChild(growthWidthValue);
        
        // Time scale slider
        const controlRow3 = document.createElement('div');
        controlRow3.className = 'control-row';
        container.appendChild(controlRow3);
        
        const timeScaleGroup = document.createElement('div');
        timeScaleGroup.className = 'control-group';
        controlRow3.appendChild(timeScaleGroup);
        
        const timeScaleLabel = document.createElement('label');
        timeScaleLabel.htmlFor = 'time-scale';
        timeScaleLabel.textContent = 'Time Scale:';
        timeScaleGroup.appendChild(timeScaleLabel);
        
        const timeScaleSlider = document.createElement('input');
        timeScaleSlider.type = 'range';
        timeScaleSlider.id = 'time-scale';
        timeScaleSlider.min = '0.1';
        timeScaleSlider.max = '2.0';
        timeScaleSlider.step = '0.1';
        timeScaleSlider.value = this.config.params.timeScale;
        timeScaleGroup.appendChild(timeScaleSlider);
        
        const timeScaleValue = document.createElement('span');
        timeScaleValue.id = 'time-scale-value';
        timeScaleValue.className = 'value-display';
        timeScaleValue.textContent = this.config.params.timeScale.toFixed(1);
        timeScaleGroup.appendChild(timeScaleValue);
        
        // Resolution factor slider
        const resolutionFactorGroup = document.createElement('div');
        resolutionFactorGroup.className = 'control-group';
        controlRow3.appendChild(resolutionFactorGroup);
        
        const resolutionFactorLabel = document.createElement('label');
        resolutionFactorLabel.htmlFor = 'resolution-factor';
        resolutionFactorLabel.textContent = 'Resolution:';
        resolutionFactorGroup.appendChild(resolutionFactorLabel);
        
        const resolutionFactorSlider = document.createElement('input');
        resolutionFactorSlider.type = 'range';
        resolutionFactorSlider.id = 'resolution-factor';
        resolutionFactorSlider.min = '0.25';
        resolutionFactorSlider.max = '1.5';
        resolutionFactorSlider.step = '0.25';
        resolutionFactorSlider.value = this.config.params.resolutionFactor;
        resolutionFactorGroup.appendChild(resolutionFactorSlider);
        
        const resolutionFactorValue = document.createElement('span');
        resolutionFactorValue.id = 'resolution-factor-value';
        resolutionFactorValue.className = 'value-display';
        resolutionFactorValue.textContent = this.config.params.resolutionFactor.toFixed(1) + '×';
        resolutionFactorGroup.appendChild(resolutionFactorValue);
        
        // Set up event handlers for basic controls
        playPauseButton.addEventListener('click', () => {
            this.simulation.isRunning = !this.simulation.isRunning;
            playPauseButton.textContent = this.simulation.isRunning ? 'Pause' : 'Play';
        });
        
        resetButton.addEventListener('click', () => {
            this.simulation.resetSimulation();
        });
        
        growthCenterSlider.addEventListener('input', () => {
            const value = parseFloat(growthCenterSlider.value);
            this.config.updateParam('growthCenter', value);
            growthCenterValue.textContent = value.toFixed(2);
        });
        
        growthWidthSlider.addEventListener('input', () => {
            const value = parseFloat(growthWidthSlider.value);
            this.config.updateParam('growthWidth', value);
            growthWidthValue.textContent = value.toFixed(3);
        });
        
        timeScaleSlider.addEventListener('input', () => {
            const value = parseFloat(timeScaleSlider.value);
            this.config.updateParam('timeScale', value);
            timeScaleValue.textContent = value.toFixed(1);
        });
        
        resolutionFactorSlider.addEventListener('input', () => {
            const value = parseFloat(resolutionFactorSlider.value);
            this.config.updateParam('resolutionFactor', value);
            resolutionFactorValue.textContent = value.toFixed(1) + '×';
        });
        
        resolutionFactorSlider.addEventListener('change', () => {
            this.simulation.resizeCanvas(); // Resize when slider is released
        });
    }
    
    setupPatternsControls(container) {
        // Patterns
        const patternRow = document.createElement('div');
        patternRow.className = 'control-row';
        container.appendChild(patternRow);
        
        const patternGroup = document.createElement('div');
        patternGroup.className = 'control-group';
        patternRow.appendChild(patternGroup);
        
        const patternLabel = document.createElement('label');
        patternLabel.htmlFor = 'pattern-select';
        patternLabel.textContent = 'Pattern:';
        patternGroup.appendChild(patternLabel);
        
        const patternSelect = document.createElement('select');
        patternSelect.id = 'pattern-select';
        patternGroup.appendChild(patternSelect);
        
        // Add pattern options
        const patternOptions = [
            { value: 'random', label: 'Random' },
            { value: 'randomClusters', label: 'Random Clusters' },
            { value: 'orbium', label: 'Orbium' },
            { value: 'glider', label: 'Glider' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'multiSeeds', label: 'Multiple Seeds' },
            { value: 'spiral', label: 'Spiral' },
            { value: 'lines', label: 'Line Patterns' }
        ];
        
        patternOptions.forEach(option => {
            const optEl = document.createElement('option');
            optEl.value = option.value;
            optEl.textContent = option.label;
            if (option.value === this.config.params.currentPattern) {
                optEl.selected = true;
            }
            patternSelect.appendChild(optEl);
        });
        
        // Kernel Types
        const kernelRow = document.createElement('div');
        kernelRow.className = 'control-row';
        container.appendChild(kernelRow);
        
        const kernelGroup = document.createElement('div');
        kernelGroup.className = 'control-group';
        kernelRow.appendChild(kernelGroup);
        
        const kernelLabel = document.createElement('label');
        kernelLabel.htmlFor = 'kernel-select';
        kernelLabel.textContent = 'Kernel Type:';
        kernelGroup.appendChild(kernelLabel);
        
        const kernelSelect = document.createElement('select');
        kernelSelect.id = 'kernel-select';
        kernelGroup.appendChild(kernelSelect);
        
        // Add kernel options
        const kernelOptions = [
            { value: 'gaussian', label: 'Gaussian' },
            { value: 'ring', label: 'Ring' },
            { value: 'bipolar', label: 'Bipolar' },
            { value: 'multiRing', label: 'Multi-Ring' },
            { value: 'directional', label: 'Directional' },
            { value: 'predatorPrey', label: 'Predator-Prey' },
            { value: 'fractal', label: 'Fractal' },
            { value: 'oscillating', label: 'Oscillating' },
            { value: 'smoothLife', label: 'SmoothLife' }
        ];
        
        kernelOptions.forEach(option => {
            const optEl = document.createElement('option');
            optEl.value = option.value;
            optEl.textContent = option.label;
            if (option.value === this.config.params.kernelType) {
                optEl.selected = true;
            }
            kernelSelect.appendChild(optEl);
        });
        
        // Kernel Radius slider
        const kernelRadiusRow = document.createElement('div');
        kernelRadiusRow.className = 'control-row';
        container.appendChild(kernelRadiusRow);
        
        const kernelRadiusGroup = document.createElement('div');
        kernelRadiusGroup.className = 'control-group';
        kernelRadiusRow.appendChild(kernelRadiusGroup);
        
        const kernelRadiusLabel = document.createElement('label');
        kernelRadiusLabel.htmlFor = 'kernel-radius';
        kernelRadiusLabel.textContent = 'Kernel Radius:';
        kernelRadiusGroup.appendChild(kernelRadiusLabel);
        
        const kernelRadiusSlider = document.createElement('input');
        kernelRadiusSlider.type = 'range';
        kernelRadiusSlider.id = 'kernel-radius';
        kernelRadiusSlider.min = '5';
        kernelRadiusSlider.max = '20';
        kernelRadiusSlider.step = '1';
        kernelRadiusSlider.value = this.config.params.kernelRadius;
        kernelRadiusGroup.appendChild(kernelRadiusSlider);
        
        const kernelRadiusValue = document.createElement('span');
        kernelRadiusValue.id = 'kernel-radius-value';
        kernelRadiusValue.className = 'value-display';
        kernelRadiusValue.textContent = this.config.params.kernelRadius.toString();
        kernelRadiusGroup.appendChild(kernelRadiusValue);
        
        // Set up event handlers for pattern controls
        patternSelect.addEventListener('change', () => {
            this.config.updateParam('currentPattern', patternSelect.value);
            this.simulation.resetSimulation();
        });
        
        kernelSelect.addEventListener('change', () => {
            this.config.updateParam('kernelType', kernelSelect.value);
            this.simulation.updateKernelType(kernelSelect.value);
        });
        
        kernelRadiusSlider.addEventListener('input', () => {
            const value = parseInt(kernelRadiusSlider.value);
            this.config.updateParam('kernelRadius', value);
            kernelRadiusValue.textContent = value.toString();
        });
    }
    
    setupRenderingControls(container) {
        // Create resolution control group
        const resolutionGroup = document.createElement('div');
        resolutionGroup.className = 'control-row';
        
        // Add a span for the section title
        const resolutionTitle = document.createElement('span');
        resolutionTitle.className = 'section-title';
        resolutionTitle.textContent = 'Resolution & Display';
        resolutionGroup.appendChild(resolutionTitle);
        
        // Add grid size control
        this.createSliderControl(
            resolutionGroup,
            'Grid Size:',
            'gridSize',
            50, 200, 1,
            value => {
                this.config.updateParam('gridSize', parseInt(value));
                this.simulation.resizeCanvas(); // Resize to apply new grid size
            }
        );
        
        // Add zoom instruction
        const zoomTip = document.createElement('div');
        zoomTip.className = 'zoom-tip';
        zoomTip.innerHTML = '<i>Use mouse wheel to zoom, middle-click/Alt+drag to pan</i>';
        zoomTip.style.fontSize = '12px';
        zoomTip.style.color = '#555';
        zoomTip.style.marginTop = '5px';
        resolutionGroup.appendChild(zoomTip);
        
        container.appendChild(resolutionGroup);
        
        // Visual Effects section
        const effectsGroup = document.createElement('div');
        effectsGroup.className = 'control-row';
        
        // Add a span for the section title
        const effectsTitle = document.createElement('span');
        effectsTitle.className = 'section-title';
        effectsTitle.textContent = 'Visual Effects';
        effectsGroup.appendChild(effectsTitle);
        
        // Add color scheme dropdown
        const colorSchemeGroup = document.createElement('div');
        colorSchemeGroup.className = 'control-group';
        
        const colorSchemeLabel = document.createElement('label');
        colorSchemeLabel.textContent = 'Color Scheme:';
        colorSchemeGroup.appendChild(colorSchemeLabel);
        
        const colorSchemeSelect = document.createElement('select');
        const colorSchemes = [
            { value: 0, label: 'Black on White' },
            { value: 1, label: 'White on Black' },
            { value: 2, label: 'Green' },
            { value: 3, label: 'Heat Map' },
            { value: 4, label: 'Cool Blue' }
        ];
        
        colorSchemes.forEach(scheme => {
            const option = document.createElement('option');
            option.value = scheme.value;
            option.textContent = scheme.label;
            if (parseInt(scheme.value) === this.config.params.colorScheme) {
                option.selected = true;
            }
            colorSchemeSelect.appendChild(option);
        });
        
        colorSchemeSelect.addEventListener('change', (e) => {
            this.config.updateParam('colorScheme', parseInt(e.target.value));
        });
        
        colorSchemeGroup.appendChild(colorSchemeSelect);
        effectsGroup.appendChild(colorSchemeGroup);
        
        container.appendChild(effectsGroup);
        
        // Dithering controls
        const ditheringGroup = document.createElement('div');
        ditheringGroup.className = 'control-row';
        
        // Dithering checkbox
        const ditheringCheckGroup = document.createElement('div');
        ditheringCheckGroup.className = 'control-group';
        
        const ditheringLabel = document.createElement('label');
        ditheringLabel.className = 'checkbox-label';
        
        const ditheringCheckbox = document.createElement('input');
        ditheringCheckbox.type = 'checkbox';
        ditheringCheckbox.checked = this.config.params.enableDither;
        ditheringCheckbox.addEventListener('change', (e) => {
            this.config.updateParam('enableDither', e.target.checked);
        });
        
        ditheringLabel.appendChild(ditheringCheckbox);
        ditheringLabel.appendChild(document.createTextNode('Enable Dithering'));
        
        ditheringCheckGroup.appendChild(ditheringLabel);
        ditheringGroup.appendChild(ditheringCheckGroup);
        
        // Dithering amount slider
        this.createSliderControl(
            ditheringGroup,
            'Dither Amount:',
            'ditherAmount',
            0, 0.1, 0.001,
            value => {
                this.config.updateParam('ditherAmount', parseFloat(value));
            }
        );
        
        container.appendChild(ditheringGroup);
        
        // Bloom effect controls
        const bloomGroup = document.createElement('div');
        bloomGroup.className = 'control-row';
        
        // Bloom checkbox
        const bloomCheckGroup = document.createElement('div');
        bloomCheckGroup.className = 'control-group';
        
        const bloomLabel = document.createElement('label');
        bloomLabel.className = 'checkbox-label';
        
        const bloomCheckbox = document.createElement('input');
        bloomCheckbox.type = 'checkbox';
        bloomCheckbox.checked = this.config.params.enableBloom;
        bloomCheckbox.addEventListener('change', (e) => {
            this.config.updateParam('enableBloom', e.target.checked);
        });
        
        bloomLabel.appendChild(bloomCheckbox);
        bloomLabel.appendChild(document.createTextNode('Enable Bloom'));
        
        bloomCheckGroup.appendChild(bloomLabel);
        bloomGroup.appendChild(bloomCheckGroup);
        
        container.appendChild(bloomGroup);
        
        // Bloom intensity and radius sliders
        const bloomParamsGroup = document.createElement('div');
        bloomParamsGroup.className = 'control-row';
        
        this.createSliderControl(
            bloomParamsGroup,
            'Bloom Intensity:',
            'bloomIntensity',
            0, 2.0, 0.05,
            value => {
                this.config.updateParam('bloomIntensity', parseFloat(value));
            }
        );
        
        this.createSliderControl(
            bloomParamsGroup,
            'Bloom Radius:',
            'bloomRadius',
            1, 10, 0.5,
            value => {
                this.config.updateParam('bloomRadius', parseFloat(value));
            }
        );
        
        container.appendChild(bloomParamsGroup);
    }
    
    setupInteractionControls(container) {
        // Brush size slider
        const brushRow = document.createElement('div');
        brushRow.className = 'control-row';
        container.appendChild(brushRow);
        
        const brushSizeGroup = document.createElement('div');
        brushSizeGroup.className = 'control-group';
        brushRow.appendChild(brushSizeGroup);
        
        const brushSizeLabel = document.createElement('label');
        brushSizeLabel.htmlFor = 'brush-size';
        brushSizeLabel.textContent = 'Brush Size:';
        brushSizeGroup.appendChild(brushSizeLabel);
        
        const brushSizeSlider = document.createElement('input');
        brushSizeSlider.type = 'range';
        brushSizeSlider.id = 'brush-size';
        brushSizeSlider.min = '1';
        brushSizeSlider.max = '30';
        brushSizeSlider.step = '1';
        brushSizeSlider.value = this.config.params.brushSize;
        brushSizeGroup.appendChild(brushSizeSlider);
        
        const brushSizeValue = document.createElement('span');
        brushSizeValue.id = 'brush-size-value';
        brushSizeValue.className = 'value-display';
        brushSizeValue.textContent = this.config.params.brushSize.toString();
        brushSizeGroup.appendChild(brushSizeValue);
        
        // Brush intensity slider
        const brushIntensityGroup = document.createElement('div');
        brushIntensityGroup.className = 'control-group';
        brushRow.appendChild(brushIntensityGroup);
        
        const brushIntensityLabel = document.createElement('label');
        brushIntensityLabel.htmlFor = 'brush-intensity';
        brushIntensityLabel.textContent = 'Brush Intensity:';
        brushIntensityGroup.appendChild(brushIntensityLabel);
        
        const brushIntensitySlider = document.createElement('input');
        brushIntensitySlider.type = 'range';
        brushIntensitySlider.id = 'brush-intensity';
        brushIntensitySlider.min = '0.1';
        brushIntensitySlider.max = '1.0';
        brushIntensitySlider.step = '0.1';
        brushIntensitySlider.value = this.config.params.brushIntensity;
        brushIntensityGroup.appendChild(brushIntensitySlider);
        
        const brushIntensityValue = document.createElement('span');
        brushIntensityValue.id = 'brush-intensity-value';
        brushIntensityValue.className = 'value-display';
        brushIntensityValue.textContent = this.config.params.brushIntensity.toFixed(1);
        brushIntensityGroup.appendChild(brushIntensityValue);
        
        // Instructions for drawing
        const instructionsRow = document.createElement('div');
        instructionsRow.className = 'control-row';
        container.appendChild(instructionsRow);
        
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.innerHTML = `
            <p>Click and drag in the simulation to add cells.</p>
            <p>You can use this to create new patterns or interact with existing ones.</p>
        `;
        instructionsRow.appendChild(instructions);
        
        // Set up event handlers
        brushSizeSlider.addEventListener('input', () => {
            const value = parseInt(brushSizeSlider.value);
            this.config.updateParam('brushSize', value);
            brushSizeValue.textContent = value.toString();
        });
        
        brushIntensitySlider.addEventListener('input', () => {
            const value = parseFloat(brushIntensitySlider.value);
            this.config.updateParam('brushIntensity', value);
            brushIntensityValue.textContent = value.toFixed(1);
        });
    }

    // Add createSliderControl helper method
    createSliderControl(container, label, id, min, max, step, onChangeCallback) {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        container.appendChild(controlGroup);
        
        const sliderLabel = document.createElement('label');
        sliderLabel.htmlFor = id;
        sliderLabel.textContent = label;
        controlGroup.appendChild(sliderLabel);
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = id;
        slider.min = min.toString();
        slider.max = max.toString();
        slider.step = step.toString();
        controlGroup.appendChild(slider);
        
        const valueDisplay = document.createElement('span');
        valueDisplay.id = `${id}-value`;
        valueDisplay.className = 'value-display';
        controlGroup.appendChild(valueDisplay);
        
        // Set initial value and update display
        const updateValue = () => {
            valueDisplay.textContent = slider.value;
            if (onChangeCallback) onChangeCallback(slider.value);
        };
        
        // Set up event listener
        slider.addEventListener('input', updateValue);
        
        // Initialize display
        setTimeout(updateValue, 0);
        
        return { slider, valueDisplay };
    }
} 