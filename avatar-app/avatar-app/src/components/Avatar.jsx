import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

export const audioLipSync = {
  analyser:   null,
  dataArray:  null,
  isSpeaking: false,
};

function getVolume() {
  const ls = audioLipSync;
  if (!ls.analyser || !ls.dataArray || !ls.isSpeaking) return 0;
  ls.analyser.getByteFrequencyData(ls.dataArray);
  let sum = 0;
  for (let i = 0; i < ls.dataArray.length; i++) sum += ls.dataArray[i];
  return Math.min(1.0, (sum / ls.dataArray.length) / 40.0);
}

const VISEME_SEQ = ["aa", "oh", "ou", "E", "ih", "aa", "oh"];

function Model() {
  const { scene }   = useGLTF("/model (1).glb");
  const meshRefs    = useRef([]);
  const bones       = useRef({});
  const baseRot     = useRef({});
  const armFixed    = useRef(false);   // ← becomes true after frame-1 fix
  const frameCount  = useRef(0);

  const jawSmooth   = useRef(0);
  const visemeIdx   = useRef(0);
  const visemeTimer = useRef(0);
  const blinkTimer  = useRef(2 + Math.random() * 3);
  const blinkVal    = useRef(0);
  const blinkPhase  = useRef("open");

  useEffect(() => {
    scene.traverse((o) => {
      if ((o.isMesh || o.isSkinnedMesh) && o.morphTargetDictionary) {
        meshRefs.current.push(o);
      }
    });

    const box    = new THREE.Box3().setFromObject(scene);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 2.0 / Math.max(size.x, size.y, size.z);
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    scene.rotation.set(0, Math.PI, 0);

    const boneMap = {
      head: "Head", neck: "Neck", spine: "Spine2",
      leftShoulder:  "LeftShoulder",  rightShoulder: "RightShoulder",
      leftArm:       "LeftArm",       rightArm:      "RightArm",
      leftForeArm:   "LeftForeArm",   rightForeArm:  "RightForeArm",
      leftHand:      "LeftHand",      rightHand:     "RightHand",
    };

    scene.traverse((o) => {
      for (const [key, name] of Object.entries(boneMap)) {
        if (o.name === name && !bones.current[key]) bones.current[key] = o;
      }
    });

    // Store base for head/neck/spine only
    const B  = bones.current;
    const BR = baseRot.current;
    for (const key of ["head", "neck", "spine"]) {
      if (B[key]) BR[key] = { x: B[key].rotation.x, y: B[key].rotation.y, z: B[key].rotation.z };
    }

  }, [scene]);

  function setMorph(name, value) {
    for (const mesh of meshRefs.current) {
      const idx = mesh.morphTargetDictionary?.[name];
      if (idx !== undefined && mesh.morphTargetInfluences)
        mesh.morphTargetInfluences[idx] = value;
    }
  }

  function lerpMorph(name, target, speed) {
    for (const mesh of meshRefs.current) {
      const idx = mesh.morphTargetDictionary?.[name];
      if (idx !== undefined && mesh.morphTargetInfluences)
        mesh.morphTargetInfluences[idx] += (target - mesh.morphTargetInfluences[idx]) * speed;
    }
  }

  useFrame(({ clock }, delta) => {
    const t  = clock.elapsedTime;
    const B  = bones.current;
    const BR = baseRot.current;

    // ── ONE-TIME ARM FIX on frame 5 (after scene fully loaded) ────────
    frameCount.current += 1;
    if (frameCount.current === 5 && !armFixed.current) {
      armFixed.current = true;

      if (B.leftArm) {
        B.leftArm.rotation.set(1.4, B.leftArm.rotation.y, 0);
        BR.leftArm = { x: 1.4, y: B.leftArm.rotation.y, z: 0 };
      }
      if (B.rightArm) {
        B.rightArm.rotation.set(1.4, B.rightArm.rotation.y, 0);
        BR.rightArm = { x: 1.4, y: B.rightArm.rotation.y, z: 0 };
      }

      // Store forearm/hand natural pose for freezing
      for (const key of ["leftForeArm","rightForeArm","leftHand","rightHand"]) {
        if (B[key]) BR[key] = { x: B[key].rotation.x, y: B[key].rotation.y, z: B[key].rotation.z };
      }
    }

    // ── Lip sync ──────────────────────────────────────────────────────
    let targetJaw = getVolume();
    if (audioLipSync.isSpeaking && targetJaw < 0.02) {
      targetJaw = Math.abs(Math.sin(t * 8.0)) * 0.25 + 0.05;
    }
    if (!audioLipSync.isSpeaking) targetJaw = 0;
    jawSmooth.current += (targetJaw - jawSmooth.current) * 0.25;
    const jaw     = Math.min(0.35, jawSmooth.current);
    const talking = jaw > 0.02;

    setMorph("jawOpen", jaw);
    if (talking) {
      visemeTimer.current -= delta;
      if (visemeTimer.current <= 0) {
        setMorph(VISEME_SEQ[visemeIdx.current], 0);
        visemeIdx.current = (visemeIdx.current + 1) % VISEME_SEQ.length;
        visemeTimer.current = 0.10 + Math.random() * 0.08;
      }
      lerpMorph(VISEME_SEQ[visemeIdx.current], jaw * 0.4, 0.3);
    } else {
      for (const v of VISEME_SEQ) lerpMorph(v, 0, 0.15);
    }

    // ── Blink ─────────────────────────────────────────────────────────
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0 && blinkPhase.current === "open") blinkPhase.current = "closing";
    if (blinkPhase.current === "closing") {
      blinkVal.current = Math.min(1, blinkVal.current + delta * 14);
      if (blinkVal.current >= 1) blinkPhase.current = "opening";
    } else if (blinkPhase.current === "opening") {
      blinkVal.current = Math.max(0, blinkVal.current - delta * 9);
      if (blinkVal.current <= 0) {
        blinkPhase.current = "open";
        blinkTimer.current = 2.5 + Math.random() * 3.5;
      }
    }
    setMorph("eyeBlinkLeft",  blinkVal.current);
    setMorph("eyeBlinkRight", blinkVal.current);
    lerpMorph("browInnerUp", talking ? 0.10 : 0, 0.05);

    // ── Head ──────────────────────────────────────────────────────────
    if (B.head && BR.head) {
      const nodIdle  = Math.sin(t * 0.6)  * 0.010;
      const nodTalk  = talking ? Math.sin(t * 4.0) * 0.018 : 0;
      const tiltIdle = Math.sin(t * 0.45) * 0.007;
      const tiltTalk = talking ? Math.sin(t * 3.0) * 0.010 : 0;
      B.head.rotation.x += (BR.head.x + nodIdle + nodTalk   - B.head.rotation.x) * 0.3;
      B.head.rotation.z += (BR.head.z + tiltIdle + tiltTalk - B.head.rotation.z) * 0.08;
      B.head.rotation.y += (BR.head.y + Math.sin(t * 0.3) * 0.008 - B.head.rotation.y) * 0.05;
    }

    // ── Neck ──────────────────────────────────────────────────────────
    if (B.neck && BR.neck) {
      B.neck.rotation.z += (BR.neck.z + Math.sin(t * 0.35) * 0.005 - B.neck.rotation.z) * 0.05;
    }

    // ── Spine breathing ───────────────────────────────────────────────
    if (B.spine && BR.spine) {
      B.spine.rotation.x += (BR.spine.x + Math.sin(t * 0.8) * 0.008 - B.spine.rotation.x) * 0.04;
    }

    // ── Arms sway (only after fix applied) ────────────────────────────
    if (armFixed.current) {
      if (B.leftArm && BR.leftArm) {
        const sway = Math.sin(t * 0.4) * 0.012;
        B.leftArm.rotation.x += (BR.leftArm.x + sway - B.leftArm.rotation.x) * 0.05;
        B.leftArm.rotation.y += (BR.leftArm.y        - B.leftArm.rotation.y) * 0.05;
        B.leftArm.rotation.z += (BR.leftArm.z        - B.leftArm.rotation.z) * 0.05;
      }
      if (B.rightArm && BR.rightArm) {
        const sway = Math.sin(t * 0.4 + 0.5) * 0.012;
        B.rightArm.rotation.x += (BR.rightArm.x + sway - B.rightArm.rotation.x) * 0.05;
        B.rightArm.rotation.y += (BR.rightArm.y        - B.rightArm.rotation.y) * 0.05;
        B.rightArm.rotation.z += (BR.rightArm.z        - B.rightArm.rotation.z) * 0.05;
      }

      // Forearms & hands frozen at natural pose
      for (const key of ["leftForeArm","rightForeArm","leftHand","rightHand"]) {
        if (B[key] && BR[key]) {
          B[key].rotation.x += (BR[key].x - B[key].rotation.x) * 0.15;
          B[key].rotation.y += (BR[key].y - B[key].rotation.y) * 0.15;
          B[key].rotation.z += (BR[key].z - B[key].rotation.z) * 0.15;
        }
      }
    }
  });

  return <primitive object={scene} />;
}

export default function Avatar() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 140px)", minHeight: 400 }}>
      <Canvas camera={{ position: [0, 1.65, 0.8], fov: 45 }} style={{ width: "100%", height: "100%" }} gl={{ antialias: true }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[1, 2, 2]}  intensity={1.2} />
        <directionalLight position={[-1, 1, -1]} intensity={0.4} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
        <OrbitControls enablePan={false} target={[0, 1.55, 0]} minDistance={0.5} maxDistance={5} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/model (1).glb");