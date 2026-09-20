import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type Discipline = '建筑' | '结构' | '机电' | '场地'
type ElementType = '地面' | '墙体' | '门窗' | '楼梯' | '阳台' | '屋顶'

type Element = {
  id: number
  type: ElementType
  discipline: Discipline
  name: string
  floor: number
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
  color: string
  visible: boolean
}

const floorList = [1, 2, 3]
const disciplines: Discipline[] = ['建筑', '结构', '机电', '场地']

const starterElements: Element[] = [
  { id: 1, type: '地面', discipline: '结构', name: '一层结构板', floor: 1, x: 0, y: 0, z: 0, width: 12, height: 0.18, depth: 8, color: '#dfeaf6', visible: true },
  { id: 2, type: '墙体', discipline: '建筑', name: '北立面外墙', floor: 1, x: 0, y: 2.8, z: -3.8, width: 12, height: 5.6, depth: 0.22, color: '#f9fbff', visible: true },
  { id: 3, type: '墙体', discipline: '建筑', name: '南立面外墙', floor: 1, x: 0, y: 2.8, z: 3.8, width: 12, height: 5.6, depth: 0.22, color: '#f9fbff', visible: true },
  { id: 4, type: '墙体', discipline: '建筑', name: '东立面外墙', floor: 1, x: 5.9, y: 2.8, z: 0, width: 0.22, height: 5.6, depth: 7.6, color: '#f9fbff', visible: true },
  { id: 5, type: '墙体', discipline: '建筑', name: '西立面外墙', floor: 1, x: -5.9, y: 2.8, z: 0, width: 0.22, height: 5.6, depth: 7.6, color: '#f9fbff', visible: true },
  { id: 6, type: '门窗', discipline: '建筑', name: '落地窗-01', floor: 1, x: 2.2, y: 1.8, z: -3.64, width: 2.4, height: 2.8, depth: 0.12, color: '#8fd9f4', visible: true },
  { id: 7, type: '门窗', discipline: '建筑', name: '入户门', floor: 1, x: -1.8, y: 1.3, z: 3.62, width: 1.5, height: 2.6, depth: 0.12, color: '#b98c66', visible: true },
  { id: 8, type: '阳台', discipline: '建筑', name: '客厅阳台', floor: 1, x: 1.8, y: 1.2, z: 4.35, width: 4.8, height: 0.24, depth: 1.6, color: '#d0eaf9', visible: true },
  { id: 9, type: '楼梯', discipline: '结构', name: '主楼梯', floor: 1, x: -3.5, y: 0.9, z: -1.6, width: 2.2, height: 2.8, depth: 1.2, color: '#cad6e7', visible: true },
  { id: 10, type: '屋顶', discipline: '建筑', name: '平屋顶', floor: 1, x: 0, y: 5.6, z: 0, width: 12.2, height: 0.28, depth: 7.8, color: '#dfe8f3', visible: true },
  { id: 11, type: '地面', discipline: '结构', name: '二层结构板', floor: 2, x: 0, y: 5.8, z: 0, width: 12, height: 0.2, depth: 8, color: '#dfeaf6', visible: true },
  { id: 12, type: '墙体', discipline: '建筑', name: '二层南墙', floor: 2, x: 0, y: 8.4, z: 3.8, width: 12, height: 5.6, depth: 0.18, color: '#f9fbff', visible: true },
  { id: 13, type: '门窗', discipline: '建筑', name: '二层窗-101', floor: 2, x: 3.4, y: 8.1, z: -3.5, width: 2.2, height: 2.6, depth: 0.12, color: '#93dff8', visible: true },
]

const elementIcons: Record<ElementType, string> = {
  地面: '◫',
  墙体: '▥',
  门窗: '▣',
  楼梯: '⌁',
  阳台: '▱',
  屋顶: '⌂',
}

function Scene({ items, selectedId, onSelect, view }: { items: Element[]; selectedId: number; onSelect: (id: number) => void; view: '轴测' | '平面' }) {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#edf5ff')

    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 200)
    camera.position.set(16, 14, 18)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.replaceChildren(renderer.domElement)

    scene.add(new THREE.HemisphereLight('#ffffff', '#b7c9dc', 1.8))

    const sun = new THREE.DirectionalLight('#fff8e5', 2.3)
    sun.position.set(16, 18, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    scene.add(sun)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: '#edf3fa', roughness: 1, metalness: 0 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.15
    ground.receiveShadow = true
    scene.add(ground)

    const grid = new THREE.GridHelper(26, 26, '#bfd3ec', '#e0ebf7')
    grid.position.y = -0.06
    scene.add(grid)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 3, 0)
    controls.enablePan = true
    controls.enableRotate = true
    controls.minDistance = 8
    controls.maxDistance = 42
    controls.maxPolarAngle = Math.PI / 2.05

    if (view === '平面') {
      camera.position.set(0, 24, 0.01)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.maxPolarAngle = Math.PI / 2
    }

    const meshes: THREE.Mesh[] = []
    const addBox = (item: Element) => {
      const material = new THREE.MeshStandardMaterial({
        color: item.color,
        roughness: item.type === '门窗' ? 0.12 : 0.55,
        metalness: item.type === '门窗' ? 0.25 : 0.04,
        transparent: item.type === '门窗',
        opacity: item.type === '门窗' ? 0.8 : 1,
      })
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(item.width, item.height, item.depth), material)
      mesh.position.set(item.x, item.y, item.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { id: item.id }
      scene.add(mesh)
      meshes.push(mesh)
    }

    for (const item of items.filter((entry) => entry.visible)) {
      if (item.type === '楼梯') {
        for (let j = 0; j < 8; j += 1) {
          const step = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.12, 0.52),
            new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.72 })
          )
          step.position.set(item.x - 0.1, item.y + j * 0.14, item.z + j * 0.38)
          step.castShadow = true
          step.receiveShadow = true
          step.userData = { id: item.id }
          scene.add(step)
          meshes.push(step)
        }
      } else {
        addBox(item)
      }
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(meshes, false)[0]
      if (hit?.object.userData.id != null) {
        onSelect(Number(hit.object.userData.id))
      }
    }

    renderer.domElement.addEventListener('click', handleClick)

    let id = 0
    const render = () => {
      id = requestAnimationFrame(render)
      controls.update()
      meshes.forEach((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial
        const active = mesh.userData.id === selectedId
        material.emissive.set(active ? '#dfeaff' : '#000000')
        material.emissiveIntensity = active ? 0.4 : 0
      })
      renderer.render(scene, camera)
    }
    render()

    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', handleClick)
      controls.dispose()
      renderer.dispose()
    }
  }, [items, onSelect, selectedId, view])

  return <div ref={hostRef} className="scene-root" />
}

function App() {
  const [elements, setElements] = useState<Element[]>(starterElements)
  const [selectedId, setSelectedId] = useState(2)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline>('建筑')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'轴测' | '平面'>('轴测')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<Element[][]>([])
  const [future, setFuture] = useState<Element[][]>([])

  const selected = elements.find((item) => item.id === selectedId) ?? elements[0]

  const filtered = useMemo(
    () =>
      elements.filter((item) => {
        const matchesFloor = item.floor === currentFloor || item.type === '地面'
        const matchesDiscipline = selectedDiscipline === '场地' || item.discipline === selectedDiscipline
        const matchesQuery = item.name.toLowerCase().includes(search.toLowerCase())
        return matchesFloor && matchesDiscipline && matchesQuery
      }),
    [currentFloor, elements, search, selectedDiscipline],
  )

  const applyChange = (next: Element[]) => {
    setHistory((prev) => [...prev.slice(-19), elements])
    setFuture([])
    setElements(next)
  }

  const updateSelected = <K extends keyof Element>(key: K, value: Element[K]) => {
    if (!selected) return
    applyChange(elements.map((item) => (item.id === selected.id ? { ...item, [key]: value } : item)))
  }

  const addElement = (type: ElementType) => {
    const newId = Date.now()
    const baseByType: Record<ElementType, Partial<Element>> = {
      地面: { width: 12, height: 0.18, depth: 8, color: '#dfeaf6', discipline: '结构', floor: currentFloor, y: 0 },
      墙体: { width: 3.2, height: 5.2, depth: 0.22, color: '#f9fbff', discipline: '建筑', floor: currentFloor, y: 2.8 },
      门窗: { width: 2.1, height: 2.6, depth: 0.12, color: '#8fd9f4', discipline: '建筑', floor: currentFloor, y: 1.8 },
      楼梯: { width: 2.2, height: 2.8, depth: 1.2, color: '#cad6e7', discipline: '结构', floor: currentFloor, y: 0.9 },
      阳台: { width: 4.2, height: 0.24, depth: 1.4, color: '#d0eaf9', discipline: '建筑', floor: currentFloor, y: 1.2 },
      屋顶: { width: 12.2, height: 0.28, depth: 7.8, color: '#dfe8f3', discipline: '建筑', floor: currentFloor, y: 5.6 },
    }

    const base = baseByType[type]
    const nextElement: Element = {
      id: newId,
      type,
      name: `${type}-${String(elements.length + 1).padStart(2, '0')}`,
      floor: base.floor ?? currentFloor,
      x: 0,
      y: base.y ?? 2,
      z: 0,
      width: base.width ?? 2,
      height: base.height ?? 2,
      depth: base.depth ?? 0.2,
      color: base.color ?? '#f9fbff',
      discipline: base.discipline ?? '建筑',
      visible: true,
    }

    applyChange([...elements, nextElement])
    setSelectedId(newId)
  }

  const deleteSelected = () => {
    if (!selected) return
    const next = elements.filter((item) => item.id !== selected.id)
    applyChange(next)
    setSelectedId(next[0]?.id ?? 0)
  }

  const undo = () => {
    if (history.length === 0) return
    const prior = history[history.length - 1]
    setFuture((prev) => [elements, ...prev])
    setElements(prior)
    setHistory((prev) => prev.slice(0, -1))
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[0]
    setHistory((prev) => [...prev.slice(-19), elements])
    setElements(next)
    setFuture((prev) => prev.slice(1))
  }

  const exportJson = () => {
    const payload = JSON.stringify({ name: 'modern-house-project', elements }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'building-model.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [elements, future, history])

  return (
    <div className="bim-shell">
      <aside className="sidebar left-sidebar">
        <div className="brand-box">
          <div className="brand-mark">B</div>
          <div>
            <strong>BuildCraft</strong>
            <small>协同 BIM 工作台</small>
          </div>
        </div>

        <div className="nav-group">
          {disciplines.map((tab) => (
            <button
              key={tab}
              className={selectedDiscipline === tab ? 'nav-tab active' : 'nav-tab'}
              onClick={() => setSelectedDiscipline(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="panel-section">
          <div className="panel-title-row">
            <span>构件库</span>
            <span className="status-pill">参数化</span>
          </div>
          <div className="palette-grid">
            {Object.entries(elementIcons).map(([type, icon]) => (
              <button key={type} className="palette-card" onClick={() => addElement(type as ElementType)}>
                <span>{icon}</span>
                <strong>{type}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section tree-panel">
          <div className="panel-title-row">
            <span>模型树 · {filtered.length}</span>
            <button className="mini-button" onClick={() => setSearch('')}>⌕</button>
          </div>

          <input
            className="tree-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索构件 / 编号"
          />

          <div className="tree-list">
            {filtered.map((item) => (
              <button
                key={item.id}
                className={selectedId === item.id ? 'tree-item selected' : 'tree-item'}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="tree-icon">{elementIcons[item.type]}</span>
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
            <div className="project-pill">协同项目</div>
            <div>
              <h1>现代三层住宅方案</h1>
              <p>版本 v0.9.0 · 方案评审中</p>
            </div>
          </div>

          <div className="viewer-actions">
            <button className="soft-btn" onClick={undo} disabled={history.length === 0}>↶</button>
            <button className="soft-btn" onClick={redo} disabled={future.length === 0}>↷</button>
            <div className="divider" />
            <button
              className="primary-btn"
              onClick={() => {
                setSaved(true)
                window.setTimeout(() => setSaved(false), 1200)
              }}
            >
              {saved ? '已同步 ✓' : '保存并同步'}
            </button>
            <button className="ghost-btn" onClick={exportJson}>导出 JSON</button>
          </div>
        </header>

        <div className="floor-bar">
          {floorList.map((floor) => (
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
              <button className="tool-btn">框选</button>
              <button className="tool-btn">测量</button>
            </div>
            <div className="view-group">
              <button className={view === '平面' ? 'tool-btn active' : 'tool-btn'} onClick={() => setView('平面')}>平面</button>
              <button className={view === '轴测' ? 'tool-btn active' : 'tool-btn'} onClick={() => setView('轴测')}>轴测</button>
            </div>
          </div>

          <div className="view-hud">
            <span className="online-dot" />实时协同 <b>3 人在线</b>
            <span className="hud-separator" />LOD 300
            <span className="hud-separator" />阴影开启
          </div>

          <Scene items={filtered} selectedId={selectedId} onSelect={setSelectedId} view={view} />
        </div>

        <div className="status-row">
          <div className="status-item"><span className="online-dot" /> 云端已同步</div>
          <div className="status-item">视图：{view}</div>
          <div className="status-item">单位：米</div>
          <div className="status-item">已加载 {filtered.length} / {elements.length} 构件</div>
        </div>
      </main>

      <aside className="sidebar right-sidebar">
        <div className="panel-title-row big-row">
          <span>属性检查器</span>
          <span className="status-pill">BIM</span>
        </div>

        {selected && (
          <>
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
                    {floorList.map((floor) => (
                      <option key={floor} value={floor}>{floor}F</option>
                    ))}
                  </select>
                </label>
                <label>
                  专业
                  <select value={selected.discipline} onChange={(event) => updateSelected('discipline', event.target.value as Discipline)}>
                    {disciplines.map((discipline) => (
                      <option key={discipline} value={discipline}>{discipline}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="section-caption">几何参数 · 单位 m</div>

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
                材质颜色
                <div className="color-row">
                  <span className="color-swatch" style={{ background: selected.color }} />
                  <input value={selected.color} onChange={(event) => updateSelected('color', event.target.value)} />
                </div>
              </label>

              <button className={selected.visible ? 'switch active' : 'switch'} onClick={() => updateSelected('visible', !selected.visible)}>
                {selected.visible ? '● 可见' : '○ 已隐藏'}
              </button>
            </div>

            <div className="collab-card">
              <div className="panel-title-row narrow">
                <span>协同与审阅</span>
                <span className="status-pill">3 条更新</span>
              </div>

              <div className="member-list">
                <div className="member-row">
                  <span className="avatar avatar-blue">Z</span>
                  <div>
                    <strong>周娜</strong>
                    <small>结构审核 · 2分钟前</small>
                  </div>
                  <span className="tag green">已确认</span>
                </div>

                <div className="member-row">
                  <span className="avatar avatar-purple">L</span>
                  <div>
                    <strong>李明</strong>
                    <small>机电协调 · 正在查看</small>
                  </div>
                  <span className="tag orange">待审核</span>
                </div>
              </div>
            </div>

            <div className="action-bar">
              <button className="soft-danger" onClick={deleteSelected}>删除</button>
              <button className="primary-btn compact" onClick={() => addElement(selected.type)}>复制构件</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export default App
