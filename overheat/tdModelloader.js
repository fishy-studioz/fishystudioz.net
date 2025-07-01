const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 0);
camera.lookAt(0, 0, 0);

const horizCont = document.querySelector('.cnv');

const renderer = new THREE.WebGLRenderer({ 
  antialias: window.innerWidth > 768, // Disable antialiasing on mobile
  alpha: true,
  preserveDrawingBuffer: false, // Better performance on mobile
  powerPreference: "default" // Use default power instead of high-performance
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
horizCont.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x555555, 0.8); // Increased ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xb21927, 0.8); // Reduced directional light
directionalLight.position.set(5, 10, 17.5);
scene.add(directionalLight);

let model;
let modelLoaded = false;
const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Mobile-first approach: try to load without MTL first on mobile
if (isMobile) {
  console.log('Mobile detected - loading OBJ without MTL');
  
  const objLoader = new THREE.OBJLoader();
  objLoader.setPath('src/3DModel/');
  objLoader.load('modelLogo.obj', (object) => {
    // Apply a simple material that works reliably on mobile
    const mobileMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, // White color
      side: THREE.DoubleSide
    });
    
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = mobileMaterial;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    
    // Same positioning code
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const baseWidth = 1920;
    const baseScale = 2;
    const scaleFactor = (window.innerWidth / baseWidth) * baseScale;

    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;
    object.scale.setScalar(scaleFactor / 6);
    object.rotation.Y = -Math.PI / 2;
    object.rotation.x = 0;

    model = object;
    scene.add(model);
    modelLoaded = true;
    addFloatingAnimation();
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('Error loading OBJ on mobile:', error);
  });
  
} else {
  // Desktop: try MTL first, fallback to OBJ only
  const mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath('src/3DModel/');
  mtlLoader.load('modelLogo.mtl', (materials) => {
    materials.preload();

    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('src/3DModel/');
    objLoader.load('modelLogo.obj', (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const baseWidth = 1920;
      const baseScale = 2;
      const scaleFactor = (window.innerWidth / baseWidth) * baseScale;

      object.position.x -= center.x;
      object.position.y -= center.y;
      object.position.z -= center.z;
      object.scale.setScalar(scaleFactor / 7.5);
      object.rotation.Y = -Math.PI / 2;
      object.rotation.x = Math.PI / 2 + Math.PI/95;

      model = object;
      scene.add(model);
      modelLoaded = true;
      addFloatingAnimation();
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('Error loading model with MTL:', error);
      
      // Fallback to OBJ only on desktop too
      const objLoader = new THREE.OBJLoader();
      objLoader.setPath('src/3DModel/');
      objLoader.load('modelLogo.obj', (object) => {
        const defaultMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xcccccc,
          side: THREE.DoubleSide
        });
        
        object.traverse((child) => {
          if (child.isMesh) {
            child.material = defaultMaterial;
          }
        });
        
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const baseWidth = 1920;
        const baseScale = 2;
        const scaleFactor = (window.innerWidth / baseWidth) * baseScale;

        object.position.x -= center.x;
        object.position.y -= center.y;
        object.position.z -= center.z;
        object.scale.setScalar(scaleFactor / 7.5);
        object.rotation.Y = -Math.PI / 2;
        object.rotation.x = Math.PI / 2 + Math.PI/95;

        model = object;
        scene.add(model);
        modelLoaded = true;
        addFloatingAnimation();
      });
    });
  },
  (xhr) => {
    console.log('MTL: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('Error loading MTL:', error);
    // Fallback to OBJ only
    const objLoader = new THREE.OBJLoader();
    objLoader.setPath('src/3DModel/');
    objLoader.load('modelLogo.obj', (object) => {
      const defaultMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xcccccc,
        side: THREE.DoubleSide
      });
      
      object.traverse((child) => {
        if (child.isMesh) {
          child.material = defaultMaterial;
        }
      });
      
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const baseWidth = 1920;
      const baseScale = 2;
      const scaleFactor = (window.innerWidth / baseWidth) * baseScale;

      object.position.x -= center.x;
      object.position.y -= center.y;
      object.position.z -= center.z;
      object.scale.setScalar(scaleFactor / 7.5);
      object.rotation.Y = -Math.PI / 2;
      object.rotation.x = Math.PI / 2 + Math.PI/95;

      model = object;
      scene.add(model);
      modelLoaded = true;
      addFloatingAnimation();
    });
  });
}

function addFloatingAnimation() {
  if (!model) return;

  gsap.killTweensOf(model.rotation, "z");

  gsap.to(model.rotation, {
    y: "+=0.05",
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (modelLoaded) {
    const baseWidth = 1920;
    const baseScale = 2;
    const scaleFactor = (window.innerWidth / baseWidth) * baseScale;
    
    if (window.innerWidth <= 768) {
      model.scale.setScalar(scaleFactor / 6);
    } else {
      model.scale.setScalar(scaleFactor * 8.5);
    }
  }

  ScrollTrigger.getAll().forEach(t => t.kill());
  initHorizontalScroll();
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

gsap.registerPlugin(ScrollTrigger);

function initHorizontalScroll() {
  const wrapper = document.querySelector(".horizontal-wrapper");
  const longText = document.querySelector(".longText");

  if (window.innerWidth > 768) {
    const textRight = longText.getBoundingClientRect().right;
    const wrapperLeft = wrapper.getBoundingClientRect().left;
    const buffer = 300;
    const scrollDistance = textRight - wrapperLeft - window.innerWidth + buffer;

    const horizontalTween = gsap.to(wrapper, {
      x: () => `-${scrollDistance}px`,
      ease: "none"
    });

    ScrollTrigger.create({
      trigger: ".horizontal-section",
      start: "top top",
      end: () => scrollDistance,
      pin: true,
      scrub: 1,
      animation: horizontalTween,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (model && window.innerWidth > 768) {
          model.rotation.x = (1 - self.progress) * Math.PI / 2;
        }
      }
    });
  } else {
    if (model) {
      model.rotation.x = 0;
    }
  }
}

initHorizontalScroll();

document.querySelectorAll('.animate-text').forEach((el) => {
  const span = el.querySelector('.marqSpan');
  const clone = span.cloneNode(true);
  el.appendChild(clone);
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.animate-text').forEach(el => {
    el.innerHTML = ''; // clear
    const span = document.createElement('span');
    span.className = 'marqSpan';
    span.innerText = 'Your Text'; // or store original somewhere
    el.appendChild(span);
    el.appendChild(span.cloneNode(true));
  });
});

// Make sure GSAP and d3 and html2canvas are loaded in your page

const targets = document.querySelectorAll('.target');
const BASE_NUM_POINTS = 15;
const EXTRA_PARTICLES = 20; // fine shards

targets.forEach(target => {
  let shattered = false;

  target.addEventListener('click', async () => {
    if (shattered) return;
    shattered = true;

    const isMobile = window.innerWidth <= 768;
    const scaleFactor = isMobile ? 0.6 : 1;
    const NUM_POINTS = Math.floor(BASE_NUM_POINTS * scaleFactor);
    const maxAmplitude = 30 * scaleFactor;
    const maxFrequency = 5;

    target.style.willChange = "transform";

    const vibrationTimeline = gsap.timeline();
    const steps = 20;

    for (let i = 0; i < steps; i++) {
      const progress = (i + 1) / steps;
      const amplitude = maxAmplitude * progress;
      const freq = 100 + (maxFrequency - 100) * progress;
      const halfCycleDuration = 1 / (2 * freq);

      vibrationTimeline.to(target, {
        duration: halfCycleDuration,
        x: amplitude,
        ease: "power1.inOut",
      });
      vibrationTimeline.to(target, {
        duration: halfCycleDuration,
        x: -amplitude,
        ease: "power1.inOut",
      });
    }

    vibrationTimeline.to(target, {
      duration: 0.02,
      x: 0,
      ease: "power1.out"
    });

    await vibrationTimeline.play();

    const canvas = await html2canvas(target, { scale: 1, backgroundColor: null });
    const width = canvas.width;
    const height = canvas.height;

    target.style.opacity = '0';

    const points = Array.from({ length: NUM_POINTS }, () => [
      Math.random() * width,
      Math.random() * height
    ]);

    const delaunay = d3.Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    const parentRect = target.getBoundingClientRect();

    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.left = `${parentRect.left + window.scrollX}px`;
    flash.style.top = `${parentRect.top + window.scrollY}px`;
    flash.style.width = `${width}px`;
    flash.style.height = `${height}px`;
    flash.style.pointerEvents = 'none';
    flash.style.background = 'radial-gradient(circle at center, white 0%, transparent 80%)';
    flash.style.transformOrigin = 'center';
    flash.style.transform = 'scaleX(2)';
    flash.style.opacity = '0.8';
    flash.style.transition = 'opacity 0.5s ease-out';
    document.body.appendChild(flash);

    const overlayLink = document.createElement('a');
    overlayLink.href = target.getAttribute('c_href');
    overlayLink.target = '_blank';
    overlayLink.style.position = 'absolute';
    overlayLink.style.left = `${parentRect.left + window.scrollX}px`;
    overlayLink.style.top = `${parentRect.top + window.scrollY}px`;
    overlayLink.style.width = `${parentRect.width}px`;
    overlayLink.style.height = `${parentRect.height}px`;
    overlayLink.style.zIndex = '9999';
    overlayLink.style.cursor = 'pointer';
    overlayLink.style.display = 'block';
    overlayLink.style.background = 'transparent';
    overlayLink.style.pointerEvents = 'auto';
    overlayLink.style.borderRadius = getComputedStyle(target).borderRadius;
    document.body.appendChild(overlayLink);
    
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 500);
    }, 100);

    let fragmentsCompleted = 0;
    const allFrags = [];

    function createFragment(poly, draw = true) {
      const frag = document.createElement('canvas');
      frag.width = width;
      frag.height = height;
      frag.style.width = `${width}px`;
      frag.style.height = `${height}px`;
      frag.style.position = 'absolute';
      frag.style.left = `${parentRect.left + window.scrollX}px`;
      frag.style.top = `${parentRect.top + window.scrollY}px`;
      frag.style.pointerEvents = 'none';

      const ctx = frag.getContext('2d');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(poly[0][0], poly[0][1]);
      poly.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.clip();

      if (draw) ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      document.body.appendChild(frag);
      return frag;
    }

    for (let i = 0; i < points.length; i++) {
      const poly = voronoi.cellPolygon(i);
      if (!poly) continue;

      const frag = createFragment(poly);
      allFrags.push(frag);

      const dx = points[i][0] - width / 2;
      const dy = points[i][1] - height / 2;
      const angle = Math.atan2(dy, dx);

      gsap.to(frag, {
        duration: 0.7,
        x: Math.cos(angle) * 20 * scaleFactor,
        y: Math.sin(angle) * 20 * scaleFactor,
        rotation: Math.random() * 10 - 5,
        ease: "power2.out",
        onComplete: () => {
          fragmentsCompleted++;
          if (fragmentsCompleted === points.length) {
            const url = target.getAttribute('c_href');
            if (url) window.open(url, '_blank');
          }

          gsap.to(frag, {
            duration: 3 + Math.random() * 2,
            y: `+=${2 + Math.random() * 3}`,
            x: `+=${(Math.random() - 0.5) * 2}`,
            rotation: `+=${(Math.random() - 0.5) * 2}`,
            ease: "circ.Out",
            repeat: -1,
            yoyo: true,
            repeatRefresh: true
          });
        }
      });
    }

    // Additional fine particles
    for (let i = 0; i < EXTRA_PARTICLES; i++) {
      const frag = document.createElement('div');
      const size = 3 + Math.random() * 3;

      // Position within target bounds
      const left = parentRect.left + window.scrollX + Math.random() * width;
      const top = parentRect.top + window.scrollY + Math.random() * height;

      Object.assign(frag.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'white', // high contrast
        opacity: '1',
        boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
        left: `${left}px`,
        top: `${top}px`,
        pointerEvents: 'none',
        zIndex: '99999', // above everything else
      });
    
      document.body.appendChild(frag);
    
      gsap.to(frag, {
        delay: Math.random() * 0.2,
        duration: 1 + Math.random() * 1.5,
        x: (Math.random() - 0.5) * 100 * scaleFactor,
        y: (Math.random() - 0.5) * 100 * scaleFactor,
        scale: 0.4,
        opacity: 0,
        ease: "power2.out",
        onComplete: () => frag.remove()
      });
    }

  });
});




