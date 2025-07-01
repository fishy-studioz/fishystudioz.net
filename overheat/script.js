// === TERMINAL SIMULATION SETUP ===

const margin = 10;
const lncCont = document.getElementById('lnc');

const terminalBox = document.createElement('div');
Object.assign(terminalBox.style, {
  position: 'absolute',
  top: `${margin}px`,
  left: `${margin}px`,
  width: '250px',
  height: '125px',
  padding: '4px',
  backgroundColor: 'rgba(0,0,0,0)',
  color: '#b21927',
  fontFamily: 'monospace, monospace',
  fontSize: '5px',
  lineHeight: '5px',
  overflow: 'hidden',
  whiteSpace: 'pre',
  borderRadius: '3px',
  boxSizing: 'border-box',
  userSelect: 'none',
  pointerEvents: 'none',
});

lncCont.appendChild(terminalBox);

const maxLines = 25;
const displayedLines = [];

function printLine(text) {
  if (displayedLines.length >= maxLines) displayedLines.shift();
  displayedLines.push(text);
  terminalBox.textContent = displayedLines.join('\n');
}

function replaceLastLine(text) {
  if (displayedLines.length > 0) {
    displayedLines[displayedLines.length - 1] = text;
  } else {
    displayedLines.push(text);
  }
  terminalBox.textContent = displayedLines.join('\n');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const interjectedLines = [
  '> Allocating memory...',
  '> Spawning background threads...',
  '> Waiting for dependencies...',
  '> Performing cleanup...',
  '> Checking system load...',
  '> Flushing logs...',
  '> Compressing assets...',
  '> Verifying timestamps...',
  '> Synchronizing clocks...',
  '> Handshaking with mirror...',
  '> Updating routing table...',
  '> Overclocking core sequence...',
  '> Encrypting connection...'
];

const burstLines = [
  '[DEBUG] frame=289 temp=57.2°C voltage=3.3V',
  '[TRACE] packet received: 0x9A7F',
  '[SYS] mount: /dev/loop0 -> /mnt',
  '[INFO] task #418 queued',
  '[INFO] freed 38 MB',
  '[MEM] GC sweep started...',
  '[IO] listening on port 4218',
  '[NET] peer connected: 192.168.0.11',
  '[DISK] Write latency: 4ms',
  '[GPU] idle: false',
  '[FS] inode cache flushed',
  '[CPU] throttle: off',
  '[RT] tickrate = 1.0000001'
];

function getRandomLog() {
  return interjectedLines[Math.floor(Math.random() * interjectedLines.length)];
}

function getBurstLine() {
  return burstLines[Math.floor(Math.random() * burstLines.length)];
}

async function simulateProgress(label = 'Progress', total = 10) {
  for (let i = 0; i <= total; i++) {
    const bar = `${label} [` + '█'.repeat(i) + '░'.repeat(total - i) + ']';
    replaceLastLine(bar);

    if (i !== total && Math.random() < 0.3) {
      await wait(100);
      printLine(getRandomLog());
    }

    await wait(250 + Math.random() * 250);
  }
}

async function simulateBurst() {
  const count = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    printLine(getBurstLine());
    await wait(30 + Math.random() * 70);
  }
}

async function simulateTerminal() {
  printLine('> Initializing system...');
  await wait(500);
  printLine('> Boot sequence starting...');
  await wait(500);
  printLine('> Checking dependencies...');
  await wait(600);
  printLine('');

  await simulateProgress('Compiling', 12);
  await wait(300);
  printLine('[✓] Compilation complete');

  await wait(500);
  await simulateBurst();

  await wait(600);
  printLine('> Launching services...');
  await wait(400);
  printLine('');

  await simulateProgress('Deploying', 8);
  printLine('[✓] Deployed to localhost');

  await wait(300);
  await simulateBurst();

  await wait(800);
  printLine('> Synchronizing subsystems...');
  await wait(1000);
  printLine('[✓] Synchronized');

  await wait(1000);
  printLine('> Restarting log simulation...\n');
  await wait(1500);

  simulateTerminal();
}

simulateTerminal();


const Gcn = document.getElementById("gun");
const Gsc = new THREE.Scene();
Gsc.background = null;

const Gcam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
Gcam.position.set(0, 10, 20);
Gcam.lookAt(0, 0, 0);

const Grn = new THREE.WebGLRenderer({ alpha: true, antialias: true });
Grn.setSize(Gcn.clientWidth, Gcn.clientHeight, false);
Grn.setPixelRatio(Math.min(window.devicePixelRatio, 2));
Gcn.appendChild(Grn.domElement);

const Gal = new THREE.AmbientLight(0xffffff, 1);
Gsc.add(Gal);

const Gdl = new THREE.DirectionalLight(0xffffff, 1);
Gdl.position.set(5, 10, 7);
Gsc.add(Gdl);

// Mouse tracking variables
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationZ = 0;

// Shooting effect variables
let isVibrating = false;
let vibrationTimer = 0;
let vibrationDuration = 0.51; // Exactly 0.47 seconds
let maxAmplitude = 0.3;
let maxFrequency = 150;
let recoilOffset = 0;
let recoilTimer = 0;
let vibrationOffsetX = 0;
let vibrationOffsetZ = 0;

// Mouse move event listener
window.addEventListener('mousemove', (event) => {
  // Normalize mouse coordinates to -1 to 1 range
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Calculate target rotations based on mouse position
  targetRotationZ = mouseX; // Horizontal rotation (left/right)
  targetRotationX = mouseY * 0.8; // Vertical rotation (up/down)
});

// Click event listener for shooting effect
window.addEventListener('click', () => {
  // Start progressive vibration effect
  isVibrating = true;
  vibrationTimer = 0;
  vibrationOffsetX = 0;
  vibrationOffsetZ = 0;
  
  // Reset recoil (will start after vibration completes)
  recoilOffset = 0;
  recoilTimer = 0;
});

function GonRs() {
  const Gw = Gcn.clientWidth;
  const Gh = Gcn.clientHeight;
  Grn.setSize(Gw, Gh, false);
  Gcam.aspect = Gw / Gh;
  Gcam.updateProjectionMatrix();
}
window.addEventListener("resize", GonRs);
GonRs();

let Gmdl = null;
let baseRotationX = Math.PI/2.25;
let baseRotationZ = -(Math.PI/1.75 - 0.02);

const Gml = new THREE.MTLLoader();
Gml.setPath("src/3DModel/");
Gml.load("sundance.mtl", Gmtl => {
  Gmtl.preload();
  
  const Gol = new THREE.OBJLoader();
  Gol.setMaterials(Gmtl);
  Gol.setPath("src/3DModel/");
  Gol.load("sundance.obj", Gob => {
    const Gbx = new THREE.Box3().setFromObject(Gob);
    const Gct = Gbx.getCenter(new THREE.Vector3());
    Gob.position.sub(Gct); // center it
    Gob.scale.setScalar(0.8);

    // Ensure transparency is off
    Gob.traverse(child => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.metalness = 0;
            mat.roughness = 1;
            mat.envMap = null;
            mat.needsUpdate = true;
          });
        } else {
          child.material.metalness = 0;
          child.material.roughness = 1;
          child.material.envMap = null;
          child.material.needsUpdate = true;
        }
      }
    });

    Gmdl = Gob;
    
    if(Gmdl){
      Gmdl.rotation.x = baseRotationX;
      Gmdl.rotation.z = baseRotationZ;
      Gmdl.position.y -= 10;
      Gmdl.position.x += 5;
    }
    
    if (Gmdl) {
      Gmdl.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1;
          child.material.depthWrite = true;
          child.material.alphaTest = 0;
        }
      });
    }
    
    Gsc.add(Gmdl);
  },
  xhr => {
    console.log(`OBJ: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`);
  },
  err => {
    console.error("Error loading OBJ:", err);
  });
}, xhr => {
  console.log(`MTL: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`);
}, err => {
  console.error("Error loading MTL:", err);
});

function Gani() {
  requestAnimationFrame(Gani);
  
  // Update gun rotation based on mouse position with smooth interpolation
  if (Gmdl) {
    let finalRotationX = baseRotationX + targetRotationX;
    let finalRotationZ = baseRotationZ + targetRotationZ;
    let finalPositionY = -2.5;
    
    // Handle progressive vibration effect (exactly 0.47 seconds)
    if (isVibrating && vibrationTimer < vibrationDuration) {
      vibrationTimer += 0.016; // Roughly 60fps increment
      
      const progress = vibrationTimer / vibrationDuration;
      const amplitude = maxAmplitude * progress;
      const freq = 100 + (maxFrequency - 100) * progress;
      
      // Create oscillating motion with increasing intensity
      const timeOffset = performance.now() * 0.001; // Convert to seconds
      vibrationOffsetX = Math.sin(timeOffset * freq * Math.PI * 2) * amplitude;
      vibrationOffsetZ = Math.cos(timeOffset * freq * Math.PI * 2) * amplitude * 0.7;
      
      // Apply vibration to rotation
      finalRotationX += vibrationOffsetX;
      finalRotationZ += vibrationOffsetZ;
    } else if (isVibrating && vibrationTimer >= vibrationDuration) {
      // Vibration completed - start recoil IMMEDIATELY
      isVibrating = false;
      vibrationOffsetX = 0;
      vibrationOffsetZ = 0;
      
      // Start recoil effect immediately
      recoilOffset = 3.5; // Strong backward recoil
      recoilTimer = 0;
    }
    
    // Handle recoil effect
    if (recoilOffset !== 0) {
      recoilTimer += 0.016;
      
      if (recoilTimer < 0.6) { // Recoil animation lasts 0.6 seconds
        // Apply recoil to rotation (gun kicks back/up)
        const recoilWave = Math.cos(recoilTimer * 10) * Math.exp(-recoilTimer * 3);
        finalRotationX += recoilOffset * recoilWave;
        
        // Move gun back slightly with bounce
        const positionRecoil = Math.cos(recoilTimer * 8) * Math.exp(-recoilTimer * 4);
        finalPositionY += recoilOffset * 0.3 * positionRecoil;
        
        // Gradually reduce recoil
        recoilOffset *= 0.94;
      } else {
        recoilOffset = 0;
        recoilTimer = 0;
      }
    }
    
    // Apply all transformations with smooth interpolation
    Gmdl.rotation.x = THREE.MathUtils.lerp(Gmdl.rotation.x, finalRotationX, 0.1);
    Gmdl.rotation.z = THREE.MathUtils.lerp(Gmdl.rotation.z, finalRotationZ, 0.1);
    Gmdl.position.y = THREE.MathUtils.lerp(Gmdl.position.y, finalPositionY, 0.15);
  }
  
  Grn.render(Gsc, Gcam);
}
Gani();