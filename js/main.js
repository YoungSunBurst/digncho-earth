import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const container = document.getElementById('canvas-container');

// Camera
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 3;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000011);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.5;
controls.maxDistance = 10;
controls.enablePan = false;

// Texture loader
const textureLoader = new THREE.TextureLoader();
const loadingManager = new THREE.LoadingManager();

// Loading progress
let loadedCount = 0;
const totalTextures = 4;

loadingManager.onLoad = () => {
    document.getElementById('loading').style.display = 'none';
};

// Texture URLs from Solar System Scope (CC BY 4.0)
const TEXTURE_BASE = 'https://www.solarsystemscope.com/textures/';

// Create Earth
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

// Load textures
const earthDayTexture = textureLoader.load(
    TEXTURE_BASE + '2k_earth_daymap.jpg',
    () => updateLoading()
);
const earthNightTexture = textureLoader.load(
    TEXTURE_BASE + '2k_earth_nightmap.jpg',
    () => updateLoading()
);
const earthBumpTexture = textureLoader.load(
    TEXTURE_BASE + '2k_earth_normal_map.tif',
    () => updateLoading(),
    undefined,
    () => {
        // Fallback if tif doesn't load
        updateLoading();
    }
);
const earthSpecularTexture = textureLoader.load(
    TEXTURE_BASE + '2k_earth_specular_map.tif',
    () => updateLoading(),
    undefined,
    () => updateLoading()
);

function updateLoading() {
    loadedCount++;
    const progress = Math.round((loadedCount / totalTextures) * 100);
    document.getElementById('loading').textContent = `Loading Earth... ${progress}%`;
    if (loadedCount >= totalTextures) {
        document.getElementById('loading').style.display = 'none';
    }
}

// Earth material with day texture
const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthDayTexture,
    bumpScale: 0.05,
    specular: new THREE.Color(0x333333),
    shininess: 5
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Clouds layer
const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);
const cloudsTexture = textureLoader.load(TEXTURE_BASE + '2k_earth_clouds.jpg');

const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
});

const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
scene.add(clouds);

// Atmosphere glow
const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});

const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);

// Stars background
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        sizeAttenuation: true
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    return new THREE.Points(starsGeometry, starsMaterial);
}

const stars = createStars();
scene.add(stars);

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// Animation
function animate() {
    requestAnimationFrame(animate);

    // Slow Earth rotation
    earth.rotation.y += 0.001;
    clouds.rotation.y += 0.0012;

    controls.update();
    renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Export for later use (character walking)
export { scene, earth, camera, renderer };
