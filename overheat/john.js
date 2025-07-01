class OptimizedThreeJSLoader {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.loader = null;
        this.model = null;
        this.animationMixer = null;
        this.clock = null;
        this.controls = null;
        this.gltfCameras = [];
        this.activeCamera = null;
        this.animations = [];
        this.totalDuration = 0;
        this.maxScrollAnimationTime = 30;
        this.composer = null;
        this.renderPass = null;
        this.edgePass = null;
        this.scrollProgress = 0;
        this.targetScrollProgress = 0;
        this.smoothingFactor = 0.15;
        this.canvasContainer = null;
        this.showcaseContainer = null;
        this.isVisible = true;
        this.needsResize = false;
        this.isAnimating = false;
        this.rafId = null;
        this.throttledScroll = this.throttle(this.handleScroll.bind(this), 16);
        this.throttledResize = this.throttle(this.onWindowResize.bind(this), 100);
        this.tempVec3 = new THREE.Vector3();
        this.tempQuat = new THREE.Quaternion();
        this.tempMatrix = new THREE.Matrix4();
        this.cachedAspectRatio = window.innerWidth / window.innerHeight;
        this.cachedDimensions = { width: window.innerWidth, height: window.innerHeight };
        this.bufferScrollHeight = 100;
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async init() {
        try {
            const container = document.getElementById('showcase');
            if (!container) {
                console.error('Showcase container not found');
                return false;
            }
            this.showcaseContainer = container;
            this.setupContainer();
            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupLighting();
            if (this.isPostProcessingAvailable()) {
                this.setupPostProcessing();
            }
            this.setupLoader();
            this.initControls();
            this.setupEventListeners();
            this.startAnimation();
            console.log('Three.js scene initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Three.js scene:', error);
            return false;
        }
    }

    setupContainer() {
        const container = this.showcaseContainer;
        container.style.cssText = `
            height: calc(500vh + ${this.bufferScrollHeight}vh);
            position: relative;
            will-change: transform;
        `;
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.style.cssText = `
            position: sticky;
            top: 0;
            width: 100vw;
            height: 100vh;
            z-index: 10;
            contain: layout style paint;
        `;
        container.appendChild(this.canvasContainer);
    }

    setupRenderer() {
        // Aggressively dispose previous renderer and canvas if they exist
        if (this.renderer) {
            try {
                if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
                this.renderer.dispose();
            } catch (e) {
                console.warn('Renderer dispose error:', e);
            }
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }

        // Try-catch to handle WebGL context creation errors
        try {
            const isMobile = this.isMobile();
            const pixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
            this.renderer = new THREE.WebGLRenderer({
                antialias: !isMobile && pixelRatio < 2,
                alpha: true,
                powerPreference: isMobile ? "low-power" : "high-performance",
                stencil: false,
                depth: true,
                preserveDrawingBuffer: false // Prevent memory leaks on mobile
            });
            this.renderer.setSize(this.cachedDimensions.width, this.cachedDimensions.height);
            this.renderer.setPixelRatio(pixelRatio);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.shadowMap.enabled = !isMobile;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = isMobile ? 1.1 : 1.5;
            this.renderer.info.autoReset = false;
            this.canvasContainer.appendChild(this.renderer.domElement);

            // Listen for context loss and restore
            this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                console.warn('WebGL context lost. Attempting to recover...');
                this.handleContextLoss();
            }, false);
            this.renderer.domElement.addEventListener('webglcontextrestored', () => {
                console.warn('WebGL context restored. Re-initializing scene...');
                this.handleContextRestore();
            }, false);
        } catch (err) {
            // If context creation fails, clean up and show a user-friendly message
            console.error('Error creating WebGL context:', err);
            if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
            // Optionally, display a fallback message or image
            if (this.canvasContainer) {
                this.canvasContainer.innerHTML = '<div style="color:#b00;font-size:2em;text-align:center;padding:2em;">WebGL not supported or too many contexts in use.<br>Please close other tabs or restart your browser.</div>';
            }
        }
    }

    handleContextLoss() {
        // Aggressively dispose everything to free memory
        try {
            this.disposeModel();
            if (this.composer) {
                this.composer.dispose();
                this.composer = null;
            }
            if (this.renderer) {
                if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
                this.renderer.dispose();
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
                this.renderer = null;
            }
        } catch (e) {
            console.warn('Error during context loss cleanup:', e);
        }
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.isAnimating = false;
        this.rafId = null;
        // Optionally, force garbage collection if available
        if (window.gc) try { window.gc(); } catch (e) {}
    }

    handleContextRestore() {
        // Re-initialize the scene after context restore
        setTimeout(() => {
            this.init();
        }, 100);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null; // Remove background color for transparency
        this.scene.fog = null; // Remove fog for full transparency
        this.scene.matrixAutoUpdate = false;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, this.cachedAspectRatio, 0.1, 1000);
        this.camera.position.set(0, 2, 5);
        this.camera.matrixAutoUpdate = false;
        this.camera.updateMatrix();
    }

    setupLighting() {
        const lightGroup = new THREE.Group();
        lightGroup.name = 'LightGroup';

        // Neon Red Point Light (left/front, color #b21927)
        const neonRedLight = new THREE.PointLight(0xb21927, 3.0, 30);
        neonRedLight.position.set(-5, 6, 4);
        lightGroup.add(neonRedLight);

        // Neon Blue Point Light (right/front)
        const neonBlueLight = new THREE.PointLight(0x0080ff, 3.0, 30);
        neonBlueLight.position.set(5, 6, 4);
        lightGroup.add(neonBlueLight);

        // Neon Purple Side Light (below and near blue)
        const neonPurpleLight = new THREE.PointLight(0xb74aff, 2.0, 25);
        neonPurpleLight.position.set(6, 3, 2);
        lightGroup.add(neonPurpleLight);

        // Optionally, add a subtle fill to avoid total black shadows
        const fillLight = new THREE.PointLight(0xffffff, 0.1, 100);
        fillLight.position.set(0, 10, 0);
        lightGroup.add(fillLight);

        this.scene.add(lightGroup);
    }

    getOptimalShadowMapSize() {
        const gl = this.renderer.getContext();
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        if (maxTextureSize >= 4096 && !this.isMobile()) {
            return 2048;
        } else {
            return 1024;
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    isPostProcessingAvailable() {
        return typeof THREE.EffectComposer !== 'undefined' &&
               typeof THREE.RenderPass !== 'undefined' &&
               typeof THREE.ShaderPass !== 'undefined';
    }

    setupPostProcessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        const edgeShader = this.createOptimizedEdgeShader();
        this.edgePass = new THREE.ShaderPass(edgeShader);
        this.edgePass.renderToScreen = true;
        this.composer.addPass(this.edgePass);
    }

    createOptimizedEdgeShader() {
        return {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(this.cachedDimensions.width, this.cachedDimensions.height) },
                edgeStrength: { value: 2.0 },
                edgeGlow: { value: 2 },
                edgeThickness: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform float edgeStrength;
                uniform float edgeGlow;
                uniform float edgeThickness;
                varying vec2 vUv;
                void main() {
                    vec2 texelSize = edgeThickness / resolution;
                    vec4 tl = texture2D(tDiffuse, vUv + vec2(-texelSize.x, -texelSize.y));
                    vec4 tr = texture2D(tDiffuse, vUv + vec2(texelSize.x, -texelSize.y));
                    vec4 bl = texture2D(tDiffuse, vUv + vec2(-texelSize.x, texelSize.y));
                    vec4 br = texture2D(tDiffuse, vUv + vec2(texelSize.x, texelSize.y));
                    vec4 center = texture2D(tDiffuse, vUv);
                    vec4 sobelX = (tr + br) - (tl + bl);
                    vec4 sobelY = (tl + tr) - (bl + br);
                    float edge = length(sobelX.rgb + sobelY.rgb) * edgeStrength;
                    vec3 edgeColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), edge * 0.5) * edge * edgeGlow;
                    gl_FragColor = vec4(center.rgb + edgeColor, center.a);
                }
            `
        };
    }

    setupLoader() {
        this.loader = new THREE.GLTFLoader();
        if (typeof THREE.DRACOLoader !== 'undefined') {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            this.loader.setDRACOLoader(dracoLoader);
        }
        this.clock = new THREE.Clock();
    }

    initControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxDistance = 50;
            this.controls.minDistance = 1;
            this.controls.enablePan = false;
        }
    }

    setupEventListeners() {
        window.addEventListener('scroll', this.throttledScroll, { passive: true });
        window.addEventListener('resize', this.throttledResize, { passive: true });
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this), { passive: true });
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0
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

    handleScroll() {
        const windowScrollTop = window.pageYOffset;
        const showcaseRect = this.showcaseContainer.getBoundingClientRect();
        const showcaseTopAbsolute = windowScrollTop + showcaseRect.top;
        const showcaseHeight = this.showcaseContainer.offsetHeight - (this.bufferScrollHeight * window.innerHeight / 100);
        const showcaseStart = showcaseTopAbsolute;
        const showcaseEnd = showcaseTopAbsolute + showcaseHeight;
        if (windowScrollTop < showcaseStart) {
            this.targetScrollProgress = 0;
        } else if (windowScrollTop > showcaseEnd) {
            this.targetScrollProgress = 1;
        } else {
            const scrollProgress = (windowScrollTop - showcaseStart) / showcaseHeight;
            this.targetScrollProgress = Math.max(0, Math.min(1, scrollProgress));
        }
        if (Math.abs(this.targetScrollProgress - this.scrollProgress) > 0.01) {
            console.log(`Scroll Progress: ${(this.targetScrollProgress * 100).toFixed(1)}%`);
            console.log(`Showcase Start: ${showcaseStart}, End: ${showcaseEnd}, Current: ${windowScrollTop}`);
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAnimation();
        } else {
            this.resumeAnimation();
        }
    }

    updateAnimationsFromScroll() {
        if (!this.animationMixer || this.animations.length === 0) return;
        const diff = this.targetScrollProgress - this.scrollProgress;
        if (Math.abs(diff) < 0.001) return;
        this.scrollProgress += diff * this.smoothingFactor;
        const targetTime = this.scrollProgress * this.maxScrollAnimationTime;
        this.animations.forEach(action => {
            const clipDuration = action.getClip().duration;
            const scaledTime = (targetTime / this.maxScrollAnimationTime) * clipDuration;
            action.time = Math.min(scaledTime, clipDuration);
            if (!action.isRunning()) {
                action.reset();
                action.play();
            }
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        });
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
                    this.scene.add(this.model);
                    this.setupGLTFCameras(gltf);
                    this.setupAnimations(gltf);
                    console.log('GLTF model loaded and optimized successfully');
                    this.seekAnimationsTo(0);
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

    optimizeModel(model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    this.optimizeMaterial(child.material);
                }
                if (child.geometry) {
                    this.optimizeGeometry(child.geometry);
                }
                child.frustumCulled = true;
            }
        });
    }

    optimizeMaterial(material) {
        if (Array.isArray(material)) {
            material.forEach(mat => this.optimizeMaterial(mat));
            return;
        }
        if (material.metalness !== undefined) {
            material.metalness = Math.max(material.metalness, 0.3);
        }
        if (material.roughness !== undefined) {
            material.roughness = Math.min(material.roughness, 0.6);
        }
        if (material.emissive !== undefined) {
            material.emissive.setHex(0x110022);
            material.emissiveIntensity = 0.1;
        }
        material.needsUpdate = false;
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

    setupGLTFCameras(gltf) {
        this.gltfCameras = [];
        gltf.scene.traverse((child) => {
            if (child.isCamera) {
                console.log('Found GLTF camera:', child.name);
                this.gltfCameras.push(child);
            }
        });
        if (gltf.cameras?.length > 0) {
            gltf.cameras.forEach((camera, index) => {
                console.log('Found GLTF camera in cameras array:', index);
                if (!this.gltfCameras.includes(camera)) {
                    this.gltfCameras.push(camera);
                }
            });
        }
        if (this.gltfCameras.length > 0) {
            this.switchToGLTFCamera(0);
        } else {
            console.log('No GLTF cameras found, using default camera');
            this.enableControls();
        }
    }

    switchToGLTFCamera(index) {
        if (this.gltfCameras[index]) {
            this.activeCamera = this.gltfCameras[index];
            this.camera = this.activeCamera;
            this.camera.aspect = this.cachedAspectRatio;
            this.camera.updateProjectionMatrix();
            if (this.renderPass) {
                this.renderPass.camera = this.camera;
            }
            this.disableControls();
            console.log('Using GLTF camera:', index);
        }
    }

    enableControls() {
        if (this.controls) {
            this.controls.enabled = true;
        }
    }

    disableControls() {
        if (this.controls) {
            this.controls.enabled = false;
        }
    }

    precacheAnimations() {
        if (!this.animationMixer || this.animations.length === 0) return;

        const precacheFrames = 60; // Increased for better coverage

        // Store original states
        const originalTimes = this.animations.map(action => action.time);
        const originalWeights = this.animations.map(action => action.weight);
        const originalEnabled = this.animations.map(action => action.enabled);

        console.log('Starting comprehensive animation precaching...');
        const startTime = performance.now();

        // Step 1: Sample keyframes at regular intervals
        for (let i = 0; i <= precacheFrames; i++) {
            const progress = i / precacheFrames;

            this.animations.forEach(action => {
                const clipDuration = action.getClip().duration;
                action.time = progress * clipDuration;
                action.weight = 1.0;
                action.enabled = true;
            });

            // Force mixer update to cache interpolated values
            this.animationMixer.update(0);
        }

        // Step 2: Precache scroll-based animation states
        this.precacheScrollStates();

        // Step 3: Warm up geometry buffers
        this.warmupGeometryBuffers();

        // Step 4: Prebake morph targets if present
        this.prebakeMorphTargets();

        // Restore original states
        this.animations.forEach((action, index) => {
            action.time = originalTimes[index];
            action.weight = originalWeights[index];
            action.enabled = originalEnabled[index];
        });

        const endTime = performance.now();
        console.log(`Animation precaching completed in ${(endTime - startTime).toFixed(2)}ms`);

        this.seekAnimationsTo(0);
    }
    seekAnimationsTo(time) {
        if (!this.animationMixer || this.animations.length === 0) return;
        
        console.log(`Seeking animations to time: ${time}`);
        
        this.animations.forEach(action => {
            const clipDuration = action.getClip().duration;
            // Ensure time is within clip bounds
            const seekTime = Math.max(0, Math.min(time, clipDuration));

            action.time = seekTime;
            action.reset();
            action.play();

            // For seeking to 0, use appropriate loop settings
            if (time === 0) {
                action.setLoop(THREE.LoopRepeat);
                action.clampWhenFinished = false;
            }
        });

        // Update mixer to apply the seek
        this.animationMixer.update(0);

        // Update scroll progress to match
        if (this.totalDuration > 0) {
            this.scrollProgress = time / this.maxScrollAnimationTime;
            this.targetScrollProgress = this.scrollProgress;
        }

        console.log(`Animations seeked to time ${time}, scroll progress: ${this.scrollProgress}`);
    }

    precacheScrollStates() {
        if (!this.animationMixer || this.animations.length === 0) return;

        // Precache states at key scroll positions
        const keyScrollPositions = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];

        keyScrollPositions.forEach(scrollProgress => {
            const targetTime = scrollProgress * this.maxScrollAnimationTime;

            this.animations.forEach(action => {
                const clipDuration = action.getClip().duration;
                const scaledTime = (targetTime / this.maxScrollAnimationTime) * clipDuration;
                action.time = Math.min(scaledTime, clipDuration);
            });

            this.animationMixer.update(0);
        });
    }

    warmupGeometryBuffers() {
        if (!this.model) return;

        this.model.traverse(child => {
            if (child.isMesh) {
                // Force buffer updates
                if (child.geometry) {
                    if (child.geometry.attributes.position) {
                        child.geometry.attributes.position.needsUpdate = true;
                    }
                    if (child.geometry.attributes.normal) {
                        child.geometry.attributes.normal.needsUpdate = true;
                    }
                    if (child.geometry.morphAttributes.position) {
                        child.geometry.morphAttributes.position.forEach(attr => {
                            attr.needsUpdate = true;
                        });
                    }

                    // Update bounding volumes
                    child.geometry.computeBoundingBox();
                    child.geometry.computeBoundingSphere();
                }

                // Update matrix world
                child.updateMatrixWorld(true);
            }

            // Precache skeleton if present
            if (child.isSkinnedMesh && child.skeleton) {
                child.skeleton.update();
                child.skeleton.bones.forEach(bone => {
                    bone.updateMatrixWorld(true);
                });
            }
        });
    }

    prebakeMorphTargets() {
        if (!this.model) return;

        this.model.traverse(child => {
            if (child.isMesh && child.morphTargetInfluences) {
                // Store original influences
                const originalInfluences = [...child.morphTargetInfluences];

                // Sample different morph combinations
                const morphSamples = 10;
                for (let i = 0; i <= morphSamples; i++) {
                    const influence = i / morphSamples;

                    child.morphTargetInfluences.forEach((_, index) => {
                        child.morphTargetInfluences[index] = influence;
                    });

                    // Force update
                    child.updateMorphTargets();
                }

                // Restore original influences
                child.morphTargetInfluences.forEach((_, index) => {
                    child.morphTargetInfluences[index] = originalInfluences[index];
                });
            }
        });
    }

    // Enhanced setupAnimations method with progressive loading
    setupAnimations(gltf) {
        this.animations = [];
        this.totalDuration = 0;

        if (gltf.animations?.length > 0) {
            this.animationMixer = new THREE.AnimationMixer(this.model);
            console.log('Found animations:', gltf.animations.length);
            console.log(`Animation will span ${this.maxScrollAnimationTime}s over the full scroll length`);

            gltf.animations.forEach((clip, index) => {
                console.log(`Setting up animation ${index + 1}: ${clip.name || 'Unnamed'} (duration: ${clip.duration}s)`);
                const action = this.animationMixer.clipAction(clip);

                // Optimize animation settings
                action.setLoop(THREE.LoopRepeat);
                action.clampWhenFinished = false;
                action.enabled = true;
                action.reset();
                action.play();

                this.animations.push(action);
                this.totalDuration = Math.max(this.totalDuration, clip.duration);
            });

            // Progressive precaching to avoid blocking
            this.progressivePrecaching();

            this.updateAnimationsFromScroll();
        } else {
            console.log('No animations found in GLTF');
        }
    }

    // Progressive precaching to avoid frame drops
    progressivePrecaching() {
        let currentFrame = 0;
        const totalFrames = 60;
        const framesPerBatch = 5; // Process 5 frames per RAF cycle

        const precacheBatch = () => {
            const endFrame = Math.min(currentFrame + framesPerBatch, totalFrames);

            for (let i = currentFrame; i < endFrame; i++) {
                const progress = i / totalFrames;

                this.animations.forEach(action => {
                    const clipDuration = action.getClip().duration;
                    action.time = progress * clipDuration;
                });

                this.animationMixer.update(0);
            }

            currentFrame = endFrame;

            if (currentFrame < totalFrames) {
                requestAnimationFrame(precacheBatch);
            } else {
                console.log('Progressive animation precaching completed');
                // Additional optimizations after precaching
                this.optimizePostPrecache();
            }
        };

        requestAnimationFrame(precacheBatch);
    }

    optimizePostPrecache() {
        // Set animation mixer to high performance mode
        if (this.animationMixer) {
            this.animationMixer.timeScale = 1.0;

            // Disable unnecessary updates for static parts
            this.animations.forEach(action => {
                if (action.getClip().tracks) {
                    action.getClip().tracks.forEach(track => {
                        // Mark tracks as optimized
                        track._optimized = true;
                    });
                }
            });
        }

        // Final geometry optimization
        if (this.model) {
            this.model.traverse(child => {
                if (child.isMesh && child.geometry) {
                    // Merge duplicate vertices after animation precaching
                    if (!child.geometry.index) {
                        child.geometry.mergeVertices();
                    }

                    // Optimize for animation playback
                    if (child.isSkinnedMesh) {
                        child.frustumCulled = false; // Animated objects need special handling
                    }
                }
            });
        }
    }


    // Add memory monitoring for precaching
    getAnimationCacheInfo() {
        return {
            totalAnimations: this.animations.length,
            totalDuration: this.totalDuration,
            currentScrollProgress: this.scrollProgress,
            targetScrollProgress: this.targetScrollProgress,
            mixerStats: this.animationMixer ? {
                time: this.animationMixer.time,
                timeScale: this.animationMixer.timeScale
            } : null
        };
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
        this.updateAnimationsFromScroll();
        if (this.animationMixer) {
            this.animationMixer.update(0);
        }
        if (this.controls?.enabled) {
            this.controls.update();
        }
        this.render();
        if (this.renderer && this.renderer.info) this.renderer.info.reset();

        // Aggressively free memory every 50 frames
        this._frameCount = (this._frameCount || 0) + 1;
        if (this._frameCount % 50 === 0) {
            this.freeWebGLMemory();
        }
    }

    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        this.needsResize = true;
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width === this.cachedDimensions.width && height === this.cachedDimensions.height) {
            return;
        }
        this.cachedDimensions.width = width;
        this.cachedDimensions.height = height;
        this.cachedAspectRatio = width / height;
        this.camera.aspect = this.cachedAspectRatio;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        if (this.edgePass?.uniforms?.resolution) {
            this.edgePass.uniforms.resolution.value.set(width, height);
        }
        console.log('Resized to:', width, 'x', height);
    }

    switchCamera(index) {
        if (this.gltfCameras[index]) {
            this.switchToGLTFCamera(index);
        }
    }

    toggleEdgeShader() {
        if (this.edgePass) {
            this.edgePass.enabled = !this.edgePass.enabled;
            console.log('Edge shader:', this.edgePass.enabled ? 'enabled' : 'disabled');
        }
    }

    setEdgeParams(strength = 2.0, glow = 0.8, thickness = 1.0) {
        if (this.edgePass?.uniforms) {
            this.edgePass.uniforms.edgeStrength.value = strength;
            this.edgePass.uniforms.edgeGlow.value = glow;
            this.edgePass.uniforms.edgeThickness.value = thickness;
        }
    }

    setSmoothness(factor = 0.15) {
        this.smoothingFactor = Math.max(0.01, Math.min(1.0, factor));
        console.log('Animation smoothness set to:', this.smoothingFactor);
    }

    setScrollAnimationDuration(seconds = 30) {
        this.maxScrollAnimationTime = seconds;
        console.log(`Animation duration for scroll set to: ${seconds}s`);
        this.updateAnimationsFromScroll();
    }

    setBufferScrollHeight(vh = 100) {
        this.bufferScrollHeight = vh;
        if (this.showcaseContainer) {
            this.showcaseContainer.style.height = `calc(500vh + ${this.bufferScrollHeight}vh)`;
        }
        console.log(`Buffer scroll height set to: ${vh}vh`);
    }

    disposeModel() {
        if (this.model) {
            // Stop and reset all animation actions before disposing
            if (this.animationMixer && this.animations.length > 0) {
                this.animations.forEach(action => {
                    action.stop();
                });
                this.animationMixer.stopAllAction();
            }
            this.animations = [];
            this.totalDuration = 0;
            this.animationMixer = null;
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
            this.scene.remove(this.model);
            this.model = null;
        }
    }

    cleanMaterial(material) {
        if (!material) return;
        material.dispose();
        for (const key in material) {
            const value = material[key];
            // Texture objects in Three.js have minFilter property
            if (value && typeof value === 'object' && 'minFilter' in value) {
                value.dispose && value.dispose();
            }
        }
    }

    freeWebGLMemory() {
        // Only aggressively clear memory on mobile devices
        if (!this.isMobile()) return;

        requestAnimationFrame(() => {
            if (!this.scene || !this.renderer) return;
            try {
                this.scene.traverse(object => {
                    if (!object.isMesh) return;
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => this.cleanMaterial(mat));
                        } else {
                            this.cleanMaterial(object.material);
                        }
                    }
                });
                if (this.renderer.renderLists) this.renderer.renderLists.dispose();
                // Optionally, force garbage collection if available
                if (window.gc) try { window.gc(); } catch (e) {}
                console.log("WebGL memory aggressively cleared (mobile only)!");
            } catch (e) {
                console.warn("Error during WebGL memory cleanup:", e);
            }
        });
    }

    dispose() {
        this.pauseAnimation();
        window.removeEventListener('scroll', this.throttledScroll);
        window.removeEventListener('resize', this.throttledResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.disposeModel();
        if (this.renderer) {
            try {
                if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
                this.renderer.dispose();
            } catch (e) {
                console.warn('Renderer dispose error:', e);
            }
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer = null;
        }
        if (this.composer) {
            this.composer.dispose();
        }
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        // Optionally, force garbage collection if available
        if (window.gc) try { window.gc(); } catch (e) {}
        console.log('Three.js loader disposed');
    }

    getPerformanceInfo() {
        if (!this.renderer) return null;
        return {
            render: this.renderer.info.render,
            memory: this.renderer.info.memory,
            fps: this.getFPS()
        };
    }

    getFPS() {
        if (!this.fpsCounter) {
            this.fpsCounter = { frames: 0, time: Date.now() };
        }
        this.fpsCounter.frames++;
        const now = Date.now();
        const delta = now - this.fpsCounter.time;
        if (delta >= 1000) {
            const fps = Math.round((this.fpsCounter.frames * 1000) / delta);
            this.fpsCounter.frames = 0;
            this.fpsCounter.time = now;
            return fps;
        }
        return null;
    }
}

const threeJSLoader = new OptimizedThreeJSLoader();

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing optimized Three.js scene...');
    const success = await threeJSLoader.init();
    if (success) {
        try {
            await threeJSLoader.loadGLTF('src/3DModel/optimized.glb');
        } catch (error) {
            console.error('Failed to load GLTF model:', error);
        }
    }
});

window.loadGLTF = (path) => threeJSLoader.loadGLTF(path);
window.initThree = () => threeJSLoader.init();
window.switchCamera = (index) => threeJSLoader.switchCamera(index);
window.toggleEdgeShader = () => threeJSLoader.toggleEdgeShader();
window.setEdgeParams = (strength, glow, thickness) => threeJSLoader.setEdgeParams(strength, glow, thickness);
window.setSmoothness = (factor) => threeJSLoader.setSmoothness(factor);
window.setScrollAnimationDuration = (seconds) => threeJSLoader.setScrollAnimationDuration(seconds);
window.setBufferScrollHeight = (vh) => threeJSLoader.setBufferScrollHeight(vh);
window.threeJSLoader = threeJSLoader;