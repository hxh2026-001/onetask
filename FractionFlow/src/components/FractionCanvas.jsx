import { createSignal, createEffect, onMount, onCleanup, For } from 'solid-js';
import { triggerSliceDropAnimation, triggerMergeAnimation, triggerErrorFlash } from '../utils/animations.js';
import { validateDrag } from '../services/api.js';

export default function FractionCanvas(props) {
  const [slices, setSlices] = createSignal([]);
  const [draggingSlice, setDraggingSlice] = createSignal(null);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [dropZoneActive, setDropZoneActive] = createSignal({ zone1: false, zone2: false });
  const [canvasRef, setCanvasRef] = createSignal(null);
  const [selectedCount1, setSelectedCount1] = createSignal(0);
  const [selectedCount2, setSelectedCount2] = createSignal(0);
  const [sliceColors] = createSignal([
    '#4f46e5', '#818cf8', '#10b981', '#34d399',
    '#f59e0b', '#fbbf24', '#ef4444', '#f87171',
    '#8b5cf6', '#a78bfa', '#ec4899', '#f472b6'
  ]);

  let sliceIdCounter = 0;

  onMount(() => {
    generateSlices();
  });

  createEffect(() => {
    if (props.fraction1 || props.fraction2 || props.shapeType) {
      generateSlices();
    }
  });

  const generateSlices = () => {
    const newSlices = [];
    const shapeType = props.shapeType;
    const colors = sliceColors();
    
    const den1 = Math.max(1, Math.min(12, Math.abs(props.fraction1.denominator || 4)));
    const den2 = Math.max(1, Math.min(12, Math.abs(props.fraction2.denominator || 4)));
    
    const totalSlices = Math.min(den1 + den2, 20);
    const size = shapeType === 'circle' ? 60 : 80;
    
    for (let i = 0; i < totalSlices; i++) {
      const color = colors[i % colors.length];
      const isForFraction1 = i < den1;
      
      newSlices.push({
        id: `slice-${++sliceIdCounter}`,
        x: 50 + (i % 5) * (size + 15),
        y: 50 + Math.floor(i / 5) * (size + 15),
        width: shapeType === 'circle' ? size : size * 1.5,
        height: size,
        color,
        shapeType,
        isForFraction1,
        isForFraction2: !isForFraction1,
        selected: false,
        fractionIndex: null,
        value: 1
      });
    }
    
    setSlices(newSlices);
    setSelectedCount1(0);
    setSelectedCount2(0);
  };

  const addSlice = () => {
    const colors = sliceColors();
    const shapeType = props.shapeType;
    const size = shapeType === 'circle' ? 60 : 80;
    
    const newSlice = {
      id: `slice-${++sliceIdCounter}`,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      width: shapeType === 'circle' ? size : size * 1.5,
      height: size,
      color: colors[Math.floor(Math.random() * colors.length)],
      shapeType,
      isForFraction1: true,
      isForFraction2: true,
      selected: false,
      fractionIndex: null,
      value: 1
    };
    
    setSlices(prev => [...prev, newSlice]);
    
    setTimeout(() => {
      const element = document.getElementById(newSlice.id);
      if (element) {
        triggerSliceDropAnimation(element);
      }
    }, 50);
  };

  const clearSlices = () => {
    setSlices([]);
    setSelectedCount1(0);
    setSelectedCount2(0);
  };

  const handleMouseDown = (e, slice) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef()?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggingSlice(slice.id);
    setDragOffset({
      x: e.clientX - rect.left - slice.x,
      y: e.clientY - rect.top - slice.y
    });
    
    document.body.style.cursor = 'grabbing !important';
    document.body.style.userSelect = 'none !important';
    document.body.style.webkitUserSelect = 'none !important';
    document.body.classList.add('is-dragging');
    
    setSlices(prev => prev.map(s => 
      s.id === slice.id ? { ...s, selected: true } : s
    ));
  };

  const handleMouseMove = (e) => {
    if (!draggingSlice() || !canvasRef()) return;
    
    const rect = canvasRef().getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset().x;
    const y = e.clientY - rect.top - dragOffset().y;
    
    setSlices(prev => prev.map(s => 
      s.id === draggingSlice() ? { ...s, x, y } : s
    ));
    
    checkDropZone(x, y);
  };

  const handleMouseUp = async (e) => {
    const currentDraggingId = draggingSlice();
    if (!currentDraggingId) return;
    
    const slice = slices().find(s => s.id === currentDraggingId);
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.classList.remove('is-dragging');
    setDraggingSlice(null);
    setDropZoneActive({ zone1: false, zone2: false });
    
    if (!slice) {
      return;
    }
    
    const rect = canvasRef()?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    
    const x = e.clientX - rect.left - dragOffset().x;
    const y = e.clientY - rect.top - dragOffset().y;
    
    let dropZone = null;
    const canvasWidth = rect.width;
    
    if (x < canvasWidth / 2 - 20) {
      dropZone = 1;
    } else if (x > canvasWidth / 2 + 20) {
      dropZone = 2;
    }
    
    if (dropZone) {
      const newFractionIndex = dropZone;
      const wasInZone1 = slice.fractionIndex === 1;
      const wasInZone2 = slice.fractionIndex === 2;
      
      if (newFractionIndex === 1) {
        if (wasInZone2) {
          setSelectedCount2(prev => Math.max(0, prev - 1));
        }
        if (!wasInZone1) {
          setSelectedCount1(prev => prev + 1);
        }
      } else {
        if (wasInZone1) {
          setSelectedCount1(prev => Math.max(0, prev - 1));
        }
        if (!wasInZone2) {
          setSelectedCount2(prev => prev + 1);
        }
      }
      
      const targetZoneId = `drop-zone-${dropZone}`;
      triggerMergeAnimation(slice.id, targetZoneId);
      
      const denominator = dropZone === 1 ? props.fraction1.denominator : props.fraction2.denominator;
      const newCount1 = newFractionIndex === 1 ? selectedCount1() + (wasInZone1 ? 0 : 1) : selectedCount1();
      const newCount2 = newFractionIndex === 2 ? selectedCount2() + (wasInZone2 ? 0 : 1) : selectedCount2();
      const numerator = dropZone === 1 ? newCount1 : newCount2;
      
      setSlices(prev => prev.map(s => 
        s.id === slice.id ? { ...s, x, y, fractionIndex: newFractionIndex, selected: false } : s
      ));
      
      const validation = await validateDrag({
        numerator,
        denominator,
        shapeType: props.shapeType,
        sliceCount: numerator
      });
      
      if (!validation.valid && validation.errors.length > 0) {
        triggerErrorFlash(targetZoneId, 2);
      }
      
      if (props.onSliceDrop) {
        props.onSliceDrop({
          numerator,
          denominator,
          fractionIndex: dropZone,
          sliceId: slice.id
        });
      }
    } else {
      if (slice.fractionIndex === 1) {
        setSelectedCount1(prev => Math.max(0, prev - 1));
      } else if (slice.fractionIndex === 2) {
        setSelectedCount2(prev => Math.max(0, prev - 1));
      }
      
      setSlices(prev => prev.map(s => 
        s.id === slice.id ? { ...s, x, y, fractionIndex: null, selected: false } : s
      ));
    }
  };

  const checkDropZone = (x, y) => {
    if (!canvasRef()) return;
    
    const rect = canvasRef().getBoundingClientRect();
    const canvasWidth = rect.width;
    
    setDropZoneActive({
      zone1: x < canvasWidth / 2 - 20,
      zone2: x > canvasWidth / 2 + 20
    });
  };

  const renderSliceSVG = (slice) => {
    if (slice.shapeType === 'circle') {
      const r = slice.width / 2;
      const cx = r;
      const cy = r;
      
      return (
        <svg width={slice.width} height={slice.height} viewBox={`0 0 ${slice.width} ${slice.height}`}>
          <defs>
            <linearGradient id={`grad-${slice.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color={slice.color} stop-opacity="0.9" />
              <stop offset="100%" stop-color={slice.color} stop-opacity="0.7" />
            </linearGradient>
          </defs>
          <circle 
            cx={cx} 
            cy={cy} 
            r={r - 2} 
            fill={`url(#grad-${slice.id})`}
            stroke={slice.selected ? '#fff' : slice.color}
            stroke-width={slice.selected ? 3 : 2}
          />
          <circle 
            cx={cx} 
            cy={cy} 
            r={r * 0.3} 
            fill="rgba(255,255,255,0.4)"
          />
        </svg>
      );
    } else {
      return (
        <svg width={slice.width} height={slice.height} viewBox={`0 0 ${slice.width} ${slice.height}`}>
          <defs>
            <linearGradient id={`grad-${slice.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color={slice.color} stop-opacity="0.9" />
              <stop offset="100%" stop-color={slice.color} stop-opacity="0.7" />
            </linearGradient>
          </defs>
          <rect 
            x="2" 
            y="2" 
            width={slice.width - 4} 
            height={slice.height - 4} 
            rx="8"
            fill={`url(#grad-${slice.id})`}
            stroke={slice.selected ? '#fff' : slice.color}
            stroke-width={slice.selected ? 3 : 2}
          />
          <rect 
            x={slice.width * 0.2} 
            y={slice.height * 0.2} 
            width={slice.width * 0.3} 
            height={slice.height * 0.3} 
            rx="4"
            fill="rgba(255,255,255,0.3)"
          />
        </svg>
      );
    }
  };

  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', () => {
      if (draggingSlice()) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.classList.remove('is-dragging');
        setDraggingSlice(null);
        setDropZoneActive({ zone1: false, zone2: false });
      }
    });
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.classList.remove('is-dragging');
  });

  const getDropZoneStyle = (zone) => {
    return {
      left: zone === 1 ? '10px' : '50%',
      top: '10px',
      width: 'calc(50% - 20px)',
      height: 'calc(100% - 20px)'
    };
  };

  return (
    <div>
      <div class="shape-selector">
        <button 
          class={`shape-btn ${props.shapeType === 'circle' ? 'active' : ''}`}
          onClick={() => props.onShapeChange('circle')}
        >
          ⭕ 圆形切片
        </button>
        <button 
          class={`shape-btn ${props.shapeType === 'rect' ? 'active' : ''}`}
          onClick={() => props.onShapeChange('rect')}
        >
          ⬜ 矩形切片
        </button>
      </div>

      <div class="slice-toolbar">
        <button class="add-slice-btn" onClick={addSlice}>
          ➕ 添加切片
        </button>
        <button class="add-slice-btn" onClick={clearSlices} style={{ background: '#ef4444' }}>
          🗑️ 清空画布
        </button>
        <span class="status-indicator success" style={{ marginLeft: 'auto' }}>
          <span class="status-dot"></span>
          分数1: {selectedCount1()}/{props.fraction1.denominator}
        </span>
        <span class="status-indicator success">
          <span class="status-dot"></span>
          分数2: {selectedCount2()}/{props.fraction2.denominator}
        </span>
      </div>

      <div 
        class="canvas-area" 
        ref={setCanvasRef}
      >
        <div 
          id="drop-zone-1"
          class={`drop-zone ${dropZoneActive().zone1 ? 'active hover' : ''}`}
          style={getDropZoneStyle(1)}
        >
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '10px', 
            padding: '4px 12px', 
            background: '#4f46e5', 
            color: 'white', 
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: '700',
            opacity: 0.8
          }}>
            分数 1 区域
          </div>
        </div>
        
        <div 
          id="drop-zone-2"
          class={`drop-zone ${dropZoneActive().zone2 ? 'active hover' : ''}`}
          style={getDropZoneStyle(2)}
        >
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            padding: '4px 12px', 
            background: '#10b981', 
            color: 'white', 
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: '700',
            opacity: 0.8
          }}>
            分数 2 区域
          </div>
        </div>

        <div style={{
          position: 'absolute',
          left: '50%',
          top: '0',
          bottom: '0',
          width: '4px',
          background: 'repeating-linear-gradient(180deg, #94a3b8, #94a3b8 8px, transparent 8px, transparent 16px)',
          transform: 'translateX(-50%)',
          pointerEvents: 'none'
        }}></div>

        <For each={slices()}>
          {(slice) => (
            <div
              id={slice.id}
              class={`slice ${slice.shapeType} ${slice.selected ? 'selected' : ''} ${draggingSlice() === slice.id ? 'dragging' : ''}`}
              style={{
                left: `${slice.x}px`,
                top: `${slice.y}px`,
                width: `${slice.width}px`,
                height: `${slice.height}px`,
                zIndex: draggingSlice() === slice.id ? 100 : slice.selected ? 11 : 1
              }}
              onMouseDown={(e) => handleMouseDown(e, slice)}
            >
              {renderSliceSVG(slice)}
            </div>
          )}
        </For>

        {slices().length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#94a3b8',
            fontSize: '1.2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👆</div>
            点击「添加切片」按钮开始拖拽<br />
            将切片拖到左侧表示分数1的分子<br />
            将切片拖到右侧表示分数2的分子
          </div>
        )}
      </div>
    </div>
  );
}
