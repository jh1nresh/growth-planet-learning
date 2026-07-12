import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {useEffect, useMemo, useRef, useState} from 'react';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import {marbleDependencies, marbleTopicById, marbleTopics, getDirectPrerequisites, getDirectUnlocks, getPrerequisiteCount} from '../../lib/marbleTaxonomy';
import type {Topic} from '../../types';
import {getConnectedTopicIds, getTopicAtIndex} from './marbleGraphInteraction';
import {buildMarbleGraphLayout, type MarbleGraphNode} from './marbleGraphLayout';
import {selectionShouldClear, toggleVisibleSubject, type LearningSubject} from './subjectFilter';

const graph = buildMarbleGraphLayout(marbleTopics, marbleDependencies);
const positionByTopicId = new Map(graph.nodes.map((node) => [node.topic.id, node.position]));
const subjectColors: Record<'Mathematics' | 'English', THREE.Color> = {
  Mathematics: new THREE.Color('#f4c95d'),
  English: new THREE.Color('#65d1e7'),
};
const subjectLabels = {Mathematics: '數學', English: '英文'} as const;

function canCreateWebGLContext() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function GraphControls() {
  const {camera, gl, invalidate} = useThree();
  const controls = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const next = new OrbitControls(camera, gl.domElement);
    next.enableDamping = true;
    next.dampingFactor = 0.07;
    next.enablePan = true;
    next.minDistance = 18;
    next.maxDistance = 90;
    const requestRender = () => invalidate();
    next.addEventListener('change', requestRender);
    controls.current = next;
    invalidate();
    return () => {
      next.removeEventListener('change', requestRender);
      next.dispose();
    };
  }, [camera, gl, invalidate]);

  useFrame(() => controls.current?.update());
  return null;
}

function GraphAtmosphere() {
  const starPositions = useMemo(() => {
    const positions: number[] = [];
    for (let index = 0; index < 180; index += 1) {
      const angle = index * 2.399963;
      const radius = 28 + (index % 13) * 3.4;
      positions.push(
        Math.cos(angle) * radius,
        ((index * 17) % 49) - 24,
        Math.sin(angle) * radius - 16,
      );
    }
    return new Float32Array(positions);
  }, []);

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d7c08a" size={0.12} transparent opacity={0.42} depthWrite={false} />
      </points>
      <mesh rotation={[1.2, 0.2, 0.34]} position={[0, -2, -18]}>
        <torusGeometry args={[24, 0.025, 4, 160]} />
        <meshBasicMaterial color="#927a4d" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[1.02, -0.35, -0.18]} position={[0, -1, -22]}>
        <torusGeometry args={[34, 0.018, 4, 160]} />
        <meshBasicMaterial color="#406f72" transparent opacity={0.22} />
      </mesh>
    </>
  );
}

interface TaxonomyGraphProps {
  nodes: MarbleGraphNode[];
  selectedTopicId: string | null;
  onHover: (topic: Topic | null) => void;
  onSelect: (topic: Topic) => void;
}

function TaxonomyGraph({nodes, selectedTopicId, onHover, onSelect}: TaxonomyGraphProps) {
  const nodeIndex = useMemo(() => new Map(nodes.map((node, index) => [node.topic.id, index])), [nodes]);
  const positions = useMemo(() => new Float32Array(nodes.flatMap((node) => node.position)), [nodes]);
  const colors = useMemo(() => {
    const connected = getConnectedTopicIds(selectedTopicId, graph.edges);
    return new Float32Array(nodes.flatMap((node) => {
      const base = subjectColors[node.topic.subject as LearningSubject];
      const dimmed = selectedTopicId && !connected.has(node.topic.id);
      const color = dimmed ? base.clone().multiplyScalar(0.2) : base;
      return [color.r, color.g, color.b];
    }));
  }, [nodes, selectedTopicId]);
  const edgeGeometry = useMemo(() => {
    const vertices: number[] = [];
    for (const edge of graph.edges) {
      if (!nodeIndex.has(edge.topicId) || !nodeIndex.has(edge.prerequisiteId)) continue;
      const from = positionByTopicId.get(edge.prerequisiteId);
      const to = positionByTopicId.get(edge.topicId);
      if (from && to) vertices.push(...from, ...to);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [nodeIndex]);
  const selectedPosition = selectedTopicId ? positionByTopicId.get(selectedTopicId) : undefined;

  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);

  const topicFromIndex = (index: number | undefined) => {
    return getTopicAtIndex(nodes, index);
  };

  return (
    <>
      <color attach="background" args={['#08090b']} />
      <fog attach="fog" args={['#070c0d', 48, 92]} />
      <ambientLight intensity={0.8} />
      <GraphAtmosphere />
      <lineSegments geometry={edgeGeometry} frustumCulled={false}>
        <lineBasicMaterial color="#71808c" transparent opacity={selectedTopicId ? 0.12 : 0.28} />
      </lineSegments>
      <points
        frustumCulled={false}
        onPointerMove={(event) => {
          event.stopPropagation();
          onHover(topicFromIndex(event.index));
        }}
        onPointerOut={() => onHover(null)}
        onClick={(event) => {
          event.stopPropagation();
          const topic = topicFromIndex(event.index);
          if (topic) onSelect(topic);
        }}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.72} sizeAttenuation vertexColors transparent opacity={1} depthTest={false} />
      </points>
      {selectedPosition ? (
        <mesh position={selectedPosition}>
          <sphereGeometry args={[0.62, 18, 18]} />
          <meshBasicMaterial color="#fff4c2" wireframe />
        </mesh>
      ) : null}
      <GraphControls />
    </>
  );
}

function RelationList({title, items, onSelect}: {
  title: string;
  items: ReturnType<typeof getDirectPrerequisites>;
  onSelect: (topic: Topic) => void;
}) {
  return (
    <section className="taxonomy-relations">
      <h3>{title} <span>{items.length}</span></h3>
      {items.length ? (
        <ul>{items.map(({edge, topic}) => (
          <li key={topic.id}>
            <button type="button" onClick={() => onSelect(topic)}>{topic.name}</button>
            <p>{edge.reason}</p>
          </li>
        ))}</ul>
      ) : <p className="empty-relation">沒有直接連結</p>}
    </section>
  );
}

export function MarbleTaxonomyExplorer() {
  const [visibleSubjects, setVisibleSubjects] = useState<Set<LearningSubject>>(new Set(['Mathematics', 'English']));
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<Topic | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [webglLost, setWebglLost] = useState(false);
  const [webglAvailable] = useState(canCreateWebGLContext);
  const visibleNodes = useMemo(
    () => graph.nodes.filter((node) => visibleSubjects.has(node.topic.subject as LearningSubject)),
    [visibleSubjects],
  );
  const prerequisites = selectedTopic ? getDirectPrerequisites(selectedTopic.id) : [];
  const unlocks = selectedTopic ? getDirectUnlocks(selectedTopic.id) : [];

  const toggleSubject = (subject: LearningSubject) => {
    setVisibleSubjects((current) => toggleVisibleSubject(current, subject));
    if (selectionShouldClear(selectedTopic?.subject, subject, visibleSubjects)) setSelectedTopic(null);
  };

  const selectTopic = (topic: Topic) => {
    setVisibleSubjects((current) => new Set(current).add(topic.subject as LearningSubject));
    setSelectedTopic(topic);
  };

  useEffect(() => {
    if (!canvasElement) return;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglLost(true);
    };
    canvasElement.addEventListener('webglcontextlost', handleContextLost);
    return () => canvasElement.removeEventListener('webglcontextlost', handleContextLost);
  }, [canvasElement]);

  const canvasFallback = (
    <div className="taxonomy-canvas-fallback" role="status">
      <strong>3D 技能圖暫時無法顯示</strong>
      <span>仍可用上方的概念選單探索數學與英文；重新整理可再次載入 3D 圖。</span>
    </div>
  );

  return (
    <section className="taxonomy-explorer" aria-label="Marble 形式的 3D 技能圖">
      <div className="taxonomy-intro">
        <h1><em>萬象</em>學圖</h1>
        <span className="taxonomy-intro-lede">探索數學與英文的 {visibleNodes.length} 個學習概念</span>
      </div>

      <div className="taxonomy-subjects" aria-label="切換顯示科目">
        {(['Mathematics', 'English'] as const).map((subject) => (
          <button
            key={subject}
            type="button"
            className={visibleSubjects.has(subject) ? 'is-active' : ''}
            aria-pressed={visibleSubjects.has(subject)}
            onClick={() => toggleSubject(subject)}
          >
            <i style={{background: `#${subjectColors[subject].getHexString()}`}} />
            <span>
              <strong>{subject === 'Mathematics' ? '數學原野' : '英文潮港'}</strong>
            </span>
          </button>
        ))}
        <label className="taxonomy-keyboard-picker">
          <span>搜尋學習座標</span>
          <select
            value={selectedTopic && visibleSubjects.has(selectedTopic.subject as LearningSubject) ? selectedTopic.id : ''}
            onChange={(event) => {
              const topic = marbleTopicById.get(event.target.value);
              if (topic) selectTopic(topic);
              else setSelectedTopic(null);
            }}
          >
            <option value="">輸入或選擇一個概念…</option>
            {visibleNodes.map((node) => <option key={node.topic.id} value={node.topic.id}>{node.topic.name}</option>)}
          </select>
        </label>
      </div>

      <div className="taxonomy-canvas" aria-label="可拖曳旋轉的 3D 技能圖">
        {!webglAvailable || webglLost ? canvasFallback : (
          <Canvas
            dpr={1}
            frameloop="demand"
            fallback={canvasFallback}
            gl={{antialias: false, powerPreference: 'low-power'}}
            camera={{position: [0, 6, 58], fov: 48}}
            onCreated={({gl}) => setCanvasElement(gl.domElement)}
            onPointerMissed={() => setSelectedTopic(null)}
          >
            <TaxonomyGraph
              nodes={visibleNodes}
              selectedTopicId={selectedTopic?.id ?? null}
              onHover={setHoveredTopic}
              onSelect={selectTopic}
            />
          </Canvas>
        )}
        <div className="taxonomy-age-axis" aria-hidden="true">
          <span>12 歲</span><span>10</span><span>8</span><span>6</span><span>4 歲</span>
        </div>
        <p className="taxonomy-controls">拖曳 · 縮放 · 點選概念</p>
        {hoveredTopic ? <div className="taxonomy-tooltip"><strong>{hoveredTopic.name}</strong><span>{subjectLabels[hoveredTopic.subject as LearningSubject]} · {hoveredTopic.domain}</span></div> : null}
      </div>

      {selectedTopic ? (
        <aside className="taxonomy-detail" aria-labelledby="taxonomy-detail-title">
          <button className="taxonomy-detail-close" type="button" aria-label="關閉概念詳情" onClick={() => setSelectedTopic(null)}>×</button>
          <span className="taxonomy-topic-meta">
            <i style={{background: `#${subjectColors[selectedTopic.subject as LearningSubject].getHexString()}`}} />
            {subjectLabels[selectedTopic.subject as LearningSubject]} · {selectedTopic.domain} · {selectedTopic.ageRangeStart}–{selectedTopic.ageRangeEnd} 歲
          </span>
          <h2 id="taxonomy-detail-title">{selectedTopic.name}</h2>
          <p>{selectedTopic.description}</p>
          <div className="taxonomy-prerequisite-count"><strong>{getPrerequisiteCount(selectedTopic.id)}</strong><span>個完整先修概念</span></div>
          <section className="taxonomy-evidence">
            <h3>掌握證據</h3>
            <ul>{selectedTopic.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul>
          </section>
          <RelationList title="先修概念" items={prerequisites} onSelect={selectTopic} />
          <RelationList title="後續概念" items={unlocks} onSelect={selectTopic} />
        </aside>
      ) : null}

      <a className="taxonomy-attribution" href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noreferrer">
        Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · ODbL 1.0 / CC BY-SA 4.0
      </a>
    </section>
  );
}
