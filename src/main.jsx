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

/* ✅ универсальный scroll (работает на iPhone) */
function useScrollProgress() {
  const [t, setT] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight
      setT(height > 0 ? scrollTop / height : 0)
    }

    window.addEventListener('scroll', onScroll)
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return t
}

function Model() {
  const { scene } = useGLTF('/cosmetic.glb')

  const t = useScrollProgress()

  const lidRef = useRef()
  const elipsRef = useRef()

  const [initialPos] = useState({ lid: 0, elips: 0 })

  /* ✅ материалы + запоминаем позиции */
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
    /* 🎥 КАМЕРА — ЧИСТАЯ ОРБИТА (БЕЗ ЗУМА) */
    const angle = t * Math.PI * 2
    const radius = 1.35

    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    // НАКЛОН ОРБИТЫ (фиксированный)
    const tilt = THREE.MathUtils.degToRad(12)
    const y = Math.sin(angle) * Math.sin(tilt) * 0.4

    state.camera.position.set(x, y + 0.2, z)
    state.camera.lookAt(0, 0, 0)

    /* 🧴 ВОЗВРАЩАЕМ ТВОЮ АНИМАЦИЮ */

    if (lidRef.current) {
      // плавное открытие крышки
      const lidT = Math.min(t * 2.5, 1)
      lidRef.current.position.y = initialPos.lid + lidT * 0.1
    }

    if (elipsRef.current) {
      // помпа вниз после 30% скролла
      const pumpT = Math.max((t - 0.3) * 2, 0)
      elipsRef.current.position.y = initialPos.elips - pumpT * 0.022
    }
  })

  return <primitive object={scene} />
}

function App() {
  return (
    <div style={{ height: '400vh', background: '#050505' }}>
      <Canvas
        style={{ position: 'fixed', top: 0 }}
        camera={{ position: [0, 0.2, 1.2], fov: 25 }} // 👈 меньше FOV = меньше “зум-эффекта”
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
