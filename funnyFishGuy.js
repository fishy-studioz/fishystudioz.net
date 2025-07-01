const container = document.createElement('div');
container.style.position = 'absolute';
container.style.top = '0';
container.style.left = '0';
container.style.width = '100vw';
container.style.height = '100vh';
container.style.pointerEvents = 'none';
container.style.zIndex = '9999';
document.body.appendChild(container);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 3);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(2, 4, 4);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const loader = new THREE.GLTFLoader();
let mixer = null;

loader.load('src/Goofy.glb', (gltf) => {
    const model = gltf.scene;
    model.position.set(0, 0, 0);
    model.scale.set(0.18, 0.18, 0.18); // smaller
    model.rotation.y = Math.PI; // 90 degrees
    scene.add(model);

    if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
        });
    }
    animate();
});

function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(0.016);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});