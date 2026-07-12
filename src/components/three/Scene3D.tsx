/* eslint-disable react/no-unknown-property */
"use client";

import { Canvas } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, Sparkles, OrbitControls } from "@react-three/drei";

// A self-contained 3D hero: a glowing, gently distorting orb wrapped in a
// slowly rotating wireframe shell, surrounded by drifting sparkles. No network
// assets (no HDR environment), so it works offline and under a strict CSP.
export default function Scene3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={2.5} color="#a78bfa" />
      <pointLight position={[-5, -3, 2]} intensity={2} color="#22d3ee" />

      <Float speed={1.4} rotationIntensity={0.8} floatIntensity={1.2}>
        {/* Solid distorting core */}
        <Icosahedron args={[1.4, 6]}>
          <MeshDistortMaterial
            color="#7c3aed"
            distort={0.45}
            speed={2.2}
            roughness={0.15}
            metalness={0.9}
            emissive="#4c1d95"
            emissiveIntensity={0.35}
          />
        </Icosahedron>
        {/* Rotating wireframe shell */}
        <Icosahedron args={[2.1, 1]}>
          <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.18} />
        </Icosahedron>
      </Float>

      <Sparkles count={90} scale={8} size={2.4} speed={0.4} color="#c4b5fd" opacity={0.7} />

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
    </Canvas>
  );
}
