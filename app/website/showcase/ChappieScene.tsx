"use client";

/* The real R3F scene — code-split and only ever loaded client-side via the
   dynamic() wrapper in ChappieHero.tsx, so the GLB never touches SSR or any
   other route. Lights are authored in-scene (Lightformers) so there is no
   external HDRI fetch.

   Interactions:
   • pointer head-track (eases toward the cursor, fades out as you scroll)
   • scroll-scrubbed camera orbit — driven by the #chappie-track scroll position
   • click anywhere → a procedural spin + hop (the rig ships only an idle clip,
     so the "wave" is synthesized rather than a baked animation). */

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

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const smooth = (x: number, a: number, b: number) =>
  THREE.MathUtils.smoothstep(x, a, b);

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="mono whitespace-nowrap text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
        rendering chappie · {Math.round(progress)}%
      </div>
    </Html>
  );
}

function Chappie({ impulse }: { impulse: React.RefObject<{ t: number }> }) {
  const group = useRef<THREE.Group>(null); // pointer track + recenter
  const spin = useRef<THREE.Group>(null); // click spin (independent of track)
  const floatRef = useRef<THREE.Group>(null); // idle bob + hop
  const progress = useRef(0);
  const { scene, animations } = useGLTF("/models/chappie.glb");
  const { actions, names } = useAnimations(animations, group);

  // Normalize unknown Sketchfab scale/origin: fit to ~2.6 units tall, feet at y=0.
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
    const clip = names[0];
    const action = clip ? actions[clip] : undefined;
    action?.reset().fadeIn(0.5).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, names, scene]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;

    // --- scroll progress of the tall hero track (0 → 1) ---
    let p = 0;
    const track =
      typeof document !== "undefined"
        ? document.getElementById("chappie-track")
        : null;
    if (track) {
      const r = track.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      p = total > 0 ? THREE.MathUtils.clamp(-r.top / total, 0, 1) : 0;
    }
    progress.current = THREE.MathUtils.damp(progress.current, p, 6, dt);
    const pr = progress.current;

    const wide = state.viewport.aspect > 1.1;
    const modelX = wide ? THREE.MathUtils.lerp(1.7, 0, smooth(pr, 0.08, 0.36)) : 0;
    g.position.x = THREE.MathUtils.damp(g.position.x, modelX, 4, dt);

    // pointer head-track, weakening as the orbit takes over
    const pw = 1 - smooth(pr, 0.06, 0.3);
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      state.pointer.x * 0.55 * pw,
      3,
      dt,
    );
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      -state.pointer.y * 0.18 * pw,
      3,
      dt,
    );

    // --- click reaction: one spin + hop over ~1.1s ---
    let hop = 0;
    let spinY = 0;
    const since = (performance.now() - impulse.current.t) / 1000;
    if (since >= 0 && since < 1.1) {
      const e = since / 1.1;
      spinY = Math.PI * 2 * easeOutCubic(e);
      hop = Math.sin(e * Math.PI) * 0.4;
    }
    if (spin.current) spin.current.rotation.y = spinY;
    if (floatRef.current) {
      floatRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.8) * 0.05 + hop;
    }

    // --- scroll-scrubbed camera orbit around the model ---
    const az = pr * Math.PI * 1.15;
    const radius = 6.2 - Math.sin(pr * Math.PI) * 1.3; // dolly in mid-scroll
    const camY = 1.3 + pr * 0.7;
    const par = 1 - smooth(pr, 0.08, 0.3); // pointer parallax, early only
    const px = state.pointer.x * 0.4 * par;
    const py = state.pointer.y * 0.25 * par;
    // Camera orbits the world origin while the model sits at modelX, so at the
    // top he reads on the right with the copy clear on the left; as he recenters
    // (modelX → 0) the camera ends up orbiting him directly.
    const cam = state.camera;
    cam.position.lerp(
      new THREE.Vector3(
        Math.sin(az) * radius + px,
        camY + py,
        Math.cos(az) * radius,
      ),
      0.08,
    );
    cam.lookAt(0, 1.2, 0);
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        <group ref={floatRef}>
          <group scale={scale} position={offset}>
            <primitive object={scene} />
          </group>
        </group>
      </group>
    </group>
  );
}

export default function ChappieScene() {
  const dpr = useMemo<[number, number]>(() => [1, 2], []);
  const impulse = useRef({ t: -999 });
  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.35, 6.2], fov: 32 }}
      style={{ background: "transparent" }}
      onPointerDown={() => {
        impulse.current.t = performance.now();
      }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
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
        <Chappie impulse={impulse} />
        {/* In-scene lighting rig — drives metallic reflections, no HDRI download */}
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
        opacity={0.55}
        scale={12}
        blur={2.6}
        far={4}
        color="#000000"
      />
    </Canvas>
  );
}

useGLTF.preload("/models/chappie.glb");
