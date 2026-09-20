import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type ComponentType = '地面' | '墙体' | '门窗' | '楼梯' | '阳台' | '屋顶'
type MaterialPreset = '混凝土' | '玻璃' | '铝合金' | '木纹' | '钢结构'

type BuildingItem = {
  id: number
  type: ComponentType
  name: string
  floor: number
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
  color: string
  material: MaterialPreset
  visible: boolean
}

const palette: Array<{ type: ComponentType; icon: string; hint: string }> = [
  { type: '墙体', icon: '▥', hint: '外墙 / 内墙' },
  { type: '门窗', icon: '▣', hint: '门窗洞口' },
  { type: '楼梯', icon: '⌁', hint: '楼梯间' },
  { type: '阳台', icon: '▱', hint: '悬挑阳台' },
  { type: '屋顶', icon: '⌂', hint: '屋顶构件' },
  { type: '地面', icon: '◫', hint: '底板 / 面层' },
]

const starterItems: BuildingItem[] = [
  { id: 1, type: '地面', name: '一层底板', floor: 1, x: 0, y: 0, z: 0, width: 12, height: .18, depth: 8, color: '#dfeaf6', material: '混凝土', visible: true },
  { id: 2, type: '墙体', name: '北立面外墙', floor: 1, x: 0, y: 2.8, z: -3.8, width: 12, height: 5.6, depth: .22, color: '#f9fbff', material: '混凝土', visible: true },
  { id: 3, type: '墙体', name: '南立面外墙', floor: 1, x: 0, y: 2.8, z: 3.8, width: 12, height: 5.6, depth: .22, color: '#f9fbff', material: '混凝土', visible: true },
  { id: 4, type: '墙体', name: '东立面外墙', floor: 1, x: 5.9, y: 2.8, z: 0, width: .22, height: 5.6, depth: 7.6, color: '#f9fbff', material: '混凝土', visible: true },
  { id: 5, type: '墙体', name: '西立面外墙', floor: 1, x: -5.9, y: 2.8, z: 0, width: .22, height: 5.6, depth: 7.6, color: '#f9fbff', material: '混凝土', visible: true },
  { id: 6, type: '门窗', name: '落地窗-01', floor: 1, x: 2.2, y: 1.8, z: -3.64, width: 2.4, height: 2.8, depth: .12, color: '#94d9f2', material: '玻璃', visible: true },
  { id: 7, type: '门窗', name: '入户门', floor: 1, x: -1.8, y: 1.3, z: 3.62, width: 1.5, height: 2.6, depth: .12, color: '#b68d63', material: '木纹', visible: true },
  { id: 8, type: '阳台', name: '客厅阳台', floor: 1, x: 1.8, y: 1.2, z: 4.35, width: 4.8, height: .24, depth: 1.6, color: '#cfe8f7', material: '铝合金', visible: true },
  { id: 9, type: '屋顶', name: '平屋顶', floor: 1, x: 0, y: 5.6, z: 0, width: 12.2, height: .28, depth: 7.8, color: '#dfe6f2', material: '钢结构', visible: true },
  { id: 10, type: '楼梯', name: '旋转楼梯', floor: 1, x: -3.5, y: 0.9, z: -1.6, width: 2.2, height: 2.8, depth: 1.2, color: '#cad4e0', material: '钢结构', visible: true },
  { id: 11, type: '墙体', name: '内隔墙-01', floor: 1, x: 0, y: 2.8, z: 1.2, width: 4.8, height: 5.6, depth: .14, color: '#f6f9fd', material: '混凝土', visible: true },
  { id: 12, type: '地面', name: '二层结构板', floor: 2, x: 0, y: 5.8, z: 0, width: 12, height: .2, depth: 8, color: '#dfeaf6', material: '混凝土', visible: true },
  { id: 13, type: '墙体', name: '二层南墙', floor: 2, x: 0, y: 8.4, z: 3.8, width: 12, height: 5.6, depth: .18, color: '#f9fbff', material: '混凝土', visible: true },
  { id: 14, type: '门窗', name: '二层窗-101', floor: 2, x: 3.4, y: 8.1, z: -3.5, width: 2.2, height: 2.6, depth: .12, color: '#9ae0fb', material: '玻璃', visible: true },
  { id: 15, type: '屋顶', name: '二层屋面', floor: 2, x: 0, y: 11.2, z: 0, width: 12.2, height: .3, depth: 7.8, color: '#e0e6f5', material: '钢结构', visible: true },
]

function Scene({
  items,
  selectedId,
  onSelect,
}: {
  items: BuildingItem[]
  selectedId: number
  onSelect: (id: number) => void
}) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#edf5ff')

    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 200)
    camera.position.set(16, 14, 18)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.replaceChildren(renderer.domElement)

    scene.add(new THREE.HemisphereLight('#ffffff', '#b7c9dc', 1.8))

    const sun = new THREE.DirectionalLight('#fff7e5', 2.3)
    sun.position.set(16, 18, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    scene.add(sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: '#edf3fa', roughness: 1, metalness: 0 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.15
    ground.receiveShadow = true
    scene.add(ground)

    const grid = new THREE.GridHelper(26, 26, '#bfd1e9', '#dfeaf7')
    grid.position.y = -0.06
    scene.add(grid)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 3, 0)
    controls.enablePan = true
    controls.minDistance = 8
    controls.maxDistance = 38
    controls.maxPolarAngle = Math.PI / 2.1

    const meshes: THREE.Mesh[] = []
    let activeMesh: THREE.Mesh | null = null

    const addMesh = (item: BuildingItem, geometry: THREE.BufferGeometry, baseColor: string) => {
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        transparent: item.type === '门窗',
        opacity: item.type === '门窗' ? 0.8 : 1,
        roughness: item.type === '门窗' ? 0.1 : 0.55,
        metalness: item.type === '门窗' ? 0.2 : 0.05,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(item.x, item.y, item.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { itemId: item.id }
      scene.add(mesh)
      meshes.push(mesh)
      if (item.id === selectedId) activeMesh = mesh
    }

    items.forEach((item) => {
      if (!item.visible) return

      if (item.type === '楼梯') {
        const steps = 7
        for (let i = 0; i < steps; i += 1) {
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.12, 0.52),
            new THREE.MeshStandardMaterial({ color: '#d9e4f5', roughness: 0.75 }),
          )
          step.position.set(item.x - 0.1, item.y + i * 0.12, item.z + i * 0.38)
          step.castShadow = true
          step.receiveShadow = true
          step.userData = { itemId: item.id }
          scene.add(step)
          meshes.push(step)
          if (item.id === selectedId) activeMesh = step
        }
        return
      }

      if (item.type === '门窗') {
        addMesh(item, new THREE.BoxGeometry(item.width, item.height, item.depth), item.color)
        return
      }

      addMesh(item, new THREE.BoxGeometry(item.width, item.height, item.depth), item.color)
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(meshes, false)[0]
      if (hit?.object.userData.itemId) {
        onSelect(Number(hit.object.userData.itemId))
      }
    }

    renderer.domElement.addEventListener('click', handleClick)

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      if (activeMesh) {
        meshes.forEach((mesh) => {
          const material = mesh.material as THREE.MeshStandardMaterial
          if (mesh.userData.itemId === selectedId) {
            material.emissive = new THREE.Color('#dfeaff')
            material.emissiveIntensity = 0.35
          } else {
            material.emissive = new THREE.Color('#000000')
            material.emissiveIntensity = 0
          }
        })
      }
      renderer.render(scene, camera)
    }

    animate()

    const resize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      renderer.domElement.removeEventListener('click', handleClick)
      controls.dispose()
      renderer.dispose()
    }
  }, [items, onSelect, selectedId])

  return <div className="scene-root" ref={mountRef} />
}

function App() {
  const [items, setItems] = useState<BuildingItem[]>(starterItems)
  const [selectedId, setSelectedId] = useState(2)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [activeTab, setActiveTab] = useState('建筑')
  const [isSaved, setIsSaved] = useState(false)

  const floorOptions = useMemo(() => [1, 2, 3], [])

  const visibleItems = useMemo(
    () => items.filter((item) => item.floor === currentFloor || item.type === '地面'),
    [currentFloor, items],
  )

  const selected = items.find((item) => item.id === selectedId) ?? items[0]

  const updateSelected = <K extends keyof BuildingItem>(key: K, value: BuildingItem[K]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === selectedId ? ({ ...item, [key]: value } as BuildingItem) : item)),
    )
  }

  const addItem = (type: ComponentType) => {
    const nextId = Date.now()
    const base: Partial<BuildingItem> = {
      type,
      floor: currentFloor,
      name: `${type}-${String(items.length).padStart(2, '0')}`,
      x: 0,
      y: type === '屋顶' ? 5.5 : type === '门窗' ? 1.8 : 2.2,
      z: 0,
      width: type === '门窗' ? 2.1 : type === '阳台' ? 4.2 : 3.2,
      height: type === '门窗' ? 2.6 : type === '阳台' ? 0.25 : 5.2,
      depth: type === '阳台' ? 1.4 : type === '门窗' ? 0.12 : 0.2,
      color: type === '门窗' ? '#90dff8' : '#f9fbff',
      material: type === '门窗' ? '玻璃' : type === '阳台' ? '铝合金' : '混凝土',
      visible: true,
    }

    const newItem: BuildingItem = {
      id: nextId,
      type,
      name: base.name ?? `${type}-01`,
      floor: base.floor ?? currentFloor,
      x: base.x ?? 0,
      y: base.y ?? 2,
      z: base.z ?? 0,
      width: base.width ?? 2,
      height: base.height ?? 2,
      depth: base.depth ?? 0.2,
      color: base.color ?? '#f9fbff',
      material: base.material ?? '混凝土',
      visible: base.visible ?? true,
    }

    setItems((prev) => [...prev, newItem])
    setSelectedId(nextId)
  }

  return (
    <div className="bim-shell">
      <aside className="sidebar left-sidebar">
        <div className="brand-box">
          <div className="brand-mark">B</div>
          <div>
            <strong>BuildCraft</strong>
            <small>建筑参数化编辑器</small>
          </div>
        </div>

        <div className="nav-group">
          {['建筑', '结构', '机电', '场地'].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="panel-section">
          <div className="panel-title-row">
            <span>构件库</span>
            <button className="mini-button">＋</button>
          </div>
          <div className="palette-grid">
            {palette.map((entry) => (
              <button
                key={entry.type}
                className="palette-card"
                onClick={() => addItem(entry.type)}
                title={entry.hint}
              >
                <span>{entry.icon}</span>
                <strong>{entry.type}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section tree-panel">
          <div className="panel-title-row">
            <span>模型树</span>
            <button className="mini-button">⌄</button>
          </div>
          <div className="tree-list">
            {items.map((item) => (
              <button
                key={item.id}
                className={selectedId === item.id ? 'tree-item selected' : 'tree-item'}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="tree-icon">{item.type === '墙体' ? '▥' : item.type === '门窗' ? '▣' : item.type === '楼梯' ? '⌁' : item.type === '阳台' ? '▱' : item.type === '屋顶' ? '⌂' : '◫'}</span>
                <span>{item.name}</span>
                <small>{item.floor}F</small>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="viewer-panel">
        <header className="viewer-header">
          <div className="project-header-left">
            <div className="project-pill">住宅项目</div>
            <div>
              <h1>现代三层住宅方案</h1>
              <p>建筑 / 结构 / 机电协同版</p>
            </div>
          </div>

          <div className="viewer-actions">
            <button className="soft-btn">←</button>
            <button className="soft-btn">→</button>
            <div className="divider" />
            <button className="primary-btn" onClick={() => { setIsSaved(true); setTimeout(() => setIsSaved(false), 1200) }}>
              {isSaved ? '已保存 ✓' : '保存方案'}
            </button>
            <button className="ghost-btn">导出模型</button>
          </div>
        </header>

        <div className="floor-bar">
          {floorOptions.map((floor) => (
            <button
              key={floor}
              className={currentFloor === floor ? 'floor-btn active' : 'floor-btn'}
              onClick={() => setCurrentFloor(floor)}
            >
              {floor}F
            </button>
          ))}
          <button className="floor-btn accent">+ 新楼层</button>
        </div>

        <div className="canvas-wrap">
          <div className="toolbar-overlay">
            <div className="tool-group">
              <button className="tool-btn active">选择</button>
              <button className="tool-btn">平移</button>
              <button className="tool-btn">旋转</button>
            </div>
            <div className="view-group">
              <button className="tool-btn">透视</button>
              <button className="tool-btn active">轴测</button>
            </div>
          </div>
          <Scene items={visibleItems} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="status-row">
          <div className="status-item">
            <span className="online-dot" />
            实时协同
          </div>
          <div className="status-item">单位：米</div>
          <div className="status-item">高度：3.2m</div>
          <div className="status-item">构件总数：{items.length}</div>
        </div>
      </main>

      <aside className="sidebar right-sidebar">
        <div className="panel-title-row big-row">
          <span>属性</span>
          <button className="mini-button">✕</button>
        </div>

        <div className="property-card">
          <div className="property-header">
            <h2>{selected.name}</h2>
            <span>{selected.type}</span>
          </div>

          <label>
            构件名称
            <input value={selected.name} onChange={(event) => updateSelected('name', event.target.value)} />
          </label>

          <div className="two-column">
            <label>
              楼层
              <select value={selected.floor} onChange={(event) => updateSelected('floor', Number(event.target.value))}>
                {floorOptions.map((floor) => (
                  <option key={floor} value={floor}>{floor}F</option>
                ))}
              </select>
            </label>
            <label>
              材质
              <select value={selected.material} onChange={(event) => updateSelected('material', event.target.value as MaterialPreset)}>
                {['混凝土', '玻璃', '铝合金', '木纹', '钢结构'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="two-column">
            <label>
              宽度 W
              <input type="number" value={selected.width} onChange={(event) => updateSelected('width', Number(event.target.value))} />
            </label>
            <label>
              高度 H
              <input type="number" value={selected.height} onChange={(event) => updateSelected('height', Number(event.target.value))} />
            </label>
          </div>

          <div className="two-column">
            <label>
              深度 D
              <input type="number" value={selected.depth} onChange={(event) => updateSelected('depth', Number(event.target.value))} />
            </label>
            <label>
              标高 Y
              <input type="number" value={selected.y} onChange={(event) => updateSelected('y', Number(event.target.value))} />
            </label>
          </div>

          <div className="two-column">
            <label>
              X
              <input type="number" value={selected.x} onChange={(event) => updateSelected('x', Number(event.target.value))} />
            </label>
            <label>
              Z
              <input type="number" value={selected.z} onChange={(event) => updateSelected('z', Number(event.target.value))} />
            </label>
          </div>

          <label>
            颜色
            <div className="color-row">
              <span className="color-swatch" style={{ background: selected.color }} />
              <input value={selected.color} onChange={(event) => updateSelected('color', event.target.value)} />
            </div>
          </label>

          <label>
            可见性
            <div className="switch-row">
              <button className={selected.visible ? 'switch active' : 'switch'} onClick={() => updateSelected('visible', !selected.visible)}>
                {selected.visible ? '显示' : '隐藏'}
              </button>
            </div>
          </label>
        </div>

        <div className="action-bar">
          <button className="soft-danger" onClick={() => setItems((prev) => prev.filter((item) => item.id !== selectedId))}>删除</button>
          <button className="primary-btn compact" onClick={() => addItem(selected.type)}>复制构件</button>
        </div>
      </aside>
    </div>
  )
}

export default App
