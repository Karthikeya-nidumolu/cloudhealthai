"use client";
import { useRef, useLayoutEffect, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

export default function BodyModel3D({ report }: { report: any }) {
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/skeleton.glb", { method: "HEAD" })
      .then((res) => setFileExists(res.ok))
      .catch(() => setFileExists(false));
  }, []);

  const highlights = {
    heart: false,
    bone: false,
    abdomen: false,
    lungs: false,
  };

  // Only scan the STRICT NAMES of abnormal lab parameters to prevent cross-contamination
  (report.parameters || []).forEach((p: any) => {
    if (p.status && p.status.toLowerCase() !== "normal") {
      const n = (p.name || "").toLowerCase();
      if (n.includes("cardiac") || n.includes("heart") || n.includes("bp") || n.includes("pressure") || n.includes("cholesterol") || n.includes("lipid")) highlights.heart = true;
      if (n.includes("bone") || n.includes("fracture") || n.includes("joint") || n.includes("calcium") || n.includes("vitamin")) highlights.bone = true;
      if (n.includes("glucose") || n.includes("diabetes") || n.includes("sugar") || n.includes("liver") || n.includes("kidney") || n.includes("renal") || n.includes("sgpt") || n.includes("sgot")) highlights.abdomen = true;
      if (n.includes("lung") || n.includes("respiratory") || n.includes("oxygen")) highlights.lungs = true;
    }
  });

  // If no specific organs flagged but risk is extreme, highlight the heart as an alert priority
  if (!highlights.heart && !highlights.bone && !highlights.abdomen && !highlights.lungs) {
    if (report.risk_level?.toLowerCase() === "high") highlights.heart = true;
  }

  return (
    <div className="relative w-full h-[500px] glassmorphism rounded-3xl overflow-hidden border border-card-border">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-accent border border-accent/20">
        Educational Visualization Only - Not a Medical Diagnosis
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <Environment preset="city" />
        <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 1.5} />
        
        {fileExists === null ? null : fileExists ? (
          <Suspense fallback={null}>
            <Model highlights={highlights} />
          </Suspense>
        ) : (
          <AbstractHuman highlights={highlights} />
        )}
      </Canvas>
    </div>
  );
}

function Model({ highlights }: { highlights: any }) {
  const gltf = useGLTF("/skeleton.glb");
  const materialRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useLayoutEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const name = child.name.toLowerCase();
          
          let materialColor = 0x0f172a;
          let emissiveColor = 0x00f5ff;
          let baseEmmissiveIntensity = 0.1;
          
          if (highlights.heart && (name.includes("rib") || name.includes("chest"))) {
            emissiveColor = 0xff0044;
            baseEmmissiveIntensity = 0.5;
          } else if (highlights.bone && (name.includes("arm") || name.includes("leg") || name.includes("femur"))) {
            emissiveColor = 0xffaa00;
            baseEmmissiveIntensity = 0.5;
          } else if (highlights.abdomen && (name.includes("spine") || name.includes("pelvis"))) {
            emissiveColor = 0xcc00ff;
            baseEmmissiveIntensity = 0.5;
          } else if (highlights.lungs && (name.includes("rib") || name.includes("chest") || name.includes("clavicle"))) {
            emissiveColor = 0x00ffcc;
            baseEmmissiveIntensity = 0.5;
          }

          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(materialColor),
            emissive: new THREE.Color(emissiveColor),
            emissiveIntensity: baseEmmissiveIntensity,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9,
          });
          
          child.material = mat;
          
          // Only animate the intensely highlighted ones
          if (baseEmmissiveIntensity > 0.1) {
            materialRefs.current.push(mat);
          }
        }
      });
    }
  }, [gltf, highlights]);

  useFrame(({ clock }) => {
    // Pulse animation
    const t = clock.getElapsedTime();
    materialRefs.current.forEach((mat) => {
      mat.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.3;
    });
  });

  return (
    <group position={[0, -2, 0]} scale={2}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function AbstractHuman({ highlights }: { highlights: any }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock, pointer }) => {
    if (groupRef.current) {
      groupRef.current.position.y = -0.5 + Math.sin(clock.elapsedTime) * 0.05;
      const targetRotationY = Math.sin(clock.elapsedTime * 0.5) * 0.2 + pointer.x * 0.5;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
    }
  });

  const getMat = (active: boolean, color: string) => (
    <meshStandardMaterial 
      color={active ? color : "#00f5ff"} 
      emissive={active ? color : "#00f5ff"} 
      emissiveIntensity={active ? 3 : 0.4}
      transparent 
      opacity={active ? 1 : 0.15} 
      wireframe={true}
      roughness={0.1}
      metalness={1}
    />
  );

  return (
    <group ref={groupRef} scale={1.2} position={[0, -0.2, 0]}>
      {/* Head */}
      <mesh position={[0, 2.3, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        {getMat(false, "")}
      </mesh>
      
      {/* Chest/Lungs/Heart */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.35, 0.3, 1.2, 16, 8]} />
        {getMat(highlights.lungs || highlights.heart, highlights.heart ? "#ff0044" : "#00f5ff")}
      </mesh>

      {/* Abdomen / Organs */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.8, 16, 8]} />
        {getMat(highlights.abdomen, "#cc00ff")}
      </mesh>

      {/* Arms */}
      <mesh position={[-0.6, 1.2, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.07, 1.1, 4, 8]} />
        {getMat(highlights.bone, "#ffaa00")}
      </mesh>
      <mesh position={[0.6, 1.2, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.07, 1.1, 4, 8]} />
        {getMat(highlights.bone, "#ffaa00")}
      </mesh>

      {/* Legs */}
      <mesh position={[-0.18, -0.8, 0]}>
        <capsuleGeometry args={[0.08, 1.4, 4, 8]} />
        {getMat(highlights.bone, "#ffaa00")}
      </mesh>
      <mesh position={[0.18, -0.8, 0]}>
        <capsuleGeometry args={[0.08, 1.4, 4, 8]} />
        {getMat(highlights.bone, "#ffaa00")}
      </mesh>

      {/* Aesthetic Ring */}
      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.01, 16, 100]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={1} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
