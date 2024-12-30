import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Scene() {
    let mixer,
        scene,
        camera,
        renderer,
        light,
        directionalLight,
        controls,
        loader,
        clock;

    const createScene = () => {
        // Create the Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020);
    };

    const createCamera = () => {
        // Camera
        camera = new THREE.PerspectiveCamera(
            75,
            innerWidth / innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 2, 5);
    };

    const createLights = () => {
        // Lights
        light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);
        directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
    };

    const addControls = () => {
        // Orbit Controls
        controls = new OrbitControls(camera, renderer.domElement);
    };

    const loadModel = () => {
        // Load the GLTF Model
        loader = new GLTFLoader();

        loader.load(
            "/assets/House_001_GLB.glb",
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);

                // Animation
                mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play(); // Play all animations in the model
                });
            },
            undefined,
            (error) => {
                console.error("Error loading the model:", error);
            }
        );
    };

    const addAnimation = () => {
        // Animation Loop
        clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            if (mixer) {
                mixer.update(delta);
            }

            controls.update();
            renderer.render(scene, camera);
        };

        animate();
    };

    const addWindowResizeListener = () => {
        // Handle Window Resize
        addEventListener("resize", () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });
    };

    const render = () => {
        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(innerWidth, innerHeight);
        const container = document.querySelector(`.scene`) || document.body;
        container.appendChild(renderer.domElement);
    };

    useEffect(() => {
        createScene();
        createCamera();
        render();
        createLights();
        addControls();
        loadModel();
        addAnimation();
        addWindowResizeListener();
    }, []);

    return (
        <>
            <div className="scene"/>
        </>
    );
}
