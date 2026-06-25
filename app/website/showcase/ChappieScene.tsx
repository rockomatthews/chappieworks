"use client";

/* The real R3F scene — code-split, client-only via ChappieHero.tsx.

   Chappie is rendered at a FIXED identity transform (centered, grounded). A
   glTF SkinnedMesh cannot be translated/rotated at runtime without the skinning
   shader double-transforming the verts (they fly off-screen / shatter), so we
   never move him in 3D — the run-across is done by CSS-translating the canvas
   in ChappieHero. Here we only play/stop the run cycle and toggle visibility. */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  ContactShadows,
  Environment,
  Lightformer,
  Html,
  useProgress,
  AdaptiveDpr,
} from "@react-three/drei";
import * as THREE from "three";

export const RUN_MS = 2000; // must match the CSS slide in ChappieHero

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="mono whitespace-nowrap text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
        loading chappie · {Math.round(progress)}%
      </div>
    </Html>
  );
}

function ChappieRunner() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/chappie-run.glb");
  const { actions, names } = useAnimations(animations, group);
  const run = useRef({ active: false, t0: 0 });

  // Fit to ~2.6 units tall, feet at y=0 — applied to the scene node (uniform
  // scale + translation here is fine; it's runtime *movement* that breaks skin).
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.6 / (size.y || 1);
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x * s, -box.min.y * s, -center.z * s),
    };
  }, [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.frustumCulled = false;
      }
    });
    scene.scale.setScalar(scale);
    scene.position.copy(offset);
    scene.visible = false;
  }, [scene, scale, offset]);

  useEffect(() => {
    function onRun() {
      run.current = { active: true, t0: performance.now() };
      scene.visible = true;
      const clip = names[0];
      (clip ? actions[clip] : undefined)?.reset().play();
    }
    window.addEventListener("chappie-run", onRun);
    return () => window.removeEventListener("chappie-run", onRun);
  }, [actions, names, scene]);

  useFrame(() => {
    const r = run.current;
    if (!r.active) return;
    if (performance.now() - r.t0 >= RUN_MS) {
      r.active = false;
      scene.visible = false;
      const clip = names[0];
      (clip ? actions[clip] : undefined)?.stop();
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function ChappieScene() {
  const dpr = useMemo<[number, number]>(() => [1, 2], []);
  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [6.6, 1.4, 0.6], fov: 32 }}
      style={{ background: "transparent" }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.0, 0); // side-on, so we see his running profile
        gl.setClearColor(0x000000, 0);
      }}
    >
      <AdaptiveDpr pixelated />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.8} color="#8b4a2b" />

      <Suspense fallback={<Loader />}>
        <ChappieRunner />
        <Environment resolution={256}>
          <Lightformer
            intensity={2.6}
            position={[0, 4, 4]}
            scale={[8, 4, 1]}
            color="#faf7ee"
          />
          <Lightformer
            intensity={1.6}
            position={[-4, 1, 2]}
            scale={[4, 6, 1]}
            color="#c9a437"
          />
          <Lightformer
            intensity={1.2}
            position={[4, 2, -3]}
            scale={[4, 6, 1]}
            color="#8b4a2b"
          />
        </Environment>
      </Suspense>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={10}
        blur={2.6}
        far={4}
        color="#000000"
      />
    </Canvas>
  );
}

useGLTF.preload("/models/chappie-run.glb");
