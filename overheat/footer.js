class SimpleFooterGLTFLoader {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.loader = null;
        this.model = null;
        this.controls = null;
        this.container = null;
        this.isVisible = true;
        this.needsResize = false;
        this.isAnimating = false;
        this.rafId = null;
        this.throttledResize = this.throttle(this.onWindowResize.bind(this), 100);
        this.cachedDimensions = { width: 400, height: 300 };
        this.autoRotate = true;
        this.rotationSpeed = 0.005;
        
        // Y-axis rotation properties
        this.yRotation = 0;
        this.yRotationSpeed = 0.01;
        
        // Edge-only rendering properties
        this.edgeOnlyParts = [];
        this.animationState = 'assembled'; // 'assembled', 'disassembling', 'disassembled', 'reassembling'
        this.animationProgress = 0;
        this.animationDuration = 2000; // 2 seconds
        this.animationStartTime = 0;
        this.separationDistance = 4; // Increased from 3 to 8 for more spread
        this.isTransitioning = false;
        
        // Enhanced edge properties
        this.edgeColors = {
            edge: 0xffffff, // White edges
            edgeOpacity: 1.0
        };
        this.edgeThickness = 0.02; // Thickness of edge outline
        
        // Model scaling - reduced from default
        this.modelScale = 1.2; // Reduced scale factor
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    async init() {
        try {
            const container = document.getElementById('footer');
            if (!container) {
                console.error('Footer container not found');
                return false;
            }
            this.container = container;
            this.setupContainer();
            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupLighting();
            this.setupLoader();
            this.initControls();
            this.setupEventListeners();
            this.startAnimation();
            
            // Start the animation cycle after 2 seconds
            setTimeout(() => {
                this.startAnimationCycle();
            }, 2000);
            
            console.log('Footer Three.js scene initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Footer Three.js scene:', error);
            return false;
        }
    }

    setupContainer() {
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'footer-3d-container';
        canvasContainer.classList.add('fullscreen');
        canvasContainer.style.cssText = `
            position: relative;
            margin: 20px 0;
            border-radius: 10px;
            overflow: hidden;
            background: transparent;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            bottom:0;
        `;
        this.container.appendChild(canvasContainer);
        this.canvasContainer = canvasContainer;
        this.updateDimensions();
    }

    updateDimensions() {
        const rect = this.canvasContainer.getBoundingClientRect();
        this.cachedDimensions.width = rect.width || 400;
        this.cachedDimensions.height = rect.height || 300;
    }

    setupRenderer() {
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer = new THREE.WebGLRenderer({
            antialias: pixelRatio < 2,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.cachedDimensions.width, this.cachedDimensions.height);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = false; // Disable shadows for edge-only rendering
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Enable depth testing to prevent see-through issues
        this.renderer.sortObjects = true;
        
        this.canvasContainer.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent background
    }

    setupCamera() {
        const aspect = this.cachedDimensions.width / this.cachedDimensions.height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 2, 10);
        this.camera.lookAt(0, 2, 0);
    }

    setupLighting() {
        // Minimal lighting since we're only showing edges
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
    }

    setupLoader() {
        this.loader = new THREE.GLTFLoader();
        
        if (typeof THREE.DRACOLoader !== 'undefined') {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            this.loader.setDRACOLoader(dracoLoader);
        }
    }

    initControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxDistance = 15;
            this.controls.minDistance = 3;
            this.controls.enablePan = false;
            this.controls.autoRotate = false; // We'll handle rotation manually
            this.controls.autoRotateSpeed = 1.0;
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', this.throttledResize, { passive: true });
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this), { passive: true });
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (!this.isVisible && this.rafId) {
                    this.pauseAnimation();
                } else if (this.isVisible && !this.rafId) {
                    this.resumeAnimation();
                }
            });
        }, options);
        
        if (this.canvasContainer) {
            this.intersectionObserver.observe(this.canvasContainer);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAnimation();
        } else {
            this.resumeAnimation();
        }
    }

    // Create edge-only wireframe material with improved depth handling
    createEdgeWireframeMaterial() {
        return new THREE.LineBasicMaterial({
            color: this.edgeColors.edge,
            transparent: true,
            opacity: this.edgeColors.edgeOpacity,
            linewidth: 2,
            // Improved depth handling to prevent see-through issues
            depthTest: true,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
    }

    // Create edge geometry using EdgesGeometry for clean lines
    createEdgeGeometry(originalGeometry) {
        // Use EdgesGeometry to extract only the edges with a tighter threshold
        const edgesGeometry = new THREE.EdgesGeometry(originalGeometry, 10); // Reduced from 15 to 10 for more edges
        return edgesGeometry;
    }

    async loadGLTF(modelPath) {
        console.log('Loading GLTF model:', modelPath);
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => {
                    console.log('GLTF loaded successfully');
                    if (this.model) {
                        this.disposeModel();
                    }
                    this.model = gltf.scene;
                    this.optimizeModel(this.model);
                    this.createEdgeOnlyFromModel(this.model);
                    this.fixModelOrientation(this.model);
                    this.scaleAndCenterModel(this.model);
                    this.model.position.y -= 2.5;
                    console.log('GLTF model processed for edge-only rendering');
                    resolve(gltf);
                },
                (progress) => {
                    const percentage = Math.round(progress.loaded / progress.total * 100);
                    console.log('GLTF Loading progress:', percentage + '%');
                },
                (error) => {
                    console.error('Error loading GLTF:', error);
                    reject(error);
                }
            );
        });
    }

    createEdgeOnlyFromModel(model) {
        this.edgeOnlyParts = [];
        let partIndex = 0;
        
        model.updateMatrixWorld(true);
        
        model.traverse((child) => {
            if (child.isMesh && child.geometry) {
                // Create edge geometry using EdgesGeometry for clean wireframe
                const edgeGeometry = this.createEdgeGeometry(child.geometry);
                const edgeMaterial = this.createEdgeWireframeMaterial();
                
                // Create LineSegments for clean edge rendering
                const edgeMesh = new THREE.LineSegments(edgeGeometry, edgeMaterial);
                
                // Set render order to help with depth sorting
                edgeMesh.renderOrder = partIndex;
                
                // Create group to hold the edge mesh
                const meshGroup = new THREE.Group();
                meshGroup.add(edgeMesh);
                
                // Apply transformations
                const worldMatrix = new THREE.Matrix4();
                worldMatrix.multiplyMatrices(model.matrixWorld, child.matrix);
                
                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                worldMatrix.decompose(position, quaternion, scale);
                
                meshGroup.position.copy(position);
                meshGroup.quaternion.copy(quaternion);
                meshGroup.scale.copy(scale);
                
                // Store animation data
                meshGroup.userData = {
                    originalPosition: position.clone(),
                    originalQuaternion: quaternion.clone(),
                    originalScale: scale.clone(),
                    
                    // Target position for disassembly with increased spread
                    targetPosition: position.clone().add(this.generateRandomOffset()),
                    
                    partIndex: partIndex++,
                    
                    // Current state tracking
                    currentPosition: position.clone(),
                    currentQuaternion: quaternion.clone(),
                    
                    // Store reference to edge mesh
                    edgeMesh: edgeMesh
                };
                
                this.edgeOnlyParts.push(meshGroup);
                this.scene.add(meshGroup);
            }
        });
        
        console.log(`Created ${this.edgeOnlyParts.length} edge-only parts`);
    }

    generateRandomOffset() {
        // Increased spread with more variation, and upward Y bias
        const yBias = this.separationDistance * 0.5; // Positive value to push explosion upward
        return new THREE.Vector3(
            (Math.random() - 0.5) * this.separationDistance * 1.5,
            (Math.random() - 0.2) * this.separationDistance * 1.2 + yBias, // Bias upward
            (Math.random() - 0.5) * this.separationDistance * 1.5
        );
    }

    startAnimationCycle() {
        if (this.animationState === 'assembled' && !this.isTransitioning) {
            this.isTransitioning = true;
            
            // Ensure all parts are in their original positions before starting
            this.resetToAssembledState();
            
            // Generate new random target positions with increased spread
            this.edgeOnlyParts.forEach(part => {
                part.userData.targetPosition = part.userData.originalPosition.clone()
                    .add(this.generateRandomOffset());
            });
            
            this.animationState = 'disassembling';
            this.animationStartTime = Date.now();
            this.animationProgress = 0;
            this.isTransitioning = false;
            console.log('Starting disassembly animation');
        }
    }

    resetToAssembledState() {
        // Force all parts back to their original positions and rotations
        this.edgeOnlyParts.forEach(part => {
            part.position.copy(part.userData.originalPosition);
            part.quaternion.copy(part.userData.originalQuaternion);
            part.scale.copy(part.userData.originalScale);
            
            // Update current state tracking
            part.userData.currentPosition.copy(part.userData.originalPosition);
            part.userData.currentQuaternion.copy(part.userData.originalQuaternion);
        });
    }

    resetToDisassembledState() {
        // Force all parts to their target positions
        this.edgeOnlyParts.forEach(part => {
            part.position.copy(part.userData.targetPosition);
            
            // Calculate final rotation for disassembled state
            const rotationAmount = Math.PI * -0.9; // Increased rotation for more dramatic effect
            const axis = new THREE.Vector3(
                Math.sin(part.userData.partIndex),
                Math.cos(part.userData.partIndex),
                Math.sin(part.userData.partIndex * -0.9)
            ).normalize();
            
            const rotationQuaternion = new THREE.Quaternion();
            rotationQuaternion.setFromAxisAngle(axis, rotationAmount);
            
            part.quaternion.multiplyQuaternions(part.userData.originalQuaternion, rotationQuaternion);
            
            // Update current state tracking
            part.userData.currentPosition.copy(part.userData.targetPosition);
            part.userData.currentQuaternion.copy(part.quaternion);
        });
    }

    updateAnimation() {
        const currentTime = Date.now();
        const elapsed = currentTime - this.animationStartTime;
        this.animationProgress = Math.min(elapsed / this.animationDuration, 1);
        
        // Smooth easing function
        const easeProgress = this.easeInOutCubic(this.animationProgress);
        
        if (this.animationState === 'disassembling') {
            this.updateDisassemblyAnimation(easeProgress);
            
            if (this.animationProgress >= 1) {
                this.isTransitioning = true;
                this.resetToDisassembledState(); // Ensure clean final state
                this.animationState = 'disassembled';
                console.log('Disassembly complete');
                
                // Wait 2 seconds before reassembling
                setTimeout(() => {
                    this.animationState = 'reassembling';
                    this.animationStartTime = Date.now();
                    this.animationProgress = 0;
                    this.isTransitioning = false;
                    console.log('Starting reassembly animation');
                }, 2000);
            }
        } else if (this.animationState === 'reassembling') {
            this.updateReassemblyAnimation(easeProgress);
            
            if (this.animationProgress >= 1) {
                this.isTransitioning = true;
                this.resetToAssembledState(); // Ensure clean final state
                this.animationState = 'assembled';
                console.log('Reassembly complete');
                
                // Wait 3 seconds before starting next cycle
                setTimeout(() => {
                    this.isTransitioning = false;
                    this.startAnimationCycle();
                }, 3000);
            }
        }
    }

    updateDisassemblyAnimation(easeProgress) {
        this.edgeOnlyParts.forEach((part) => {
            const userData = part.userData;
            
            // Smooth interpolation from original to target position
            part.position.lerpVectors(
                userData.originalPosition,
                userData.targetPosition,
                easeProgress
            );
            
            // More dramatic rotation during disassembly
            const rotationAmount = easeProgress * Math.PI * -0.9; // Increased from 0.5
            const axis = new THREE.Vector3(
                Math.sin(userData.partIndex),
                Math.cos(userData.partIndex),
                Math.sin(userData.partIndex * -0.9)
            ).normalize();
            
            const rotationQuaternion = new THREE.Quaternion();
            rotationQuaternion.setFromAxisAngle(axis, rotationAmount);
            
            part.quaternion.multiplyQuaternions(userData.originalQuaternion, rotationQuaternion);
            
            // Update current state tracking
            userData.currentPosition.copy(part.position);
            userData.currentQuaternion.copy(part.quaternion);
        });
    }

    updateReassemblyAnimation(easeProgress) {
        this.edgeOnlyParts.forEach((part) => {
            const userData = part.userData;
            
            // Smooth interpolation from current position back to original position
            part.position.lerpVectors(
                userData.targetPosition,
                userData.originalPosition,
                easeProgress
            );
            
            // Rotate back to original orientation
            const rotationAmount = (1 - easeProgress) * Math.PI * -0.9; // Match disassembly rotation
            const axis = new THREE.Vector3(
                Math.sin(userData.partIndex),
                Math.cos(userData.partIndex),
                Math.sin(userData.partIndex * -0.9)
            ).normalize();
            
            const rotationQuaternion = new THREE.Quaternion();
            rotationQuaternion.setFromAxisAngle(axis, rotationAmount);
            
            part.quaternion.multiplyQuaternions(userData.originalQuaternion, rotationQuaternion);
            
            // Update current state tracking
            userData.currentPosition.copy(part.position);
            userData.currentQuaternion.copy(part.quaternion);
        });
    }

    updateYAxisRotation() {
        // Continuous Y-axis rotation
        this.yRotation += this.yRotationSpeed;
        
        this.edgeOnlyParts.forEach((part) => {
            const userData = part.userData;
            
            // Create Y-axis rotation quaternion
            const yRotationQuaternion = new THREE.Quaternion();
            yRotationQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yRotation);
            
            // Apply Y rotation to the original quaternion
            if (this.animationState === 'assembled' && !this.isTransitioning) {
                part.quaternion.multiplyQuaternions(userData.originalQuaternion, yRotationQuaternion);
            }
        });
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    fixModelOrientation(model) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        
        if (size.x > size.y && size.z > size.y) {
            model.rotation.z = Math.PI / 2;
        } else if (size.z > size.y && size.x > size.y) {
            model.rotation.x = Math.PI / 2;
        }
        
        const newBox = new THREE.Box3().setFromObject(model);
        model.position.y = -newBox.min.y;
    }

    scaleAndCenterModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= center.y;
        
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            // Reduced scale factor for smaller model
            const scale = this.modelScale / maxDim;
            model.scale.setScalar(scale);
        }
    }

    optimizeModel(model) {
        model.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    this.optimizeGeometry(child.geometry);
                }
                child.frustumCulled = true;
            }
        });
    }

    optimizeGeometry(geometry) {
        if (geometry.index === null) {
            geometry.mergeVertices();
        }
        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
    }

    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    pauseAnimation() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
            this.isAnimating = false;
        }
    }

    resumeAnimation() {
        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    animate() {
        if (!this.isAnimating) return;
        this.rafId = requestAnimationFrame(() => this.animate());
        
        if (!this.isVisible) return;
        
        if (this.needsResize) {
            this.handleResize();
            this.needsResize = false;
        }
        
        // Always update Y-axis rotation
        this.updateYAxisRotation();
        
        // Handle animation states
        if (this.animationState === 'disassembling' || this.animationState === 'reassembling') {
            this.updateAnimation();
        }
        // 'disassembled' and 'assembled' states - parts just rotate on Y axis
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.needsResize = true;
    }

    handleResize() {
        this.updateDimensions();
        
        const aspect = this.cachedDimensions.width / this.cachedDimensions.height;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.cachedDimensions.width, this.cachedDimensions.height);
    }

    // Control methods
    setAutoRotate(enabled) {
        this.autoRotate = enabled;
        if (this.controls) {
            this.controls.autoRotate = enabled;
        }
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
        if (this.controls) {
            this.controls.autoRotateSpeed = speed * 100;
        }
    }

    setYRotationSpeed(speed) {
        this.yRotationSpeed = speed;
    }

    setEdgeColor(color) {
        this.edgeColors.edge = color;
        this.edgeOnlyParts.forEach(part => {
            if (part.userData.edgeMesh && part.userData.edgeMesh.material) {
                part.userData.edgeMesh.material.color.setHex(color);
                part.userData.edgeMesh.material.needsUpdate = true;
            }
        });
    }

    setEdgeOpacity(opacity) {
        this.edgeColors.edgeOpacity = Math.max(0, Math.min(1, opacity));
        this.edgeOnlyParts.forEach(part => {
            if (part.userData.edgeMesh && part.userData.edgeMesh.material) {
                part.userData.edgeMesh.material.opacity = this.edgeColors.edgeOpacity;
                part.userData.edgeMesh.material.transparent = this.edgeColors.edgeOpacity < 1;
                part.userData.edgeMesh.material.needsUpdate = true;
            }
        });
    }

    setEdgeThickness(thickness) {
        this.edgeThickness = thickness;
        // Note: Line thickness may not work on all platforms due to WebGL limitations
        this.edgeOnlyParts.forEach(part => {
            if (part.userData.edgeMesh && part.userData.edgeMesh.material) {
                part.userData.edgeMesh.material.linewidth = thickness;
                part.userData.edgeMesh.material.needsUpdate = true;
            }
        });
    }

    setSeparationDistance(distance) {
        this.separationDistance = distance;
        // Update target positions for all parts
        this.edgeOnlyParts.forEach(part => {
            part.userData.targetPosition = part.userData.originalPosition.clone()
                .add(this.generateRandomOffset());
        });
    }

    setModelScale(scale) {
        this.modelScale = scale;
        if (this.model) {
            // Reapply scaling
            this.scaleAndCenterModel(this.model);
        }
    }

    disposeModel() {
        this.edgeOnlyParts.forEach(part => {
            part.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(part);
        });
        this.edgeOnlyParts = [];
        
        if (this.model) {
            this.model.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.model = null;
        }
    }

    dispose() {
        this.pauseAnimation();
        window.removeEventListener('resize', this.throttledResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        this.disposeModel();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        if (this.canvasContainer && this.canvasContainer.parentNode) {
            this.canvasContainer.parentNode.removeChild(this.canvasContainer);
        }
    }
}

// Initialize the footer GLTF loader
const footerGLTFLoader = new SimpleFooterGLTFLoader();

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing footer Three.js scene...');
    const success = await footerGLTFLoader.init();
    if (success) {
        try {
            await footerGLTFLoader.loadGLTF('src/3DModel/playerBody.glb');
        } catch (error) {
            console.error('Failed to load footer GLTF model:', error);
        }
    }
});

// Global functions for external control
window.loadFooterGLTF = (path) => footerGLTFLoader.loadGLTF(path);
window.initFooterThree = () => footerGLTFLoader.init();
window.setFooterAutoRotate = (enabled) => footerGLTFLoader.setAutoRotate(enabled);
window.setFooterRotationSpeed = (speed) => footerGLTFLoader.setRotationSpeed(speed);
window.setFooterYRotationSpeed = (speed) => footerGLTFLoader.setYRotationSpeed(speed);
window.setFooterEdgeColor = (color) => footerGLTFLoader.setEdgeColor(color);
window.setFooterEdgeOpacity = (opacity) => footerGLTFLoader.setEdgeOpacity(opacity);
window.setFooterEdgeThickness = (thickness) => footerGLTFLoader.setEdgeThickness(thickness);
window.setFooterSeparationDistance = (distance) => footerGLTFLoader.setSeparationDistance(distance);
window.setFooterModelScale = (scale) => footerGLTFLoader.setModelScale(scale);
window.footerGLTFLoader = footerGLTFLoader;