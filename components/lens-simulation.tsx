"use client"

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html, Text, Environment } from "@react-three/drei"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"

interface LensSimulationProps {
  focalLength: number
  onDistanceChange: (distance: number) => void
  onComplete: () => void
}

// 太阳组件
function Sun() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <group position={[-8, 1, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      <pointLight color="#FFD700" intensity={50} distance={20} />
      {/* 光晕效果 */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#FFE066" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// 凸透镜组件
function ConvexLens() {
  // 使用 LatheGeometry 创建一个更像真实凸透镜的双凸形状
  const lensProfile = useMemo(() => {
    // 创建椭圆形截面：中心最厚，边缘逐渐变薄，形成椭圆轮廓
    const halfLength = 0.4
    const maxRadius = 1.1

    // 使用椭圆方程生成更平滑的曲线
    const points = []
    const numPoints = 20

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * Math.PI // 从 0 到 π
      const y = -halfLength + (2 * halfLength * i) / numPoints
      // 椭圆方程：x = a * sqrt(1 - (y/b)^2)，其中 a=1.1, b=0.9
      const normalizedY = y / halfLength
      const x = maxRadius * Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY))
      points.push(new THREE.Vector2(x, y))
    }

    return points
  }, [])

  return (
    <group position={[-3, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}> {/* 将透镜轴从 y 旋转到 x */}
        <latheGeometry args={[lensProfile, 64]} />
        <meshPhysicalMaterial
          color="#87CEEB"
          transparent
          opacity={0.65}
          roughness={0.1}
          metalness={0}
          transmission={0.85}
          thickness={0.2}
          ior={1.45}
          specularIntensity={0.4}
        />
      </mesh>

      {/* 标签 */}
      <Html position={[0, -1.8, 0]} center>
        <div className="text-xs text-primary font-medium whitespace-nowrap bg-white/80 px-2 py-0.5 rounded">
          凸透镜
        </div>
      </Html>
    </group>
  )
}

// 计算光线在光屏位置的Y坐标（用于光斑大小）
function calculateRayYAtPaper(rayOffset: number, focalLength: number, paperDistance: number): number {
  const scaleFactor = 0.03
  const lensX = -3
  const focalPoint = lensX + focalLength * scaleFactor
  const paperPos = lensX + paperDistance * scaleFactor

  // 透镜后的折射光线：从 (lensX, rayOffset) 出发并必然经过焦点 (focalPoint, 0)
  // 光线轨迹本身与光屏位置无关，只是在 x = paperPos 处被“截断”
  const distanceFromLensToFocus = focalPoint - lensX // 等于 focalLength * scaleFactor
  const t = (paperPos - lensX) / distanceFromLensToFocus

  return rayOffset * (1 - t)
}

// 光线组件
function LightRays({ focalLength, paperDistance }: { focalLength: number; paperDistance: number }) {
  const raysRef = useRef<THREE.Group>(null)
  const scaleFactor = 0.03
  const lensX = -3
  const focalPoint = lensX + focalLength * scaleFactor
  const paperPos = lensX + paperDistance * scaleFactor
  
  const rayOffsets = [-0.8, -0.4, 0, 0.4, 0.8]

  return (
    <group ref={raysRef}>
      {rayOffsets.map((offset, i) => {
        // 计算光线到达光屏时的Y坐标
        const rayYAtPaper = calculateRayYAtPaper(offset, focalLength, paperDistance)
        
        return (
          <group key={i}>
            {/* 入射光线 - 平行光 */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([-8, offset, 0, lensX, offset, 0])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#FFD700" linewidth={2} transparent opacity={0.8} />
            </line>
            
            {/* 光屏前的光线 */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([lensX, offset, 0, paperPos, rayYAtPaper, 0])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#FFD700" linewidth={2} transparent opacity={0.6} />
            </line>
          </group>
        )
      })}
      
      {/* 焦点标记 */}
      <mesh position={[focalPoint, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#E74C3C" />
      </mesh>
      <Html position={[focalPoint, 0.4, 0]} center>
        <div className="text-[10px] text-red-500 font-medium whitespace-nowrap">焦点 f</div>
      </Html>
    </group>
  )
}

// 纸片/光屏组件
function Paper({ 
  distance, 
  spotSize, 
  spotBrightness,
  focalLength
}: { 
  distance: number
  spotSize: number
  spotBrightness: number
  focalLength: number
}) {
  const scaleFactor = 0.03
  const paperPos = -3 + distance * scaleFactor
  const meshRef = useRef<THREE.Mesh>(null)
  
  // 计算光斑的实际3D半径，与光线位置完全匹配
  const maxRayOffset = 0.8 // 与光线组件中的最大偏移量一致
  const distanceFromLensToFocus = focalLength * scaleFactor
  
  let spotRadius3D: number
  if (distance <= focalLength) {
    // 光屏在焦点前
    const ratio = (distance * scaleFactor) / distanceFromLensToFocus
    spotRadius3D = maxRayOffset * Math.abs(1 - ratio)
  } else {
    // 光屏在焦点后
    const distancePastFocus = (distance - focalLength) * scaleFactor
    spotRadius3D = maxRayOffset * (distancePastFocus / distanceFromLensToFocus)
  }
  
  // 确保最小可见大小
  const minSpotRadius = 0.03
  const actualSpotRadius = Math.max(minSpotRadius, spotRadius3D)

  return (
    <group position={[paperPos, 0, 0]}>
      {/* 光屏主体 - 黑色背景让光斑更明显 */}
      <mesh ref={meshRef} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.5, 3]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
      
      {/* 光斑 - 使用实际计算的3D半径，与光线范围精确匹配，颜色均匀一致 */}
      <mesh position={[-0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[actualSpotRadius, 32]} />
        <meshBasicMaterial 
          color="#FFDD00"
          transparent={false}
        />
      </mesh>
      
      {/* 标签 */}
      <Html position={[0, -2, 0]} center>
        <div className="text-xs text-foreground font-medium whitespace-nowrap bg-white/90 px-2 py-0.5 rounded shadow">
          光屏
        </div>
      </Html>
    </group>
  )
}

// 距离标注
function DistanceMarker({ distance }: { distance: number }) {
  const scaleFactor = 0.03
  const paperPos = -3 + distance * scaleFactor
  
  return (
    <group position={[0, -2.2, 0]}>
      {/* 标注线 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-3, 0, 0, paperPos, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#333333" />
      </line>
      
      {/* 端点标记 */}
      <mesh position={[-3, 0, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      <mesh position={[paperPos, 0, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.05]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* 距离标签 */}
      <Html position={[(-3 + paperPos) / 2, 0.3, 0]} center>
        <div className="text-sm font-bold bg-white px-2 py-1 rounded shadow whitespace-nowrap">
          L = {Math.round(distance)}
        </div>
      </Html>
    </group>
  )
}

// 地面网格
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#f0f0f0" transparent opacity={0.5} />
    </mesh>
  )
}

// 相机控制提示
function CameraHint() {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [])
  
  if (!visible) return null
  
  return (
    <Html position={[0, 3, 0]} center>
      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap animate-pulse">
        拖动画面可旋转视角
      </div>
    </Html>
  )
}

// 3D场景
function Scene({ 
  focalLength, 
  paperDistance, 
  spotSize, 
  spotBrightness 
}: { 
  focalLength: number
  paperDistance: number
  spotSize: number
  spotBrightness: number
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      <Sun />
      <ConvexLens />
      {/* 使用 key 强制在纸片移动时重新创建光线几何，确保光线端点跟随光屏 */}
      <LightRays key={paperDistance} focalLength={focalLength} paperDistance={paperDistance} />
      <Paper distance={paperDistance} spotSize={spotSize} spotBrightness={spotBrightness} focalLength={focalLength} />
      <DistanceMarker distance={paperDistance} />
      <Ground />
      <CameraHint />
      
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        target={[-1, 0, 0]}
      />
    </>
  )
}

export function LensSimulation({ focalLength, onDistanceChange, onComplete }: LensSimulationProps) {
  const [paperDistance, setPaperDistance] = useState(150)
  const [hasFoundMinimum, setHasFoundMinimum] = useState(false)

  const minDistance = 50
  const maxDistance = 250

  // 计算光斑大小 - 基于光线实际在光屏上的范围
  // 与 LightRays 组件使用相同的几何计算逻辑
  const getSpotSize = useCallback((distance: number) => {
    const maxRayOffset = 0.8 // 与光线组件中的最大偏移量一致
    const scaleFactor = 0.03
    const distanceFromLensToFocus = focalLength * scaleFactor
    
    let spotRadius: number
    
    if (distance <= focalLength) {
      // 光屏在焦点前：光线还没汇聚到焦点
      const ratio = (distance * scaleFactor) / distanceFromLensToFocus
      spotRadius = maxRayOffset * (1 - ratio)
    } else {
      // 光屏在焦点后：光线已过焦点开始发散
      const distancePastFocus = (distance - focalLength) * scaleFactor
      spotRadius = maxRayOffset * (distancePastFocus / distanceFromLensToFocus)
    }
    
    // 将3D空间中的光斑半径转换为显示大小
    // 乘以一个系数使光斑在视觉上更明显，同时保持物理正确性
    const minSize = 2 // 焦点处的最小光斑
    const displaySize = minSize + spotRadius * 50
    
    return Math.max(minSize, displaySize)
  }, [focalLength])

  // 计算光斑亮度 - 光斑越小越亮（能量守恒原理）
  const getSpotBrightness = useCallback((size: number) => {
    const maxBrightness = 1
    const minBrightness = 0.2
    // 使用反比关系模拟能量密度
    return Math.max(minBrightness, Math.min(maxBrightness, 1 / (size / 5)))
  }, [])

  const spotSize = getSpotSize(paperDistance)
  const spotBrightness = getSpotBrightness(spotSize)

  // 检测是否找到最小光斑（在焦点附近）
  useEffect(() => {
    if (spotSize < 5 && !hasFoundMinimum) {
      setHasFoundMinimum(true)
    }
  }, [spotSize, hasFoundMinimum])

  const handleDistanceChange = (value: number) => {
    setPaperDistance(value)
    onDistanceChange(value)
  }

  return (
    <div className="relative w-full">
      {/* 3D 视图 */}
      <div className="w-full aspect-[16/10] bg-gradient-to-b from-sky-100 to-sky-50 rounded-2xl overflow-hidden border-2 border-border shadow-lg">
        <Canvas
          camera={{ position: [0, 2, 8], fov: 50 }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <Scene 
              focalLength={focalLength}
              paperDistance={paperDistance}
              spotSize={spotSize}
              spotBrightness={spotBrightness}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* 控制面板 */}
      <div className="mt-4 bg-card rounded-xl p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span>近 (50)</span>
          <span className="font-medium">调整纸片与透镜的距离</span>
          <span>远 (250)</span>
        </div>
        <input
          type="range"
          min={minDistance}
          max={maxDistance}
          value={paperDistance}
          onChange={(e) => handleDistanceChange(Number(e.target.value))}
          className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((paperDistance - minDistance) / (maxDistance - minDistance)) * 100}%, hsl(var(--muted)) ${((paperDistance - minDistance) / (maxDistance - minDistance)) * 100}%, hsl(var(--muted)) 100%)`
          }}
        />
      </div>

      {/* 信息面板 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm text-center">
          <div className="text-xs text-muted-foreground mb-1">测量距离 L</div>
          <div className="text-xl font-bold text-foreground">{Math.round(paperDistance)}</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm text-center">
          <div className="text-xs text-muted-foreground mb-1">光斑大小</div>
          <div className="text-xl font-bold text-foreground">{spotSize.toFixed(1)}</div>
          <div className="text-[10px] text-muted-foreground">
            {spotSize < 5 ? "最小" : spotSize < 15 ? "中等" : "较大"}
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm text-center">
          <div className="text-xs text-muted-foreground mb-1">���际焦距 f</div>
          <div className="text-xl font-bold text-primary">{focalLength}</div>
        </div>
      </div>

      {/* 光斑状态提示 */}
      <div className="mt-4 text-center">
        <AnimatePresence mode="wait">
          {spotSize < 5 ? (
            <motion.div
              key="minimum"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              找到最小光斑！此时 L 等于焦距 f
            </motion.div>
          ) : spotSize < 15 ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium"
            >
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              接近焦点位置，继续微调
            </motion.div>
          ) : (
            <motion.div
              key="far"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm font-medium"
            >
              <span className="w-2 h-2 bg-muted-foreground rounded-full" />
              光斑较大，调整距离寻找最小光斑
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 找到最小光斑的成功提示 */}
      <AnimatePresence>
        {hasFoundMinimum && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center"
          >
            <div className="text-green-800 font-medium">太棒了！你找到了最小光斑位置</div>
            <div className="text-green-600 text-sm mt-1">
              旋转视角查看纸片正面的光斑效果
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
