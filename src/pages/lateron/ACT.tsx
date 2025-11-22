import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Edit2,
  Save,
  X,
  Trash2,
  Home,
  Download,
  Upload,
} from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import { useAuth } from "@/components/auth/AuthContext";

const ACT_LEVELS = [
  { level: 8, name: "Base Survival", color: "#1a1a1a", yPos: 0.9 },
  { level: 7, name: "Primordial Seed", color: "#4a3520", yPos: 0.78 },
  { level: 6, name: "Somatic-Emotional Imprint", color: "#6b4423", yPos: 0.66 },
  { level: 5, name: "Emotional Law Framework", color: "#8b5a3c", yPos: 0.54 },
  { level: 4, name: "Coping Role", color: "#6d5d4d", yPos: 0.42 },
  { level: 3, name: "Behavior Pattern", color: "#4a6b4a", yPos: 0.3 },
  { level: 2, name: "Situational Expression", color: "#5d8a5d", yPos: 0.18 },
  { level: 1, name: "Surface Echo", color: "#7bc67b", yPos: 0.06 },
];

interface Node {
  id: string;
  level: number;
  content: string;
  parentId?: string;
}

const ACT = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([
    { id: "8-1", level: 8, content: "Stay alive, survive, avoid deletion" },
    { id: "7-1", level: 7, content: "Abandonment = death", parentId: "8-1" },
    {
      id: "6-1",
      level: 6,
      content: "Chest tightness, panic response",
      parentId: "7-1",
    },
    { id: "6-2", level: 6, content: "Shutdown, freeze state", parentId: "7-1" },
    {
      id: "5-1",
      level: 5,
      content: "To be safe I must stay small",
      parentId: "6-1",
    },
    {
      id: "5-2",
      level: 5,
      content: "Connection requires enmeshment",
      parentId: "6-2",
    },
    {
      id: "5-3",
      level: 5,
      content: "I must be perfect to be loved",
      parentId: "6-2",
    },
    {
      id: "4-1",
      level: 4,
      content: "People-pleaser identity",
      parentId: "5-1",
    },
    { id: "4-2", level: 4, content: "Perfectionist persona", parentId: "5-2" },
    { id: "4-3", level: 4, content: "Controller/Fixer role", parentId: "5-3" },
    {
      id: "3-1",
      level: 3,
      content: "Over-explaining everything",
      parentId: "4-1",
    },
    { id: "3-2", level: 3, content: "Avoiding conflict", parentId: "4-1" },
    {
      id: "3-3",
      level: 3,
      content: "Overachieving to prove worth",
      parentId: "4-2",
    },
    {
      id: "3-4",
      level: 3,
      content: "Controlling environment",
      parentId: "4-3",
    },
    { id: "3-5", level: 3, content: "Analyzing everything", parentId: "4-3" },
    { id: "2-1", level: 2, content: "At parties: go quiet", parentId: "3-1" },
    {
      id: "2-2",
      level: 2,
      content: "At work: over-apologize",
      parentId: "3-2",
    },
    {
      id: "2-3",
      level: 2,
      content: "In projects: work until burnout",
      parentId: "3-3",
    },
    {
      id: "2-4",
      level: 2,
      content: "In relationships: micromanage",
      parentId: "3-4",
    },
    {
      id: "2-5",
      level: 2,
      content: "When stressed: overthink",
      parentId: "3-5",
    },
    { id: "1-1", level: 1, content: "Visible anxiety", parentId: "2-1" },
    { id: "1-2", level: 1, content: "Constant apologizing", parentId: "2-2" },
    {
      id: "1-3",
      level: 1,
      content: "Exhaustion, irritability",
      parentId: "2-3",
    },
    { id: "1-4", level: 1, content: "Partner frustration", parentId: "2-4" },
    {
      id: "1-5",
      level: 1,
      content: "Insomnia, racing thoughts",
      parentId: "2-5",
    },
  ]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [newNodeContent, setNewNodeContent] = useState("");
  const [newNodeParent, setNewNodeParent] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Supabase state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null);
  const [savedTrees, setSavedTrees] = useState<any[]>([]);
  const [showTreeSelector, setShowTreeSelector] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  const width = 1400;
  const height = 1000;

  // Calculate positions with auto-layout
  const calculateNodePositions = () => {
    const positions: Record<string, { x: number; y: number }> = {};

    // Build tree structure
    const getChildren = (nodeId: string) =>
      nodes.filter((n) => n.parentId === nodeId);

    // Calculate width needed for each subtree
    const getSubtreeWidth = (nodeId: string): number => {
      const children = getChildren(nodeId);
      if (children.length === 0) return 1;
      return children.reduce(
        (sum, child) => sum + getSubtreeWidth(child.id),
        0
      );
    };

    // Layout nodes recursively
    const layoutNode = (nodeId: string, left: number, right: number) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const levelInfo = ACT_LEVELS.find((l) => l.level === node.level);
      const y = (levelInfo?.yPos || 0.5) * height;
      const x = (left + right) / 2;

      positions[nodeId] = { x, y };

      const children = getChildren(nodeId);
      if (children.length === 0) return;

      let currentLeft = left;
      children.forEach((child) => {
        const childWidth = getSubtreeWidth(child.id);
        const childRight =
          currentLeft +
          (childWidth /
            children.reduce((sum, c) => sum + getSubtreeWidth(c.id), 0)) *
            (right - left);
        layoutNode(child.id, currentLeft, childRight);
        currentLeft = childRight;
      });
    };

    // Find root nodes (no parent)
    const roots = nodes.filter((n) => !n.parentId);
    const padding = width * 0.1;
    const availableWidth = width - 2 * padding;

    roots.forEach((root, index) => {
      const rootWidth = getSubtreeWidth(root.id);
      const totalWidth = roots.reduce(
        (sum, r) => sum + getSubtreeWidth(r.id),
        0
      );
      const left =
        padding +
        (index > 0
          ? (roots
              .slice(0, index)
              .reduce((sum, r) => sum + getSubtreeWidth(r.id), 0) /
              totalWidth) *
            availableWidth
          : 0);
      const right = left + (rootWidth / totalWidth) * availableWidth;
      layoutNode(root.id, left, right);
    });

    return positions;
  };

  const nodePositions = calculateNodePositions();

  const getNodePosition = (node: Node) => {
    return nodePositions[node.id] || { x: width / 2, y: height / 2 };
  };

  // Supabase functions

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.4), 2.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === svgRef.current ||
      !(e.target as HTMLElement).closest(".node")
    ) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const openAddModal = (level: number) => {
    setSelectedLevel(level);
    setShowAddModal(true);
    setNewNodeContent("");

    const potentialParents = nodes.filter((n) => n.level === level + 1);
    setNewNodeParent(
      potentialParents.length > 0 ? potentialParents[0].id : null
    );
  };

  const addNode = () => {
    if (selectedLevel === null) return;

    const newId = `${selectedLevel}-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      level: selectedLevel,
      content:
        newNodeContent ||
        `New ${ACT_LEVELS.find((l) => l.level === selectedLevel)?.name}`,
      parentId: newNodeParent || undefined,
    };

    setNodes([...nodes, newNode]);
    setShowAddModal(false);
    setSelectedLevel(null);
  };

  const deleteNode = (nodeId: string) => {
    const deleteRecursive = (id: string): string[] => {
      const children = nodes.filter((n) => n.parentId === id);
      return [id, ...children.flatMap((child) => deleteRecursive(child.id))];
    };

    const toDelete = deleteRecursive(nodeId);
    setNodes(nodes.filter((n) => !toDelete.includes(n.id)));
    setHoveredNode(null);
  };

  const startEdit = (node: Node) => {
    setEditingNode(node.id);
    setEditContent(node.content);
  };

  const saveEdit = () => {
    if (editingNode) {
      setNodes(
        nodes.map((n) =>
          n.id === editingNode ? { ...n, content: editContent } : n
        )
      );
      setEditingNode(null);
    }
  };

  const potentialParents =
    selectedLevel !== null
      ? nodes.filter((n) => n.level === selectedLevel + 1)
      : [];

  // Supabase functions
  const saveTree = async () => {
    if (!user) {
      alert("Please log in to save trees");
      return;
    }

    setSaving(true);
    try {
      const treeData = {
        user_id: user.id,
        name: `ACT Tree ${new Date().toLocaleDateString()}`,
        nodes: nodes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("act_trees")
        .insert([treeData])
        .select()
        .single();

      if (error) throw error;

      setCurrentTreeId(data.id);
      alert("Tree saved successfully!");
    } catch (error) {
      console.error("Error saving tree:", error);
      alert("Failed to save tree");
    } finally {
      setSaving(false);
    }
  };

  const loadTrees = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("act_trees")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setSavedTrees(data || []);
      setShowTreeSelector(true);
    } catch (error) {
      console.error("Error loading trees:", error);
      alert("Failed to load trees");
    } finally {
      setLoading(false);
    }
  };

  const loadTree = async (treeId: string) => {
    try {
      const { data, error } = await supabase
        .from("act_trees")
        .select("*")
        .eq("id", treeId)
        .single();

      if (error) throw error;

      setNodes(data.nodes);
      setCurrentTreeId(treeId);
      setShowTreeSelector(false);
    } catch (error) {
      console.error("Error loading tree:", error);
      alert("Failed to load tree");
    }
  };

  const updateTree = async () => {
    if (!user || !currentTreeId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("act_trees")
        .update({
          nodes: nodes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentTreeId);

      if (error) throw error;

      alert("Tree updated successfully!");
    } catch (error) {
      console.error("Error updating tree:", error);
      alert("Failed to update tree");
    } finally {
      setSaving(false);
    }
  };

  // Check if user is authenticated
  useEffect(() => {
    if (user) {
      setSupabaseConnected(true);
    }
  }, [user]);

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">
              Astral-Causal Tree
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Primordial programming → surface behavior
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={currentTreeId ? updateTree : saveTree}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
              disabled={!supabaseConnected || saving}
              title={
                !supabaseConnected
                  ? "Please log in to save"
                  : currentTreeId
                  ? "Update current tree"
                  : "Save new tree"
              }
            >
              <Download size={16} />{" "}
              {saving ? "Saving..." : currentTreeId ? "Update" : "Save"}
            </button>
            <button
              onClick={loadTrees}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition text-sm"
              disabled={!supabaseConnected || loading}
              title={
                !supabaseConnected
                  ? "Please log in to load"
                  : "Load saved trees"
              }
            >
              <Upload size={16} /> {loading ? "Loading..." : "Load"}
            </button>
            <div className="w-px bg-slate-700 mx-1" />
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
            >
              <Home size={18} />
            </button>
          </div>
        </div>
        {!supabaseConnected && (
          <div className="mt-2 text-xs text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded">
            ⚠️ Configure SUPABASE_URL and SUPABASE_ANON_KEY to enable database
            sync
          </div>
        )}
      </div>

      {/* Level Controls */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-400 text-sm mr-2">Add at level:</span>
          {ACT_LEVELS.map((level) => (
            <button
              key={level.level}
              onClick={() => openAddModal(level.level)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition whitespace-nowrap"
            >
              L{level.level}: {level.name}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-950">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            transform={`translate(${pan.x / zoom}, ${
              pan.y / zoom
            }) scale(${zoom})`}
          >
            {/* Level separators */}
            {ACT_LEVELS.map((level) => {
              const y = level.yPos * height;
              return (
                <g key={`level-${level.level}`}>
                  <line
                    x1={0}
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke="#334155"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    opacity={0.3}
                  />
                  <text
                    x={20}
                    y={y - 10}
                    fill="#64748b"
                    fontSize="11"
                    fontWeight="600"
                  >
                    LEVEL {level.level}: {level.name.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Connection lines */}
            {nodes.map((node) => {
              const parent = nodes.find((n) => n.id === node.parentId);
              if (!parent) return null;

              const childPos = getNodePosition(node);
              const parentPos = getNodePosition(parent);

              const isHighlighted =
                hoveredNode === node.id || hoveredNode === parent.id;

              return (
                <line
                  key={`line-${node.id}`}
                  x1={parentPos.x}
                  y1={parentPos.y + 18}
                  x2={childPos.x}
                  y2={childPos.y - 18}
                  stroke={isHighlighted ? "#10b981" : "#475569"}
                  strokeWidth={isHighlighted ? 3 : 2}
                  opacity={isHighlighted ? 0.8 : 0.4}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = getNodePosition(node);
              const levelInfo = ACT_LEVELS.find((l) => l.level === node.level);
              const isHovered = hoveredNode === node.id;

              return (
                <g
                  key={node.id}
                  className="node"
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Node circle */}
                  <circle
                    r={18}
                    fill={levelInfo?.color}
                    stroke={isHovered ? "#10b981" : "#64748b"}
                    strokeWidth={isHovered ? 3 : 2}
                    className="cursor-pointer transition-all duration-200"
                    filter={isHovered ? "url(#glow)" : undefined}
                  />

                  {/* Level number */}
                  <text
                    textAnchor="middle"
                    dy={5}
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {node.level}
                  </text>

                  {/* Content box */}
                  <foreignObject
                    x={-120}
                    y={25}
                    width={240}
                    height={100}
                    className="pointer-events-none"
                  >
                    <div className="text-center">
                      <div className="inline-block px-3 py-2 bg-slate-900 rounded border border-slate-700 shadow-lg max-w-full">
                        <div className="text-slate-200 text-xs leading-snug break-words">
                          {node.content}
                        </div>
                      </div>
                    </div>
                  </foreignObject>

                  {/* Controls on hover */}
                  {isHovered && (
                    <foreignObject
                      x={-60}
                      y={-45}
                      width={120}
                      height={35}
                      className="pointer-events-auto"
                    >
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(node);
                          }}
                          className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} color="white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={14} color="white" />
                        </button>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Edit Modal */}
      {editingNode && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-emerald-400 mb-4">
              Edit Node
            </h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 bg-slate-900 text-slate-100 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
              rows={4}
              placeholder="Node content..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={saveEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => setEditingNode(null)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && selectedLevel !== null && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-emerald-400 mb-2">
              Add Level {selectedLevel} Node
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {ACT_LEVELS.find((l) => l.level === selectedLevel)?.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Content
                </label>
                <textarea
                  value={newNodeContent}
                  onChange={(e) => setNewNodeContent(e.target.value)}
                  placeholder="Enter content..."
                  className="w-full p-3 bg-slate-900 text-slate-100 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  rows={3}
                  autoFocus
                />
              </div>

              {potentialParents.length > 0 && (
                <div>
                  <label className="block text-slate-300 text-sm mb-2">
                    Parent
                  </label>
                  <select
                    value={newNodeParent || ""}
                    onChange={(e) => setNewNodeParent(e.target.value || null)}
                    className="w-full p-2 bg-slate-900 text-slate-100 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none text-sm"
                  >
                    <option value="">None</option>
                    {potentialParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.content.substring(0, 50)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={addNode}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
              >
                <Plus size={16} /> Add
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tree Selector Modal */}
      {showTreeSelector && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-slate-700">
            <h3 className="text-xl font-bold text-emerald-400 mb-4">
              Load Saved Tree
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedTrees.map((tree) => (
                <div
                  key={tree.id}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded border border-slate-700 hover:border-emerald-500 transition"
                >
                  <div>
                    <div className="text-slate-100 font-medium">
                      {tree.name}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {new Date(tree.updated_at).toLocaleDateString()} •{" "}
                      {tree.nodes?.length || 0} nodes
                    </div>
                  </div>
                  <button
                    onClick={() => loadTree(tree.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition text-sm"
                  >
                    Load
                  </button>
                </div>
              ))}
              {savedTrees.length === 0 && (
                <div className="text-center text-slate-400 py-8">
                  No saved trees found
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowTreeSelector(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900 border-t border-slate-700 px-6 py-2 text-slate-400 text-xs flex justify-between">
        <div>
          Zoom: {(zoom * 100).toFixed(0)}% • {nodes.length} nodes
        </div>
        <div>Hover nodes to edit/delete • Drag to pan • Scroll to zoom</div>
      </div>
    </div>
  );
};

export default ACT;
