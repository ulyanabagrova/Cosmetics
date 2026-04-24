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
  
  const modelRef = useRef()
  const lidRef = useRef()     
  const elipsRef = useRef() 

  // Храним начальные координаты здесь
  const [initialPos] = useState({ lid: 0, elips: 0 })

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        // Находим детали и запоминаем их положение из файла Blender
        if (child.name.toLowerCase().includes('1place')) {
          lidRef.current = child
          initialPos.lid = child.position.y // Запоминаем "родную" высоту крышки
        }
        if (child.name.toLowerCase().includes('elips')) {
          elipsRef.current = child
          initialPos.elips = child.position.y // Запоминаем "родную" высоту помпы
        }
        
        // Материалы (уже настроенный люкс)
        if (child.material.metalness > 0.1 || child.material.name.toLowerCase().includes('metal')) {
          child.material.metalness = 1.0
          child.material.roughness = 0.15 
          child.material.envMapIntensity = 0.5
          child.material.color = new THREE.Color('#8a8a8a')
        }
        
        if (child.material.transparent || child.material.name.toLowerCase().includes('glass')) {
          child.material.transmission = 1.0
          child.material.thickness = 1.0
          child.material.roughness = 0.2
          child.material.envMapIntensity = 1.0
        }
      }
    })
  }, [scene, initialPos])

  useFrame((state, delta) => {
    const offset = scroll.offset 

    // 1. Вращение
    modelRef.current.rotation.y = THREE.MathUtils.damp(modelRef.current.rotation.y, offset * Math.PI * 2, 4, delta)

    // 2. Крышка идет ВВЕРХ от своего ИЗНАЧАЛЬНОГО места
    if (lidRef.current) {
      const lidScroll = scroll.range(0, 0.4) 
      // Берем начальное положение + добавляем смещение от скролла
      const targetY = initialPos.lid + (lidScroll * 0.1) 
      lidRef.current.position.y = THREE.MathUtils.damp(lidRef.current.position.y, targetY, 4, delta)
    }

    // 3. Помпа идет ВНИЗ от своего ИЗНАЧАЛЬНОГО места
    if (elipsRef.current) {
      const elipsScroll = scroll.range(0.3, 0.3) 
      // Берем начальное положение - отнимаем смещение
      const targetYDown = initialPos.elips - (elipsScroll * 0.022)
      elipsRef.current.position.y = THREE.MathUtils.damp(elipsRef.current.position.y, targetYDown, 4, delta)
    }
  })
  
  return <primitive ref={modelRef} object={scene} />
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
          toneMappingExposure: 1.2 
        }}
      >
        <color attach="background" args={['#050505']} />

        <ScrollControls pages={4} damping={0.2}>
          <Suspense fallback={null}>
            <Center top position={[0, -0.2, 0]}> 
              <Model />
            </Center>

            <Environment preset="studio" />
            <ambientLight intensity={0.4} />
            <spotLight position={[5, 10, 5]} angle={0.2} penumbra={1} intensity={2} castShadow />
            <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={10} blur={2.5} far={1} />
          </Suspense>
        </ScrollControls>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />)
}