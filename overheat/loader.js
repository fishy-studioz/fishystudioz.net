const mainScene = new THREE.Scene();
mainScene.background = null;

const viewCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
viewCamera.position.set(0, 5, 15);
viewCamera.lookAt(0, 0, 0);

const containerDiv = document.querySelector('#loader3D');

const webglRenderer = new THREE.WebGLRenderer({ 
    antialias: window.innerWidth > 768,
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "default"
});
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
webglRenderer.outputColorSpace = THREE.SRGBColorSpace;
containerDiv.appendChild(webglRenderer.domElement);

// Check for rare intro condition
const urlParams = new URLSearchParams(window.location.search);
const forceRare = urlParams.has('i') && urlParams.get('i') === 'rare';
const randomChance = Math.random() < 0.001; // 0.1% chance
const shouldShowRareIntro = forceRare || randomChance;

if (shouldShowRareIntro) {
    console.log('Showing rare intro!');
    
    // Hide the 3D scene
    containerDiv.style.display = 'none';
    
    // Create black screen
    const blackScreen = document.createElement('div');
    blackScreen.style.position = 'fixed';
    blackScreen.style.top = '0';
    blackScreen.style.left = '0';
    blackScreen.style.width = '100vw';
    blackScreen.style.height = '100vh';
    blackScreen.style.backgroundColor = 'black';
    blackScreen.style.zIndex = '9999';
    blackScreen.style.display = 'flex';
    blackScreen.style.justifyContent = 'center';
    blackScreen.style.alignItems = 'center';
    document.body.appendChild(blackScreen);
    
    // After 2 seconds, show the rare image
    setTimeout(() => {
        const rareImage = document.createElement('img');
        rareImage.src = 'src/GIFwork/rare_intro.png';
        rareImage.style.maxWidth = '100%';
        rareImage.style.maxHeight = '100%';
        rareImage.style.objectFit = 'contain';
        
        rareImage.onload = () => {
            blackScreen.appendChild(rareImage);
            
            // After showing the rare image for 3 seconds, fade out
            setTimeout(() => {
                blackScreen.style.transition = 'opacity 1s ease-out';
                blackScreen.style.opacity = '0';
                
                setTimeout(() => {
                    blackScreen.remove();
                    // Show the normal content after rare intro
                    const loader = document.getElementById('loader');
                    if (loader) {
                        loader.style.display = 'none';
                    }
                }, 1000);
            }, 3000);
        };
        
        rareImage.onerror = () => {
            console.error('Failed to load rare_intro.png');
            // Fallback: just fade out the black screen
            setTimeout(() => {
                blackScreen.style.transition = 'opacity 1s ease-out';
                blackScreen.style.opacity = '0';
                setTimeout(() => blackScreen.remove(), 1000);
            }, 1000);
        };
    }, 2000);
    
} else {
    // Normal loading sequence
    const sweepLight = new THREE.DirectionalLight(0xb21927, 0);
    sweepLight.position.set(-20, 15, 10);
    mainScene.add(sweepLight);

    // Light sweep animation function
    function lightSweep() {
        // Reset position to start
        sweepLight.position.set(-20, 15, 10);
        sweepLight.intensity = 0;
        
        // Animate the light sweep
        const startTime = Date.now();
        const sweepDuration = 1000; // 1 second sweep
        
        function animateSweep() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / sweepDuration, 1);
            
            if (progress < 1) {
                // Move light diagonally across
                const x = -20 + (40 * progress); // -20 to +20
                const z = 10 - (20 * progress);  // 10 to -10
                sweepLight.position.set(x, 15, z);
                
                // Intensity peaks in the middle of the sweep
                const intensityProgress = Math.sin(progress * Math.PI);
                sweepLight.intensity = intensityProgress * 2.0;
                
                requestAnimationFrame(animateSweep);
            } else {
                // Sweep complete, turn off light
                sweepLight.intensity = 0;
            }
        }
        
        animateSweep();
    }

    // Start the repeating light sweep every 3 seconds
    setInterval(lightSweep, 3000);

    let meshObject;
    let objectReady = false;
    const mobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (mobileDevice) {
        console.log('Mobile device detected - loading OBJ without MTL');
        
        const objectLoader = new THREE.OBJLoader();
        objectLoader.setPath('src/3DModel/');
        objectLoader.load('modelLogo.obj', (loadedObject) => {
            const simpleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffffff,
                side: THREE.DoubleSide
            });
            
            loadedObject.traverse((child) => {
                if (child.isMesh) {
                    child.material = simpleMaterial;
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
            
            const boundingBox = new THREE.Box3().setFromObject(loadedObject);
            const boxCenter = boundingBox.getCenter(new THREE.Vector3());
            const referenceWidth = 1920;
            const referenceScale = 2;
            const currentScale = (window.innerWidth / referenceWidth) * referenceScale;

            loadedObject.position.x -= boxCenter.x;
            loadedObject.position.y -= boxCenter.y;
            loadedObject.position.z -= boxCenter.z;
            loadedObject.scale.setScalar(currentScale / 6);
            
            loadedObject.rotation.x =  Math.PI / 2.35;
            loadedObject.rotation.y = -Math.PI/10;
            loadedObject.rotation.z = 0;

            meshObject = loadedObject;
            mainScene.add(meshObject);
            objectReady = true;
        },
        (progressEvent) => {
            console.log((progressEvent.loaded / progressEvent.total * 100) + '% loaded');
        },
        (loadError) => {
            console.error('Error loading OBJ on mobile:', loadError);
        });
        
    } else {
        const materialLoader = new THREE.MTLLoader();
        materialLoader.setPath('src/3DModel/');
        materialLoader.load('modelLogo.mtl', (loadedMaterials) => {
            loadedMaterials.preload();

            const objectLoader = new THREE.OBJLoader();
            objectLoader.setMaterials(loadedMaterials);
            objectLoader.setPath('src/3DModel/');
            objectLoader.load('modelLogo.obj', (loadedObject) => {
                const boundingBox = new THREE.Box3().setFromObject(loadedObject);
                const boxCenter = boundingBox.getCenter(new THREE.Vector3());
                const referenceWidth = 1920;
                const referenceScale = 2;
                const currentScale = (window.innerWidth / referenceWidth) * referenceScale;

                loadedObject.position.x -= boxCenter.x;
                loadedObject.position.y -= boxCenter.y;
                loadedObject.position.z -= boxCenter.z;
                loadedObject.scale.setScalar(currentScale / 6);
                
                loadedObject.rotation.x =  Math.PI / 2.35;
                loadedObject.rotation.y = -Math.PI/10;
                loadedObject.rotation.z = 0;
                
                meshObject = loadedObject;
                mainScene.add(meshObject);
                objectReady = true;
            },
            (progressEvent) => {
                console.log((progressEvent.loaded / progressEvent.total * 100) + '% loaded');
            },
            (loadError) => {
                console.error('Error loading model with MTL:', loadError);
                
                // Fallback to OBJ only
                const fallbackLoader = new THREE.OBJLoader();
                fallbackLoader.setPath('src/3DModel/');
                fallbackLoader.load('modelLogo.obj', (loadedObject) => {
                    const fallbackMaterial = new THREE.MeshLambertMaterial({ 
                        color: 0xcccccc,
                        side: THREE.DoubleSide
                    });
                    
                    loadedObject.traverse((child) => {
                        if (child.isMesh) {
                            child.material = fallbackMaterial;
                        }
                    });
                    
                    const boundingBox = new THREE.Box3().setFromObject(loadedObject);
                    const boxCenter = boundingBox.getCenter(new THREE.Vector3());
                    const referenceWidth = 1920;
                    const referenceScale = 2;
                    const currentScale = (window.innerWidth / referenceWidth) * referenceScale;

                    loadedObject.position.x -= boxCenter.x;
                    loadedObject.position.y -= boxCenter.y;
                    loadedObject.position.z -= boxCenter.z;
                    loadedObject.scale.setScalar(currentScale / 7.5);
                    
                    loadedObject.rotation.x = 0;
                    loadedObject.rotation.y = 0;
                    loadedObject.rotation.z = 0;

                    meshObject = loadedObject;
                    mainScene.add(meshObject);
                    objectReady = true;
                });
            });
        },
        (progressEvent) => {
            console.log('MTL: ' + (progressEvent.loaded / progressEvent.total * 100) + '% loaded');
        },
        (loadError) => {
            console.error('Error loading MTL:', loadError);
            
            // Fallback to OBJ only
            const fallbackLoader = new THREE.OBJLoader();
            fallbackLoader.setPath('src/3DModel/');
            fallbackLoader.load('modelLogo.obj', (loadedObject) => {
                const fallbackMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xcccccc,
                    side: THREE.DoubleSide
                });
                
                loadedObject.traverse((child) => {
                    if (child.isMesh) {
                        child.material = fallbackMaterial;
                    }
                });
                
                const boundingBox = new THREE.Box3().setFromObject(loadedObject);
                const boxCenter = boundingBox.getCenter(new THREE.Vector3());
                const referenceWidth = 1920;
                const referenceScale = 2;
                const currentScale = (window.innerWidth / referenceWidth) * referenceScale;

                loadedObject.position.x -= boxCenter.x;
                loadedObject.position.y -= boxCenter.y;
                loadedObject.position.z -= boxCenter.z;
                loadedObject.scale.setScalar(currentScale / 7.5);
                
                loadedObject.rotation.x = 0;
                loadedObject.rotation.y = 0;
                loadedObject.rotation.z = 0;

                meshObject = loadedObject;
                mainScene.add(meshObject);
                objectReady = true;
            });
        });
    }

    window.addEventListener('resize', () => {
        viewCamera.aspect = window.innerWidth / window.innerHeight;
        viewCamera.updateProjectionMatrix();
        webglRenderer.setSize(window.innerWidth, window.innerHeight);
        webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (objectReady && meshObject) {
            const referenceWidth = 1920;
            const referenceScale = 2;
            const currentScale = (window.innerWidth / referenceWidth) * referenceScale;
            
            if (window.innerWidth <= 768) {
                meshObject.scale.setScalar(currentScale / 6);
            } else {
                meshObject.scale.setScalar(currentScale * 8.5);
            }
        }
    });

    function renderLoop() {
        requestAnimationFrame(renderLoop);
        webglRenderer.render(mainScene, viewCamera);
    }

    renderLoop();
}

document.addEventListener('DOMContentLoaded', function() {
    // Skip normal loading sequence if showing rare intro
    if (shouldShowRareIntro) {
        return;
    }
    
    setTimeout(() => {
        const video = document.getElementById('ldvid');
        const loader = document.getElementById('loader');
        
        // Play the video once DOM is loaded
        if (video) {
            video.play().catch(error => {
                console.log('Video autoplay failed:', error);
            });
            
            // When video ends, fade out the loader
            video.addEventListener('ended', function() {
                fadeOutLoader();
            });
            
            // Fallback: if video fails to load or play, fade out after 3 seconds
            video.addEventListener('error', function() {
                console.log('Video failed to load, using fallback timer');
                setTimeout(fadeOutLoader, 3000);
            });
            
            // Additional fallback for very slow loading
            setTimeout(() => {
                if (video.currentTime === 0 && !video.ended) {
                    console.log('Video taking too long, forcing fadeout');
                    fadeOutLoader();
                }
            }, 5000);
        } else {
            // If video element not found, fade out immediately
            console.log('Video element not found, fading out loader');
            setTimeout(fadeOutLoader, 1000);
        }
        
        function fadeOutLoader() {
            if (loader) {
                loader.style.transition = 'opacity 1s ease-out';
                loader.style.opacity = '0';
                
                // Remove loader from DOM after fade completes
                setTimeout(() => {
                    loader.style.display = 'none';
                    // Optional: completely remove from DOM
                    // loader.remove();
                }, 1000);
            }
        }
    }, 5000)
});