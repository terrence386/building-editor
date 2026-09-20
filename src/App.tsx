import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

type ComponentType = '墙体' | '门窗' | '楼梯' | '阳台' | '屋顶' | '地面'
type BuildingItem = { id: number; type: ComponentType; name: string; x: number; y: number; z: number; width: number; height: number; depth: number; color: string }

const palette: { type: ComponentType; icon: string; hint: string }[] = [
  { type: '墙体', icon: '▥', hint: '参数化墙体' },
  { type: '门窗', icon: '▣', hint: '门窗洞口' },
  { type: '楼梯', icon: '⌁', hint: '楼梯构件' },
  { type: '阳台', icon: '▱', hint: '悬挑阳台' },
  { type: '屋顶', icon: '⌂', hint: '屋顶系统' },
]

const starterItems: BuildingItem[] = [
  { id: 1, type: '地面', name: '一层平面', x: 0, y: 0, z: 0, width: 10, height: .18, depth: 7, color: '#dbeafe' },
  { id: 2, type: '墙体', name: '外墙-北', x: 0, y: 1.65, z: -3.5, width: 10, height: 3.3, depth: .25, color: '#f8fafc' },
  { id: 3, type: '墙体', name: '外墙-南', x: 0, y: 1.65, z: 3.5, width: 10, height: 3.3, depth: .25, color: '#f8fafc' },
  { id: 4, type: '墙体', name: '外墙-东', x: 5, y: 1.65, z: 0, width: .25, height: 3.3, depth: 7, color: '#f8fafc' },
  { id: 5, type: '墙体', name: '外墙-西', x: -5, y: 1.65, z: 0, width: .25, height: 3.3, depth: 7, color: '#f8fafc' },
  { id: 6, type: '门窗', name: '落地窗-01', x: 1.8, y: 1.55, z: -3.36, width: 2.5, height: 2.4, depth: .12, color: '#8ed1e8' },
  { id: 7, type: '门窗', name: '入户门', x: -2.5, y: 1.2, z: 3.34, width: 1.2, height: 2.4, depth: .12, color: '#9b7b61' },
  { id: 8, type: '阳台', name: '主阳台', x: 1.7, y: 1.45, z: 4.25, width: 4.2, height: .2, depth: 1.5, color: '#b7d8ed' },
  { id: 9, type: '屋顶', name: '平屋顶', x: 0, y: 3.5, z: 0, width: 10.3, height: .25, depth: 7.3, color: '#dbe4f0' },
]

function Scene({ items, selectedId, onSelect }: { items: BuildingItem[]; selectedId: number; onSelect: (id: number) => void }) {
  const mount = useRef<HTMLDivElement>(null)
  const sceneData = useMemo(() => items, [items])
  useEffect(() => {
    if (!mount.current) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f4f8fc')
    const camera = new THREE.PerspectiveCamera(35, mount.current.clientWidth / mount.current.clientHeight, .1, 100)
    camera.position.set(13, 11, 15); camera.lookAt(0, 1.5, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(mount.current.clientWidth, mount.current.clientHeight); renderer.shadowMap.enabled = true
    mount.current.replaceChildren(renderer.domElement)
    scene.add(new THREE.HemisphereLight('#ffffff', '#b9cbe0', 2.2))
    const sun = new THREE.DirectionalLight('#fff8e5', 3); sun.position.set(8, 14, 8); sun.castShadow = true; scene.add(sun)
    const grid = new THREE.GridHelper(28, 28, '#c9d8e8', '#e1eaf3'); grid.position.y = -.12; scene.add(grid)
    const axes = new THREE.AxesHelper(2); axes.visible = false; scene.add(axes)
    const meshes: THREE.Mesh[] = []
    sceneData.forEach(item => {
      if (item.type === '楼梯') {
        for (let i = 0; i < 7; i++) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, .22 + i * .12, .48), new THREE.MeshStandardMaterial({ color: '#c7d2df' })); mesh.position.set(item.x, .12 + i * .12, item.z + i * .38); mesh.userData.id = item.id; scene.add(mesh); meshes.push(mesh) }
      } else if (item.type === '屋顶') {
        const roof = new THREE.Mesh(new THREE.BoxGeometry(item.width, item.height, item.depth), new THREE.MeshStandardMaterial({ color: item.color, roughness: .55 })); roof.position.set(item.x, item.y, item.z); roof.userData.id = item.id; scene.add(roof); meshes.push(roof)
      } else {
        const geo = new THREE.BoxGeometry(item.width, item.height, item.depth)
        const mat = new THREE.MeshStandardMaterial({ color: item.color, transparent: item.type === '门窗', opacity: item.type === '门窗' ? .82 : 1, roughness: .48, metalness: item.type === '门窗' ? .15 : 0 })
        const mesh = new THREE.Mesh(geo, mat); mesh.position.set(item.x, item.y, item.z); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.id = item.id; scene.add(mesh); meshes.push(mesh)
      }
    })
    const pointer = new THREE.Vector2(); const raycaster = new THREE.Raycaster()
    const click = (event: MouseEvent) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(meshes)[0]; if (hit?.object.userData.id) onSelect(hit.object.userData.id) }
    renderer.domElement.addEventListener('click', click)
    let frame = 0; const animate = () => { frame = requestAnimationFrame(animate); renderer.render(scene, camera) }; animate()
    const resize = () => { if (!mount.current) return; camera.aspect = mount.current.clientWidth / mount.current.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.current.clientWidth, mount.current.clientHeight) }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); renderer.domElement.removeEventListener('click', click); renderer.dispose() }
  }, [sceneData, onSelect])
  return <div className="scene-wrap" ref={mount}><div className="scene-label"><span className="live-dot" />实时预览 · Three.js</div><div className="compass">N</div></div>
}

function App() {
  const [items, setItems] = useState(starterItems)
  const [selectedId, setSelectedId] = useState(2)
  const [tab, setTab] = useState('模型树')
  const [activeTool, setActiveTool] = useState('选择')
  const [saved, setSaved] = useState(false)
  const selected = items.find(item => item.id === selectedId) || items[1]
  const updateSelected = (key: keyof BuildingItem, value: number | string) => setItems(prev => prev.map(item => item.id === selectedId ? { ...item, [key]: value } : item))
  const addItem = (type: ComponentType) => { const id = Date.now(); setItems(prev => [...prev, { id, type, name: `${type}-${String(prev.length).padStart(2, '0')}`, x: 0, y: type === '屋顶' ? 3.5 : 1.5, z: 0, width: type === '门窗' ? 1.5 : 3, height: type === '门窗' ? 2.2 : type === '阳台' ? .2 : 2.8, depth: type === '阳台' ? 1.4 : .25, color: type === '门窗' ? '#8ed1e8' : '#f8fafc' }]); setSelectedId(id) }
  const grouped = items.filter(item => item.type !== '地面')
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">⌂</div><div><strong>Build<span>Craft</span></strong><small>建筑参数化编辑器</small></div></div><div className="project-name"><span className="crumb">项目 / </span>现代住宅方案 <i>·</i> <em>已保存</em></div><div className="top-actions"><button className="icon-btn">↶</button><button className="icon-btn">↷</button><div className="divider" /><button className="save-btn" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800) }}>⌘ 保存{saved && <b>✓</b>}</button><button className="export-btn">导出模型 <span>⌄</span></button><div className="avatar">TC</div></div></header>
    <main className="workspace">
      <aside className="left-panel"><div className="panel-tabs"><button className={tab === '模型树' ? 'active' : ''} onClick={() => setTab('模型树')}>模型树</button><button className={tab === '图层' ? 'active' : ''} onClick={() => setTab('图层')}>图层</button></div><div className="tree-toolbar"><span>建筑模型 <small>({grouped.length})</small></span><button onClick={() => addItem('墙体')}>＋</button></div><div className="search">⌕ <input placeholder="搜索构件..." /></div><div className="tree-list"><div className="tree-root"><span>⌄</span><span className="folder">▰</span><strong>现代住宅方案</strong><small>一层</small></div><div className="tree-group"><span className="line" />{grouped.map(item => <button key={item.id} className={`tree-item ${selectedId === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}><span className="tree-type">{item.type === '墙体' ? '▥' : item.type === '门窗' ? '▣' : item.type === '阳台' ? '▱' : item.type === '屋顶' ? '⌂' : '⌁'}</span><span>{item.name}</span><i>⋮</i></button>)}</div></div><div className="panel-footer"><div><span className="status-dot" /> BIM 数据同步</div><small>v0.8.2</small></div></aside>
      <section className="canvas-area"><div className="canvas-toolbar"><div className="tool-group"><button className={activeTool === '选择' ? 'tool-active' : ''} onClick={() => setActiveTool('选择')}>↖ <span>选择</span></button><button className={activeTool === '平移' ? 'tool-active' : ''} onClick={() => setActiveTool('平移')}>✣ <span>平移</span></button><button className={activeTool === '旋转' ? 'tool-active' : ''} onClick={() => setActiveTool('旋转')}>◌ <span>旋转</span></button></div><div className="view-group"><button>▧</button><button className="view-active">▦ 透视</button><button>⊞</button><div className="divider" /><button>⌗</button></div></div><Scene items={items} selectedId={selectedId} onSelect={setSelectedId} /><div className="canvas-bottom"><div className="coordinates"><span>X <b>0.00</b></span><span>Y <b>0.00</b></span><span>Z <b>0.00</b></span></div><div className="zoom"><button>−</button><span>100%</span><button>＋</button><button>⌗</button></div></div></section>
      <aside className="right-panel"><div className="properties-head"><div><h3>属性面板</h3><p>{selected.type} · {selected.name}</p></div><button>×</button></div><div className="property-content"><div className="section-title">基本信息 <span>⌃</span></div><label>构件名称<input value={selected.name} onChange={e => updateSelected('name', e.target.value)} /></label><label>构件类型<div className="select-like">{selected.type}<span>⌄</span></div></label><div className="section-title spaced">尺寸参数 <span>⌃</span></div><div className="dimension-grid"><label>宽度 (W)<input type="number" value={selected.width} onChange={e => updateSelected('width', Number(e.target.value))} /></label><label>高度 (H)<input type="number" value={selected.height} onChange={e => updateSelected('height', Number(e.target.value))} /></label><label>深度 (D)<input type="number" value={selected.depth} onChange={e => updateSelected('depth', Number(e.target.value))} /></label><label>标高 (Z)<input type="number" value={selected.y} onChange={e => updateSelected('y', Number(e.target.value))} /></label></div><div className="section-title spaced">材质与样式 <span>⌃</span></div><label>材质<div className="select-like">现代混凝土 <span>⌄</span></div></label><label>表面颜色<div className="color-row"><span className="color-swatch" style={{ background: selected.color }} /><input value={selected.color} onChange={e => updateSelected('color', e.target.value)} /></div></label><div className="section-title spaced">位置 <span>⌃</span></div><div className="position-row"><label>X<input value={selected.x} onChange={e => updateSelected('x', Number(e.target.value))} /></label><label>Y<input value={selected.y} onChange={e => updateSelected('y', Number(e.target.value))} /></label><label>Z<input value={selected.z} onChange={e => updateSelected('z', Number(e.target.value))} /></label></div></div><div className="property-actions"><button onClick={() => setItems(prev => prev.filter(item => item.id !== selectedId))}>删除构件</button><button className="primary" onClick={() => addItem(selected.type)}>复制构件</button></div></aside>
    </main><footer className="bottom-bar"><div><span className="online" /> 在线编辑 <span className="footer-divider" /> <span>单位：米</span></div><div className="shortcuts"><span><kbd>⌘</kbd> + <kbd>S</kbd> 保存</span><span><kbd>⌘</kbd> + <kbd>Z</kbd> 撤销</span><span>帮助中心 <b>?</b></span></div></footer>
  </div>
}
export default App
