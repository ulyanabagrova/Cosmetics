import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  useGLTF,
  Environment,
  Center,
  ContactShadows,
  OrbitControls
} from '@react-three/drei'
import * as THREE from 'three'

function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight
      const t = height > 0 ? scrollTop / height : 0
      setProgress(t)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

function Model() {
  const { scene } = useGLTF('/cosmetic.glb')

  const t = useScrollProgress()

  const lidRef = useRef()
  const elipsRef = useRef()

  const [initialPos] = useState({ lid: 0, elips: 0 })

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

      if (
        child.material.metalness > 0.1 ||
        (child.material.name || '').toLowerCase().includes('metal')
      ) {
        child.material.metalness = 1
        child.material.roughness = 0.22
        child.material.color = new THREE.Color('#7a7a7a')
      }

      if (
        child.material.transparent ||
        (child.material.name || '').toLowerCase().includes('glass')
      ) {
        child.material.transmission = 1
        child.material.thickness = 1.2
        child.material.roughness = 0.15
      }
    })
  }, [scene, initialPos])

  useFrame((state) => {
    // 🎥 ЧИСТАЯ ОРБИТА (БЕЗ ЗУМА)

    const angle = t * Math.PI * 2
    const radius = 1.4

    // базовая позиция
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    // наклон орбиты через rotation matrix
    const tilt = THREE.MathUtils.degToRad(12)
    const y = Math.sin(angle) * Math.sin(tilt) * 0.4

    // ЖЁСТКО задаём позицию (без damp!)
    state.camera.position.set(x, y + 0.2, z)

    state.camera.lookAt(0, 0, 0)

    // 🎯 анимация деталей
    if (lidRef.current) {
      lidRef.current.position.y = initialPos.lid + t * 0.08
    }

    if (elipsRef.current) {
      elipsRef.current.position.y = initialPos.elips - t * 0.02
    }
  })

  return <primitive object={scene} />
}

function App() {
  return (
    <div style={{ height: '400vh', background: '#050505' }}>
      <Canvas
        style={{ position: 'fixed', top: 0 }}
        camera={{ position: [0, 0.2, 1.2], fov: 30 }}
      >
        <Suspense fallback={null}>
          <Center>
            <Model />
          </Center>

          <Environment preset="studio" />

          <ambientLight intensity={0.35} />

          <spotLight
            position={[5, 10, 5]}
            intensity={2}
            angle={0.25}
            penumbra={1}
          />

          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.6}
            scale={10}
            blur={2.5}
            far={1}
          />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
