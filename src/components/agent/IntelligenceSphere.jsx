import { useRef, useMemo, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Error boundary so a WebGL crash doesn't kill the whole page ─── */
class R3FErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return this.props.fallback ?? null;
    return this.props.children;
  }
}

/* ── Precomputed static positions (pure render without Math.random in body) ── */
const NEURAL_COUNT = 50;
const NEURAL_POSITIONS = (() => {
  const arr = new Float32Array(NEURAL_COUNT * 3);
  for (let i = 0; i < NEURAL_COUNT; i++) {
    const theta = (i / NEURAL_COUNT) * Math.PI * 2 + 0.15;
    const phi = Math.acos(2 * ((i + 0.5) / NEURAL_COUNT) - 1);
    const r = 0.5 + ((i * 17) % 28) * 0.01;
    arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
})();

const PARTICLE_COUNT = 220;
const PARTICLE_POSITIONS = (() => {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = (i / PARTICLE_COUNT) * Math.PI * 2;
    const phi = Math.acos(2 * ((i + 0.5) / PARTICLE_COUNT) - 1);
    const r = 0.75 + ((i * 31) % 45) * 0.01;
    arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
})();

/* ── Neural node points ─────────────────────────────────────────── */
function NeuralNodes() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.2; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={NEURAL_COUNT}
          array={NEURAL_POSITIONS}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#FF6A00" sizeAttenuation transparent opacity={0.95} />
    </points>
  );
}

/* ── Outer particle cloud ───────────────────────────────────────── */
function Particles() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y -= dt * 0.09; });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={PARTICLE_POSITIONS}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#FF8A3D" sizeAttenuation transparent opacity={0.65} />
    </points>
  );
}

/* ── Rotating torus rings ───────────────────────────────────────── */
function EnergyRings() {
  const r1 = useRef(), r2 = useRef(), r3 = useRef();

  useFrame((_, dt) => {
    if (r1.current) r1.current.rotation.z += dt * 0.55;
    if (r2.current) r2.current.rotation.x += dt * 0.35;
    if (r3.current) { r3.current.rotation.z -= dt * 0.42; r3.current.rotation.x += dt * 0.22; }
  });

  const emissiveMat = (
    <meshStandardMaterial
      color="#FF6A00"
      emissive="#FF4500"
      emissiveIntensity={2.5}
      transparent
      opacity={0.75}
    />
  );

  return (
    <>
      <mesh ref={r1}>
        <torusGeometry args={[0.72, 0.013, 8, 100]} />
        {emissiveMat}
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.82, 0.009, 8, 100]} />
        {emissiveMat}
      </mesh>
      <mesh ref={r3} rotation={[Math.PI / 6, Math.PI / 4, 0]}>
        <torusGeometry args={[0.61, 0.011, 8, 100]} />
        {emissiveMat}
      </mesh>
    </>
  );
}

/* ── Glass core sphere ──────────────────────────────────────────── */
function CoreSphere() {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current)
      ref.current.material.emissiveIntensity = 0.4 + Math.sin(s.clock.elapsedTime * 1.6) * 0.22;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.68, 64, 64]} />
      <meshPhysicalMaterial
        color="#FF8A3D"
        emissive="#FF4500"
        emissiveIntensity={0.4}
        transparent
        opacity={0.13}
        roughness={0}
        metalness={0}
        transmission={0.9}
        thickness={0.5}
      />
    </mesh>
  );
}

/* ── Inner glow sphere ──────────────────────────────────────────── */
function InnerGlow() {
  return (
    <mesh>
      <sphereGeometry args={[0.36, 32, 32]} />
      <meshStandardMaterial
        color="#FF6A00"
        emissive="#FF6A00"
        emissiveIntensity={3.5}
        transparent
        opacity={0.28}
      />
    </mesh>
  );
}

/* ── Scene wrapper with float animation ─────────────────────────── */
function Scene() {
  const g = useRef();
  useFrame((s) => {
    if (!g.current) return;
    g.current.rotation.y  = s.clock.elapsedTime * 0.13;
    g.current.position.y  = Math.sin(s.clock.elapsedTime * 0.65) * 0.06;
  });
  return (
    <group ref={g}>
      <ambientLight intensity={0.35} />
      <pointLight position={[2, 2, 2]}   intensity={2.2} color="#FF6A00" />
      <pointLight position={[-2,-1,-2]}  intensity={1.0} color="#FF8A3D" />
      <CoreSphere />
      <InnerGlow />
      <EnergyRings />
      <NeuralNodes />
      <Particles />
    </group>
  );
}

/* ── Public component ───────────────────────────────────────────── */
export default function IntelligenceSphere({ className = '' }) {
  return (
    <R3FErrorBoundary>
      <div className={className} style={{ width: '100%', height: '100%' }}>
        <Canvas
          camera={{ position: [0, 0, 2.2], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene />
        </Canvas>
      </div>
    </R3FErrorBoundary>
  );
}
