import { Maximize2, Mountain, TreePine, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function MindGardenInteractive() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const containerRef = useRef(null);

  // Soil line (ground level) - y position
  const SOIL_LINE = 500;
  const CANVAS_WIDTH = 10000;
  const CANVAS_HEIGHT = 800;

  // Hierarchy layout - organized vertically
  // Seeds (underground, bottom layer)
  // Roots (underground, above seeds)
  // Soil line
  // Weeds/Plants (above ground)
  // Trees (above ground, top layer)
  const gardenData = {
    seeds: [
      { id: 's1', x: 200, y: 750, title: 'I deserve rest', planted: '3 days ago', connectedTo: ['r4', 'p2'] },
      { id: 's2', x: 400, y: 750, title: 'My needs matter', planted: '1 week ago', connectedTo: ['r5', 'p2'] },
      { id: 's3', x: 600, y: 750, title: 'Self-compassion', planted: '2 weeks ago', connectedTo: ['r6'] },
      { id: 's4', x: 800, y: 750, title: 'Boundaries', planted: '5 days ago', connectedTo: ['r7', 'p2'] },
    ],
    roots: [
      { id: 'r1', x: 150, y: 600, title: 'I am not enough', origin: 'Childhood criticism', connectedTo: ['w1'] },
      { id: 'r2', x: 350, y: 600, title: 'Love must be earned', origin: 'Conditional affection', connectedTo: ['w2'] },
      { id: 'r3', x: 550, y: 600, title: 'I must be perfect', origin: 'Early expectations', connectedTo: ['w3'] },
      { id: 'r4', x: 200, y: 600, title: 'Worthiness', origin: 'Self-discovery', connectedTo: ['s1', 'p1'] },
      { id: 'r5', x: 400, y: 600, title: 'Self-respect', origin: 'Therapy', connectedTo: ['s2', 'p1'] },
      { id: 'r6', x: 600, y: 600, title: 'Acceptance', origin: 'Mindfulness', connectedTo: ['s3', 'p1'] },
      { id: 'r7', x: 800, y: 600, title: 'Autonomy', origin: 'Growth', connectedTo: ['s4', 'p1'] },
    ],
    weeds: [
      { id: 'w1', x: 150, y: SOIL_LINE, title: '', trigger: 'Unknown outcomes', connectedTo: ['r1', 't1'] },
      { id: 'w2', x: 350, y: SOIL_LINE, title: '', trigger: 'Conflict', connectedTo: ['r2', 't2'] },
      { id: 'w3', x: 550, y: SOIL_LINE, title: '', trigger: 'Mistakes', connectedTo: ['r3', 't1'] },
    ],
    plants: [
      { id: 'p1', x: 500, y: SOIL_LINE, title: '', type: 'new', strength: 45, connectedTo: ['r4', 'r5', 'r6', 'r7', 't3'] },
      { id: 'p2', x: 300, y: SOIL_LINE, title: '', type: 'new', strength: 60, connectedTo: ['s1', 's2', 's4', 't3'] },
    ],
    trees: [
      { id: 't1', x: 250, y: SOIL_LINE, title: '', impact: 'Driven but exhausted', connectedTo: [ 's3', 'r1', 'r3'] },
      { id: 't2', x: 650, y: SOIL_LINE, title: '', impact: 'Helpful but depleted', connectedTo: ['w2', 'r2'] },
      { id: 't3', x: 1050, y: SOIL_LINE, title: '', impact: 'Emerging', connectedTo: ['p1', 'p2', 'r4', 'r5'] },
    ],
    soil: { quality: 65, description: 'Healing in progress' }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 3);
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (e.target === containerRef.current || e.target.closest('.canvas-area')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom]);

  const getNodeImage = (type) => {
    const images = {
      seeds: '/mindtree/seeds.png',
      roots: '/mindtree/rootsicon.png',
      weeds: '/mindtree/weedscolor.png',
      plants: '/mindtree/healthyplant.png',
      trees: '/mindtree/tree.png',
    };
    return images[type] || null;
  };

  const getNodeSize = (type) => {
    const sizes = {
      seeds: { width: 40, height: 40 },
      roots: { width: 50, height: 50 },
      weeds: { width: 50, height: 50 },
      plants: { width: 60, height: 60 },
      trees: { width: 250, height: 250 },
    };
    return sizes[type] || { width: 50, height: 50 };
  };

  const renderConnections = () => {
    const connections = [];
    
    // Get all nodes (excluding soil which is not a node)
    const allNodes = [
      ...gardenData.seeds,
      ...gardenData.roots,
      ...gardenData.weeds,
      ...gardenData.plants,
      ...gardenData.trees,
    ];
    
    allNodes.forEach(item => {
      if (item.connectedTo) {
        item.connectedTo.forEach(targetId => {
          const target = allNodes.find(n => n?.id === targetId);
          
          if (target) {
            const isHighlighted = selectedNode?.id === item.id || selectedNode?.id === targetId;
            connections.push(
              <line
                key={`${item.id}-${targetId}`}
                x1={item.x}
                y1={item.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? '#10b981' : '#e5e7eb'}
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={isHighlighted ? 1 : 0.3}
                className="transition-all duration-300"
              />
            );
          }
        });
      }
    });
    
    return connections;
  };

  const renderNode = (node, type) => {
    const imageSrc = getNodeImage(type);
    const size = getNodeSize(type);
    const isSelected = selectedNode?.id === node.id;
    const isHovered = hoveredNode?.id === node.id;
    const isConnected = selectedNode?.connectedTo?.includes(node.id) || 
                       node.connectedTo?.includes(selectedNode?.id);

    return (
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(node.id === selectedNode?.id ? null : { ...node, type });
        }}
        className="cursor-pointer"
      >
        {/* Outer ring for selected/connected */}
        {(isSelected || isConnected) && (() => {
          const isOnSoilLine = type === 'weeds' || type === 'plants' || type === 'trees';
          const ringY = isOnSoilLine ? -size.height / 2 : 0;
          return (
            <circle
              cx="0"
              cy={ringY}
              r={Math.max(size.width, size.height) / 2 + 8}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              opacity={isSelected ? 1 : 0.5}
              className="transition-all duration-300"
            />
          );
        })()}
        
        {/* Node image */}
        {imageSrc && (() => {
          // For weeds, plants, and trees, anchor bottom to soil line
          // For seeds and roots, center them
          const isOnSoilLine = type === 'weeds' || type === 'plants' || type === 'trees';
          const imageY = isOnSoilLine ? -size.height : -size.height / 2;
          const labelY = isOnSoilLine ? size.height + 20 : size.height / 2 + 20;
          
          return (
            <>
              <image
                href={imageSrc}
                x={-size.width / 2}
                y={imageY}
                width={size.width}
                height={size.height}
                className={`transition-all duration-200 ${
                  isHovered ? 'opacity-90' : 'opacity-100'
                }`}
                style={{ 
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
                }}
              />
              {/* Label */}
              {zoom > 0.8 && (() => {
                const displayText = node.title || node.state || '';
                return displayText ? (
                  <text
                    y={labelY}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-700 pointer-events-none"
                    style={{ fontSize: `${12 / zoom}px` }}
                  >
                    {displayText.length > 20 ? displayText.slice(0, 20) + '...' : displayText}
                  </text>
                ) : null;
              })()}
            </>
          );
        })()}
      </g>
    );
  };

  const renderDetailPanel = () => {
    if (!selectedNode) return null;

    const imageSrc = getNodeImage(selectedNode.type);
    
    return (
      <div className="absolute top-6 right-6 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {imageSrc ? (
              <img 
                src={imageSrc} 
                alt={selectedNode.type}
                className="w-12 h-12 object-contain rounded-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100" />
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{selectedNode.type}</p>
              <h3 className="text-lg font-bold text-black">{selectedNode.title || selectedNode.state || 'Untitled'}</h3>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          {selectedNode.origin && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Origin</p>
              <p className="text-sm text-gray-700">{selectedNode.origin}</p>
            </div>
          )}
          
          {selectedNode.trigger && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Trigger</p>
              <p className="text-sm text-gray-700">{selectedNode.trigger}</p>
            </div>
          )}
          
          {selectedNode.planted && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Planted</p>
              <p className="text-sm text-gray-700">{selectedNode.planted}</p>
            </div>
          )}
          
          {selectedNode.impact && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Impact</p>
              <p className="text-sm text-gray-700">{selectedNode.impact}</p>
            </div>
          )}
          
          {selectedNode.outcome && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Outcome</p>
              <p className="text-sm text-gray-700">{selectedNode.outcome}</p>
            </div>
          )}
          
          {selectedNode.state && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">State</p>
              <p className="text-sm text-gray-700">{selectedNode.state} - {selectedNode.description}</p>
            </div>
          )}
          
          {selectedNode.strength !== undefined && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Strength</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${selectedNode.strength}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{selectedNode.strength}%</p>
            </div>
          )}

          {selectedNode.connectedTo && selectedNode.connectedTo.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Connected to</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.connectedTo.map(id => {
                  const allNodes = [
                    ...gardenData.seeds,
                    ...gardenData.roots,
                    ...gardenData.weeds,
                    ...gardenData.plants,
                    ...gardenData.trees,
                  ];
                  const connected = allNodes.find(n => n?.id === id);
                  return connected ? (
                    <span key={id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                      {connected.title || connected.state || 'Untitled'}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <button className="w-full mt-6 px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all active:scale-95">
          Explore deeper
        </button>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen bg-white overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-black">Your Mind Garden</h1>
              <p className="text-xs text-gray-500">Click nodes to explore • Scroll to zoom • Drag to pan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Mountain className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Soil: {gardenData.soil.quality}%</span>
            </div>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Reset view"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 bg-white rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setZoom(Math.min(zoom + 0.2, 3))}
          className="p-2 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
          className="p-2 hover:bg-gray-50 transition-colors"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-48">
        <p className="text-xs font-semibold text-gray-900 mb-3">Legend</p>
        <div className="space-y-2">
          {Object.entries({ seeds: 'Seeds', roots: 'Roots', weeds: 'Weeds', plants: 'Plants', trees: 'Trees' }).map(([key, label]) => {
            const imageSrc = getNodeImage(key);
            return (
              <div key={key} className="flex items-center gap-2">
                {imageSrc ? (
                  <img src={imageSrc} alt={label} className="w-4 h-4 object-contain" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                )}
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {renderDetailPanel()}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="canvas-area w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedNode(null)}
      >
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Soil line (ground level) */}
          <line
            x1="0"
            y1={SOIL_LINE}
            x2={CANVAS_WIDTH}
            y2={SOIL_LINE}
            stroke="#8B7355"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.3"
          />

          {/* Connections */}
          <g className="connections">
            {renderConnections()}
          </g>

          {/* Nodes - rendered in order from bottom to top */}
          <g className="nodes">
            {/* Seeds (underground, bottom) */}
            {gardenData.seeds.map(node => renderNode(node, 'seeds'))}
            {/* Roots (underground, above seeds) */}
            {gardenData.roots.map(node => renderNode(node, 'roots'))}
            {/* Weeds (above ground) */}
            {gardenData.weeds.map(node => renderNode(node, 'weeds'))}
            {/* Plants (above ground) */}
            {gardenData.plants.map(node => renderNode(node, 'plants'))}
            {/* Trees (above ground, top) */}
            {gardenData.trees.map(node => renderNode(node, 'trees'))}
          </g>
        </svg>
      </div>
    </div>
  );
}