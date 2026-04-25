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

  // материалы + поиск деталей
  useMemo(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return

      child.castShadow = true
      child.receiveShadow = true

      if (child.name.toLowerCase().includes('1place')) {
        lidRef.current = child
        initialPos.lid = child.position.y
      }

      if (child.name.toLowerCase().includes('elips')) {
        elipsRef.current = child
        initialPos.elips = child.position.y
      }

      // металл
      if (
        child.material.metalness > 0.1 ||
        (child.material.name || '').toLowerCase().includes('metal')
      ) {
        child.material.metalness = 1
        child.material.roughness = 0.22
        child.material.envMapIntensity = 0.9
        child.material.color = new THREE.Color('#7a7a7a')
      }

      // стекло
      if (
        child.material.transparent ||
        (child.material.name || '').toLowerCase().includes('glass')
      ) {
        child.material.transmission = 1
        child.material.thickness = 1.2
        child.material.roughness = 0.15
        child.material.envMapIntensity = 1.2
      }
    })
  }, [scene, initialPos])

  useFrame((state) => {
    const t = scroll.offset // 0..1

    // --- анимация деталей (без дергания)
    if (lidRef.current) {
      lidRef.current.position.y = initialPos.lid + t * 0.08
    }

    if (elipsRef.current) {
      elipsRef.current.position.y = initialPos.elips - t * 0.02
    }

    // --- ИДЕАЛЬНАЯ ОРБИТА КАМЕРЫ (без “зум-эффекта”)
    const angle = t * Math.PI * 2
    const radius = 1.35

    // базовая окружность в XZ
    const base = new THREE.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    )

    // наклон всей орбиты (как один риг)
    const tilt = THREE.MathUtils.degToRad(12)
    const m = new THREE.Matrix4().makeRotationX(tilt)
    base.applyMatrix4(m)

    // лёгкий подъём кадра
    base.y += 0.15

    // стабильное движение (без jitter)
    state.camera.position.lerp(base, 0.1)

    // всегда смотрим в центр
    state.camera.lookAt(0, 0, 0)
  })

  return <primitive object={scene} />
}

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#050505',
        overflow: 'hidden',       // 🔥 ВАЖНО: блокируем скролл страницы
        touchAction: 'none'       // 🔥 ВАЖНО для iOS
      }}
    >
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

        {/* 🔥 СКРОЛЛ ТОЛЬКО ВНУТРИ КАНВАСА */}
        <ScrollControls pages={4} damping={0.1} htmlScroll={false}>
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

        {/* можно оставить выключенным, чтобы не мешал */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}