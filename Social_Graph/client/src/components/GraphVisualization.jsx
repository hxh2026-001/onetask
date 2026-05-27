import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
const communityColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
function GraphVisualization({ nodes, edges, activeNodes, animationType, hoveredNode, setHoveredNode, selectedNode, setSelectedNode, onAddNode }) {
 const svgRef = useRef(null);
 const containerRef = useRef(null);
 const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
 useEffect(() => {
 const updateDimensions = () => {
 if (containerRef.current) {
 setDimensions({
 width: containerRef.current.clientWidth,
 height: containerRef.current.clientHeight
 });
 }
 };
 updateDimensions();
 window.addEventListener('resize', updateDimensions);
 return () => window.removeEventListener('resize', updateDimensions);
 }, []);
 useEffect(() => {
    if (!nodes.length || !svgRef.current)
    return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const nodeCopies = nodes.map(n => ({ ...n }));
    const nodeMap = new Map(nodeCopies.map(n => [n.id, n]));
    const simulation = d3.forceSimulation(nodeCopies)
 .force('link', d3.forceLink(edges).id(d => d.id).distance(d => 100 / (d.weight || 1)))
 .force('charge', d3.forceManyBody().strength(-300))
 .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));
 const g = svg.append('g');
 const edgesGroup = g.append('g').attr('class', 'edges');
 const nodesGroup = g.append('g').attr('class', 'nodes');
 const ripplesGroup = g.append('g').attr('class', 'ripples');
 const edge = edgesGroup.selectAll('line')
 .data(edges)
 .enter().append('line')
 .attr('class', 'edge')
 .attr('stroke', d => {
 const sourceActive = activeNodes.has(d.source);
 const targetActive = activeNodes.has(d.target);
 if (sourceActive && targetActive)
 return '#FF6B6B';
 if (sourceActive || targetActive)
 return '#FFB347';
 return '#999';
 })
 .attr('stroke-width', d => Math.max(1, (d.weight || 1) * 4))
 .style('transition', 'all 0.5s ease');
 const node = nodesGroup.selectAll('g')
 .data(nodes)
 .enter().append('g')
 .attr('class', 'node-group')
 .call(d3.drag()
 .on('start', dragstarted)
 .on('drag', dragged)
 .on('end', dragended));
 const nodeCircle = node.append('circle')
 .attr('r', d => {
 if (activeNodes.has(d.id))
 return 18;
 if (animationType === 'heatmap' && d.pagerank)
 return 8 + d.pagerank * 20;
 if (animationType === 'pulse' && d.betweenness > 0.5)
 return 15;
 return 12;
 })
 .attr('fill', d => {
 if (activeNodes.has(d.id))
 return '#FF6B6B';
 if (animationType === 'community') {
 return communityColors[d.community % communityColors.length] || '#999';
 }
 if (animationType === 'heatmap') {
        const intensity = d.pagerank || 0;
        return `rgb(${Math.round((1 - intensity) * 66 + intensity * 220)}, ${Math.round((1 - intensity) * 139 + intensity * 150)}, ${Math.round((1 - intensity) * 207)})`;
      }
 return '#4ECDC4';
 })
 .attr('stroke', d => selectedNode === d.id ? '#FFD700' : '#333')
 .attr('stroke-width', d => selectedNode === d.id ? 3 : 2)
 .style('transition', 'all 0.3s ease');
 if (animationType === 'pulse') {
 nodeCircle.filter(d => d.betweenness > 0.5)
 .style('animation', 'pulse 1s ease-in-out infinite');
 }
 node.append('text')
 .attr('dy', 25)
 .attr('text-anchor', 'middle')
 .style('font-size', '12px')
 .style('fill', '#333')
 .text(d => d.name);
 node.on('mouseover', (event, d) => {
 setHoveredNode(d);
 d3.select(event.currentTarget).select('circle')
 .transition().duration(200)
 .attr('r', 18);
 })
 .on('mouseout', (event, d) => {
 setHoveredNode(null);
 d3.select(event.currentTarget).select('circle')
 .transition().duration(200)
 .attr('r', activeNodes.has(d.id) ? 18 : 12);
 })
 .on('click', (event, d) => {
 event.stopPropagation();
 setSelectedNode(selectedNode === d.id ? null : d.id);
 });
 svg.on('click', (event) => {
 if (event.target === svgRef.current || event.target.tagName === 'svg') {
 const [x, y] = d3.pointer(event);
 onAddNode(`节点${nodes.length + 1}`, x, y);
 }
 });
 if (animationType === 'ripple') {
 activeNodes.forEach(nodeId => {
 const nodeData = nodeMap.get(nodeId);
 if (nodeData) {
 for (let i = 0; i < 3; i++) {
 ripplesGroup.append('circle')
 .attr('cx', nodeData.x || dimensions.width / 2)
 .attr('cy', nodeData.y || dimensions.height / 2)
 .attr('r', 12)
 .attr('fill', 'none')
 .attr('stroke', '#FF6B6B')
 .attr('stroke-width', 2)
 .style('opacity', 0.8 - i * 0.25)
 .transition()
 .duration(2000)
 .ease(d3.easeLinear)
 .attr('r', 60 + i * 30)
 .style('opacity', 0)
 .remove();
 }
 }
 });
 }
 simulation.on('tick', () => {
 edge.attr('x1', d => d.source.x || 0)
 .attr('y1', d => d.source.y || 0)
 .attr('x2', d => d.target.x || 0)
 .attr('y2', d => d.target.y || 0);
 node.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
 });
 function dragstarted(event, d) {
 if (!event.active)
 simulation.alphaTarget(0.3).restart();
 d.fx = d.x;
 d.fy = d.y;
 }
 function dragged(event, d) {
 d.fx = event.x;
 d.fy = event.y;
 }
 function dragended(event, d) {
 if (!event.active)
 simulation.alphaTarget(0);
 d.fx = null;
 d.fy = null;
 }
 }, [nodes, edges, activeNodes, animationType, hoveredNode, selectedNode, dimensions, onAddNode]);
 return (<div ref={containerRef} className="graph-container">
 <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ background: '#f8f9fa' }}/>
 {hoveredNode && (<div className="tooltip" style={{
 left: hoveredNode.x + 20 + 'px',
 top: hoveredNode.y - 60 + 'px'
 }}>
 <div><strong>{hoveredNode.name}</strong></div>
 <div>PageRank: {(hoveredNode.pagerank || 0).toFixed(4)}</div>
 <div>介数中心性: {(hoveredNode.betweenness || 0).toFixed(4)}</div>
 <div>社群: {hoveredNode.community}</div>
 </div>)}
 </div>);
}
export default GraphVisualization;
