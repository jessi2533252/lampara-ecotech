import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// =====================================================
// ESCENA
// =====================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.025);

// =====================================================
// CÁMARA
// =====================================================
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(7.5, 5.0, 8.5);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
document.body.appendChild(renderer.domElement);

// =====================================================
// CONTROLES
// =====================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 4.5;
controls.maxDistance = 18;
controls.target.set(0, 1.5, 0);
controls.maxPolarAngle = Math.PI * 0.88;

const lampara = new THREE.Group();
scene.add(lampara);

let encendida = true;

// =====================================================
// LUCES
// =====================================================
const ambiente = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambiente);

const luzInterna = new THREE.PointLight(0x33ff77, 50, 20, 1.15);
luzInterna.position.set(0, 2.4, 0);
luzInterna.castShadow = true;
luzInterna.shadow.mapSize.set(1024, 1024);
lampara.add(luzInterna);

const luzRelleno = new THREE.PointLight(0xfff5e6, 3.0, 28);
luzRelleno.position.set(5, 7, 5);
scene.add(luzRelleno);

const dirLight = new THREE.DirectionalLight(0xfff8f0, 0.9);
dirLight.position.set(3, 9, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// =====================================================
// MATERIALES EXTRA
// =====================================================
const materialNegro = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.4,
    metalness: 0.3
});

const materialTornillo = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    roughness: 0.25,
    metalness: 0.95
});

// =====================================================
// TEXTURAS
// =====================================================
const textureLoader = new THREE.TextureLoader();

const urls = [
    "texturas/mb1.jpg",
    "texturas/mb2.jpg",
    "texturas/mb3.jpg",
    "texturas/mb4.jpg"
];

const urlsRespaldo = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Computer_Motherboard_Closeup.jpg/1280px-Computer_Motherboard_Closeup.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4e/Motherboard_%281%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Computer_Motherboard_Closeup.jpg/1280px-Computer_Motherboard_Closeup.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4e/Motherboard_%281%29.jpg"
];

function cargarTextura(urlLocal, urlRespaldo) {
    return new Promise((resolve) => {
        textureLoader.load(
            urlLocal,
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                resolve(tex);
            },
            undefined,
            () => {
                textureLoader.load(urlRespaldo, (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    resolve(tex);
                });
            }
        );
    });
}

function agregarEsquinas(grupo) {
    const offset = 2.28; // posición de las esquinas

    const posiciones = [
        { x: -offset, y:  offset }, // superior izquierda
        { x:  offset, y:  offset }, // superior derecha
        { x: -offset, y: -offset }, // inferior izquierda
        { x:  offset, y: -offset }  // inferior derecha
    ];

    posiciones.forEach(pos => {
        // Perfil / ángulo negro
        const perfil = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.18),
            materialNegro
        );
        perfil.position.set(pos.x, pos.y, 0.12);
        grupo.add(perfil);

        // Tornillo metálico
        const tornillo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12),
            materialTornillo
        );
        tornillo.rotation.x = Math.PI / 2;
        tornillo.position.set(pos.x, pos.y, 0.22);
        grupo.add(tornillo);

        // Cabeza del tornillo (más realista)
        const cabeza = new THREE.Mesh(
            new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12),
            materialTornillo
        );
        cabeza.rotation.x = Math.PI / 2;
        cabeza.position.set(pos.x, pos.y, 0.27);
        grupo.add(cabeza);
    });
}

function crearPlacaConTextura(textura) {
    const grupo = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
        map: textura,
        roughness: 0.38,
        metalness: 0.25,
        emissive: new THREE.Color(0x00ff55),
        emissiveIntensity: 0.95,
        emissiveMap: textura
    });

    const placa = new THREE.Mesh(
        new THREE.BoxGeometry(4.7, 5.5, 0.12),
        material
    );
    placa.castShadow = true;
    placa.receiveShadow = true;
    grupo.add(placa);

    // Borde oscuro
    const borde = new THREE.Mesh(
        new THREE.BoxGeometry(4.76, 5.56, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x062214, roughness: 0.7 })
    );
    borde.position.z = -0.02;
    grupo.add(borde);

    // Agregar perfiles negros + tornillos
    agregarEsquinas(grupo);

    return grupo;
}

// =====================================================
// CARGAR LAS 4 PLACAS
// =====================================================
async function crearLampara() {
    const texturas = await Promise.all([
        cargarTextura(urls[0], urlsRespaldo[0]),
        cargarTextura(urls[1], urlsRespaldo[1]),
        cargarTextura(urls[2], urlsRespaldo[2]),
        cargarTextura(urls[3], urlsRespaldo[3])
    ]);

    const frente = crearPlacaConTextura(texturas[0]);
    frente.position.set(0, 2.7, 2.15);
    lampara.add(frente);

    const atras = crearPlacaConTextura(texturas[1]);
    atras.position.set(0, 2.7, -2.15);
    atras.rotation.y = Math.PI;
    lampara.add(atras);

    const izquierda = crearPlacaConTextura(texturas[2]);
    izquierda.position.set(-2.15, 2.7, 0);
    izquierda.rotation.y = -Math.PI / 2;
    lampara.add(izquierda);

    const derecha = crearPlacaConTextura(texturas[3]);
    derecha.position.set(2.15, 2.7, 0);
    derecha.rotation.y = Math.PI / 2;
    lampara.add(derecha);

    window.placasMateriales = [
        frente.children[0].material,
        atras.children[0].material,
        izquierda.children[0].material,
        derecha.children[0].material
    ];
}

const materialMadera = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.75,
    metalness: 0.05
});

const poste = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 4.5, 1.3),
    materialMadera
);
poste.position.y = -0.05;
poste.castShadow = true;
poste.receiveShadow = true;
lampara.add(poste);

const base = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 0.75, 5.0),
    materialMadera
);
base.position.y = -2.35;
base.castShadow = true;
base.receiveShadow = true;
lampara.add(base);

// =====================================================
// LED CENTRAL
// =====================================================
const materialLED = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x22ff66,
    emissiveIntensity: 12,
    roughness: 0.1
});

const LED = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 32, 32),
    materialLED
);
LED.position.set(0, 2.55, 0);
lampara.add(LED);

// =====================================================
// INTERRUPTOR
// =====================================================
const interruptor = new THREE.Group();
interruptor.position.set(1.85, -2.1, 1.35);
lampara.add(interruptor);

const baseInt = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.22, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.35, metalness: 0.5 })
);
interruptor.add(baseInt);

const palanca = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.5, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.22, metalness: 0.85 })
);
palanca.position.y = 0.35;
palanca.rotation.x = -0.38;
palanca.castShadow = true;
interruptor.add(palanca);

// =====================================================
// CABLE + PISO
// =====================================================
const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 3.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })
);
cable.position.set(0, -4.4, 0);
lampara.add(cable);

const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.9 })
);
piso.rotation.x = -Math.PI / 2;
piso.position.y = -2.75;
piso.receiveShadow = true;
scene.add(piso);

// =====================================================
// INTERACCIÓN
// =====================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.intersectObjects(interruptor.children, true).length > 0) {
        cambiarLuz();
    }
});

function cambiarLuz() {
    encendida = !encendida;
    const texto = document.getElementById("textoEstado");

    if (encendida) {
        luzInterna.intensity = 50;
        luzRelleno.intensity = 3.0;
        ambiente.intensity = 0.45;
        materialLED.emissiveIntensity = 12;

        if (window.placasMateriales) {
            window.placasMateriales.forEach(m => {
                m.emissiveIntensity = 0.95;
            });
        }

        palanca.rotation.x = -0.38;
        texto.textContent = "LÁMPARA ENCENDIDA";
        texto.style.color = "#60ff83";
    } else {
        luzInterna.intensity = 0;
        luzRelleno.intensity = 0.3;
        ambiente.intensity = 0.12;
        materialLED.emissiveIntensity = 0;

        if (window.placasMateriales) {
            window.placasMateriales.forEach(m => {
                m.emissiveIntensity = 0.04;
            });
        }

        palanca.rotation.x = 0.38;
        texto.textContent = "LÁMPARA APAGADA";
        texto.style.color = "#777";
    }
}

// =====================================================
// INICIAR
// =====================================================
crearLampara().then(() => {
    console.log("Lámpara lista con perfiles y tornillos");
});

// =====================================================
// ANIMACIÓN
// =====================================================
function animar() {
    requestAnimationFrame(animar);
    controls.update();
    renderer.render(scene, camera);
}
animar();

// =====================================================
// RESPONSIVE
// =====================================================
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});