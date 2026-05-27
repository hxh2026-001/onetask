import { useState, useEffect, useRef, useCallback } from 'react'
import GraphVisualization from './components/GraphVisualization'
import ControlPanel from './components/ControlPanel'
import './App.css'

function App() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [activeNodes, setActiveNodes] = useState(new Set())
  const [simulationHistory, setSimulationHistory] = useState([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationType, setAnimationType] = useState('ripple')
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const animationRef = useRef(null)

  useEffect(() => {
    fetchGraph()
  }, [])

  const fetchGraph = async () => {
    const nodesRes = await fetch('/api/graph/nodes')
    const edgesRes = await fetch('/api/graph/edges')
    const [nodesData, edgesData] = await Promise.all([nodesRes.json(), edgesRes.json()])
    setNodes(nodesData)
    setEdges(edgesData)
    setActiveNodes(new Set())
    setSimulationHistory([])
    setCurrentStep(-1)
  }

  const handleAddNode = async (name, x, y) => {
    const res = await fetch('/api/graph/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: `node_${Date.now()}`, name, x, y })
    })
    const newNode = await res.json()
    setNodes(prev => [...prev, newNode])
  }

  const handleAddEdge = async (source, target, weight, probability) => {
    const res = await fetch('/api/graph/edges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target, weight, probability })
    })
    const newEdge = await res.json()
    setEdges(prev => [...prev, newEdge])
  }

  const handleDeleteNode = async (id) => {
    await fetch(`/api/graph/nodes/${id}`, { method: 'DELETE' })
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
  }

  const handleDeleteEdge = async (id) => {
    await fetch(`/api/graph/edges/${id}`, { method: 'DELETE' })
    setEdges(prev => prev.filter(e => e.id !== id))
  }

  const handleClear = async () => {
    await fetch('/api/graph/clear', { method: 'DELETE' })
    setNodes([])
    setEdges([])
    setActiveNodes(new Set())
    setSimulationHistory([])
    setCurrentStep(-1)
  }

  const handleLoadPreset = async (preset) => {
    await fetch(`/api/presets/${preset}`, { method: 'POST' })
    fetchGraph()
  }

  const handleRunSimulation = async (initialNodeIds) => {
    const res = await fetch('/api/simulation/ic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialNodes: initialNodeIds, steps: 30 })
    })
    const history = await res.json()
    setSimulationHistory(history)
    setCurrentStep(0)
    setActiveNodes(new Set(history[0].activated))
    setIsAnimating(true)
  }

  useEffect(() => {
    if (isAnimating && currentStep < simulationHistory.length - 1) {
      animationRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setActiveNodes(new Set(simulationHistory[currentStep + 1].activated))
      }, 500)
    } else if (currentStep >= simulationHistory.length - 1) {
      setIsAnimating(false)
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [currentStep, isAnimating, simulationHistory])

  const handleCalculateMetrics = async () => {
    await fetch('/api/simulation/pagerank')
    await fetch('/api/simulation/betweenness')
    await fetch('/api/simulation/communities')
    fetchGraph()
  }

  const handleStopAnimation = () => {
    setIsAnimating(false)
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
  }

  return (
    <div className="app-container">
      <ControlPanel
        onAddNode={handleAddNode}
        onAddEdge={handleAddEdge}
        onDeleteNode={handleDeleteNode}
        onDeleteEdge={handleDeleteEdge}
        onClear={handleClear}
        onLoadPreset={handleLoadPreset}
        onRunSimulation={handleRunSimulation}
        onCalculateMetrics={handleCalculateMetrics}
        onStopAnimation={handleStopAnimation}
        onAnimationTypeChange={setAnimationType}
        nodes={nodes}
        edges={edges}
        isAnimating={isAnimating}
        currentStep={currentStep}
        totalSteps={simulationHistory.length}
        animationType={animationType}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
      />
      <GraphVisualization
        nodes={nodes}
        edges={edges}
        activeNodes={activeNodes}
        animationType={animationType}
        hoveredNode={hoveredNode}
        setHoveredNode={setHoveredNode}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        onAddNode={handleAddNode}
      />
    </div>
  )
}

export default App