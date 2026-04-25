import React, { Suspense, useRef, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  Environment,
  Center,
  ContactShadows,
  ScrollControls,
  useScroll,
  OrbitControls
} from '@react-three/drei'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/cosmetic.glb')
  const scroll = useScroll()

  const lidRef = useRef()
  const elipsRef = useRef()

  const [initialPos] = useState({ lid: 0, elips: 0 })

  useMemo(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return

      child.castShadow = true
      child.receiveShadow = true

      // крышка
      if (child.name.toLowerCase().includes('1place')) {
        lidRef.current = child
        initialPos.lid = child.position.y
      }

      // помпа
      if (child.name.toLowerCase().includes('elips')) {
        elipsRef.current = child
        initialPos.elips = child.position.y
      }

      // металл
      if (
        child.material.metalness > 0.1 ||
        child.material.name.toLowerCase().includes('metal')
      ) {
        child.material.metalness = 1
        child.material.roughness = 0.2
        child.material.envMapIntensity = 0.8
        child.material.color = new THREE.Color('#7a7a7a')
      }

      // стекло
      if (
        child.material.transparent ||
        child.material.name.toLowerCase().includes('glass')
      ) {
        child.material.transmission = 1
        child.material.thickness = 1.2
        child.material.roughness = 0.15
        child.material.envMapIntensity = 1.2
      }
    })
  }, [scene, initialPos])

  useFrame((state) => {
    const t = scroll.offset

    // 🧴 лёгкие анимации деталей (без дрожания)
    if (lidRef.current) {
      lidRef.current.position.y = initialPos.lid + t * 0.08
    }

    if (elipsRef.current) {
      elipsRef.current.position.y = initialPos.elips - t * 0.02
    }

    // 🎥 C I N E M A T I C   R I G   O R B I T

    const angle = t * Math.PI * 2
    const radius = 1.35

    // наклон орбиты (фиксированный, не синусный)
    const tilt = 12 * (Math.PI / 180)

    // базовая позиция
    let x = Math.cos(angle) * radius
    let z = Math.sin(angle) * radius
    let y = 0

    // наклон всей орбиты (правильный cinematic метод)
    const cos = Math.cos(tilt)
    const sin = Math.sin(tilt)

    const y2 = y * cos - z * sin
    const z2 = y * sin + z * cos

    const finalPos = new THREE.Vector3(
      x,
      y2 + 0.15, // лёгкий подъём камеры
      z2
    )

    // 💡 ВАЖНО: lerp вместо damp → убирает mobile jitter
    state.camera.position.lerp(finalPos, 0.08)

    // всегда центр
    state.camera.lookAt(0, 0, 0)
  })

  return <primitive object={scene} />
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0.2, 1.2], fov: 30 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15
        }}
      >
        <color attach="background" args={['#050505']} />

        <ScrollControls pages={4} damping={0.12}>
          <Suspense fallback={null}>
            <Center>
              <Model />
            </Center>

            <Environment preset="studio" />

            <ambientLight intensity={0.35} />

            <spotLight
              position={[5, 10, 5]}
              angle={0.25}
              penumbra={1}
              intensity={2}
              castShadow
            />

            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.6}
              scale={10}
              blur={2.5}
              far={1}
            />
          </Suspense>
        </ScrollControls>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />)
}