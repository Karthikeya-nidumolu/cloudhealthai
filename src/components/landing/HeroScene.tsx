"use client";

import { Suspense, useRef, useLayoutEffect, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, SoftShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function useWindowScroll() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const progress = documentHeight > 0 ? window.scrollY / documentHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollProgress;
}

function SkeletonModel() {
  const gltf = useGLTF("/skeleton.glb");
  const modelRef = useRef<THREE.Group>(null);
  const scrollOffset = useWindowScroll();

  const originalPositions = useRef<Record<string, THREE.Vector3>>({});
  
  useLayoutEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x0f172a),
            emissive: new THREE.Color(0x00f5ff),
            emissiveIntensity: 0.1,
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1,
            transparent: true,
            opacity: 1,
          });

          originalPositions.current[child.name] = child.position.clone();
          
          const name = child.name.toLowerCase();
          
          if (name.includes("rib") || name.includes("chest") || name.includes("spine1") || name.includes("spine2")) {
            child.position.x += (Math.random() - 0.5) * 10;
            child.position.z += (Math.random() - 0.5) * 10;
          } else if (name.includes("arm") || name.includes("hand") || name.includes("radius") || name.includes("ulna") || name.includes("humerus")) {
            child.position.y += 5;
            child.position.x += child.position.x > 0 ? 5 : -5;
          } else if (name.includes("leg") || name.includes("femur") || name.includes("tibia") || name.includes("foot") || name.includes("pelvis")) {
            child.position.y -= 5;
            child.position.z += 5;
          } else {
            child.position.y += 2;
          }
        }
      });
    }
  }, [gltf]);

  useFrame((state) => {
    if (!modelRef.current || !gltf.scene) return;

    const offset = scrollOffset;

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const name = child.name.toLowerCase();
        const originalPos = originalPositions.current[child.name];
        if (!originalPos) return;

        let targetOpacity = 0;
        let progress = 0;

        if (name.includes("leg") || name.includes("femur") || name.includes("tibia") || name.includes("foot") || name.includes("pelvis")) {
          progress = THREE.MathUtils.mapLinear(offset, 0.6, 0.8, 0, 1);
        } else if (name.includes("arm") || name.includes("hand") || name.includes("radius") || name.includes("ulna") || name.includes("humerus")) {
          progress = THREE.MathUtils.mapLinear(offset, 0.4, 0.6, 0, 1);
        } else if (name.includes("rib") || name.includes("chest")) {
          progress = THREE.MathUtils.mapLinear(offset, 0.2, 0.4, 0, 1);
        } else {
          progress = THREE.MathUtils.mapLinear(offset, 0.0, 0.2, 0, 1);
        }

        progress = THREE.MathUtils.clamp(progress, 0, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        
        child.position.lerp(originalPos, ease * 0.1);

        targetOpacity = progress > 0 ? progress : 0;
        if (child.material) {
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, targetOpacity, 0.1);
          child.material.emissiveIntensity = THREE.MathUtils.lerp(0.1, 0.6, ease);
        }
      }
    });

    const targetX = state.pointer.x * 0.5;
    const targetY = state.pointer.y * 0.3;
    
    modelRef.current.position.x = THREE.MathUtils.lerp(modelRef.current.position.x, 2, 0.05);

    modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, targetX, 0.05);
    modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, -targetY, 0.05);
    modelRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={modelRef} position={[2, -2, 0]} scale={2.5}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function SkeletonFallback() {
  const modelRef = useRef<THREE.Group>(null);
  const scrollOffset = useWindowScroll();

  useFrame((state) => {
    if (!modelRef.current) return;
    const targetX = state.pointer.x * 0.5;
    const targetY = state.pointer.y * 0.3;
    
    // Smoothly transition and rotate based on scroll
    modelRef.current.rotation.y = THREE.MathUtils.lerp(
      modelRef.current.rotation.y, 
      targetX + scrollOffset * Math.PI * 2, 
      0.05
    );
    modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, -targetY, 0.05);
  });

  const material = (
    <meshStandardMaterial 
      color="#00f5ff" 
      emissive="#00f5ff" 
      emissiveIntensity={2} 
      wireframe 
      transparent 
      opacity={0.6}
    />
  );

  return (
    <group ref={modelRef} scale={1.8} position={[2, -1, 0]}>
      {/* Head */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        {material}
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.3, 0.25, 1.2, 8]} />
        {material}
      </mesh>

      {/* Arms */}
      <mesh position={[-0.5, 1.7, 0]} rotation={[0, 0, 0.3]}>
        <capsuleGeometry args={[0.05, 0.8, 4, 8]} />
        {material}
      </mesh>
      <mesh position={[0.5, 1.7, 0]} rotation={[0, 0, -0.3]}>
        <capsuleGeometry args={[0.05, 0.8, 4, 8]} />
        {material}
      </mesh>

      {/* Legs */}
      <mesh position={[-0.2, 0.4, 0]}>
        <capsuleGeometry args={[0.06, 1.2, 4, 8]} />
        {material}
      </mesh>
      <mesh position={[0.2, 0.4, 0]}>
        <capsuleGeometry args={[0.06, 1.2, 4, 8]} />
        {material}
      </mesh>

      {/* Floating Rings for 'High Tech' feel */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.01, 16, 100]} />
        {material}
      </mesh>
    </group>
  );
}

function SceneInner() {
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/skeleton.glb", { method: "HEAD" })
      .then((res) => setFileExists(res.ok))
      .catch(() => setFileExists(false));
  }, []);

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f5ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
      <Environment preset="city" />
      <Particles />

      {fileExists === null ? null : fileExists ? (
        <Suspense fallback={<SkeletonFallback />}>
          <SkeletonModel />
        </Suspense>
      ) : (
        <SkeletonFallback />
      )}
    </>
  );
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  const count = 500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00f5ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export default function HeroScene() {
  return (
    <div className="fixed inset-0 z-0 h-full w-full pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ pointerEvents: "auto" }}>
        <SoftShadows />
        <SceneInner />
      </Canvas>
    </div>
  );
}

