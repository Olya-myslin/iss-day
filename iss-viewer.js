import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const container = document.getElementById("iss-container");

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 22);

scene.add(new THREE.AmbientLight(0xffffff, 1));

let iss;

const loader = new GLTFLoader();
loader.load(
  "./models/iss.glb",
  (gltf) => {
    iss = gltf.scene;

    iss.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = new THREE.MeshBasicMaterial({
          color: 0xDCE2E5,  //цвет
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        });
      }
    });
    iss.rotation.x = 0.4;   // наклон вперёд/назад
iss.rotation.y = 0.2;   // поворот вокруг вертикальной оси
iss.rotation.z = 0.1;   // наклон вбок
    // Центрируем модель
    const box = new THREE.Box3().setFromObject(iss);
    const center = box.getCenter(new THREE.Vector3());
    iss.position.sub(center);

    scene.add(iss);
    console.log("✅ Модель загружена. Крутите мышкой!");
  },
  undefined,
  (err) => console.error("❌ Ошибка:", err)
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;       // плавность движения
controls.dampingFactor = 0.05;       // насколько плавно (меньше = дольше едет по инерции)
controls.enablePan = false;          // запрет таскать камеру
controls.enableZoom = true;          // можно зумить колёсиком (поставьте false, чтобы запретить)
controls.minDistance = 18;
controls.maxDistance = 50;

// Автоматическое медленное вращение
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;      // скорость авто-вращения (меньше = медленнее)

// Включаем клики на контейнер
container.style.pointerEvents = "auto";

// Логируем углы в консоль
let logTimeout;
controls.addEventListener('change', () => {
  clearTimeout(logTimeout);
  logTimeout = setTimeout(() => {
    if (iss) {
      console.log(`Расстояние камеры: ${camera.position.length().toFixed(2)}`);
    }
  }, 500);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});