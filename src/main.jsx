import React, { Suspense, useRef, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Environment,
  Center,
  ContactShadows,
  ScrollControls,
  useScroll
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
        child.material.metalness = 1.0
        child.material.roughness = 0.18
        child.material.envMapIntensity = 0.7
        child.material.color = new THREE.Color('#8a8a8a')
      }

      // стекло
      if (
        child.material.transparent ||
        child.material.name.toLowerCase().includes('glass')
      ) {
        child.material.transmission = 1.0
        child.material.thickness = 1.2
        child.material.roughness = 0.15
        child.material.envMapIntensity = 1.2
      }
    })
  }, [scene, initialPos])

  useFrame((state, delta) => {
    const t = scroll.offset

    // ✨ лёгкие движения деталей (очень subtle)
    if (lidRef.current) {
      const lidScroll = scroll.range(0, 0.4)
      lidRef.current.position.y = THREE.MathUtils.damp(
        lidRef.current.position.y,
        initialPos.lid + lidScroll * 0.08,
        4,
        delta
      )
    }

    if (elipsRef.current) {
      const elipsScroll = scroll.range(0.3, 0.3)
      elipsRef.current.position.y = THREE.MathUtils.damp(
        elipsRef.current.position.y,
        initialPos.elips - elipsScroll * 0.02,
        4,
        delta
      )
    }

    // 🎥 ЭЛЕГАНТНАЯ ОРБИТА КАМЕРЫ

    const angle = t * Math.PI * 2
    const radius = 1.35

    // мягкий наклон (кинематографичный, не “ломаный”)
    const tilt = 0.22 // ≈ 12–13 градусов

    // базовая орбита
    let x = Math.cos(angle) * radius
    let z = Math.sin(angle) * radius

    // наклон орбиты (важный момент — без синусных “качелей”)
    const y = Math.sin(angle) * tilt * 0.6

    // лёгкий подъём камеры (luxury framing)
    const finalY = y + 0.15

    // плавное движение
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, x, 4, delta)
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, finalY, 4, delta)
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, z, 4, delta)

    // всегда центр кадра = продукт
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

        <ScrollControls pages={4} damping={0.18}>
          <Suspense fallback={null}>
            <Center top position={[0, -0.2, 0]}>
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
              opacity={0.55}
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