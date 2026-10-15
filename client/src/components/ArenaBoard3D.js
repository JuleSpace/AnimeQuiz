import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Float,
  Html,
  OrbitControls,
  SoftShadows,
  Sparkles
} from '@react-three/drei';
import { BOARD_SIZE, ITEM_MAP } from './pokeArenaData';

/** Grille hex flat-top style Kanto Tactics / TFT. */
const buildSlots = () => {
  const size = 0.92;
  const w = size * Math.sqrt(3);
  const slots = [];
  const pushRow = (side, rowIndex, z, cols = 4) => {
    const odd = rowIndex % 2 === 1;
    const offset = odd ? w * 0.5 : 0;
    const startX = -((cols - 1) * w) / 2;
    for (let col = 0; col < cols; col += 1) {
      slots.push({
        side,
        index: rowIndex * 4 + col,
        x: startX + col * w + offset,
        z,
        size
      });
    }
  };
  pushRow('enemy', 0, -3.5);
  pushRow('enemy', 1, -2.15);
  pushRow('ally', 0, 2.15);
  pushRow('ally', 1, 3.5);
  return slots;
};

const SLOTS = buildSlots();

function HexMesh({ size, selected, occupied, enemy, placing, showBuy }) {
  const top = enemy
    ? occupied ? '#c4a06a' : '#a88858'
    : selected || placing
      ? '#d8c45a'
      : occupied
        ? '#5cb86e'
        : '#4a9a5c';
  const side = enemy ? '#6a5230' : '#2d6a3a';
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[size, size, 0.2, 6]} />
        <meshStandardMaterial
          color={top}
          roughness={0.55}
          metalness={0.08}
          emissive={selected || placing ? '#b89620' : '#000000'}
          emissiveIntensity={selected || placing ? 0.4 : 0}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <cylinderGeometry args={[size * 1.01, size * 1.06, 0.16, 6]} />
        <meshStandardMaterial color={side} roughness={0.9} />
      </mesh>
      {showBuy && (
        <Html center position={[0, 0.85, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="rook-buy-tag">Buy!</div>
        </Html>
      )}
    </group>
  );
}

function UnitMarker({ unit, fx, onHover, enemy }) {
  if (!unit) return null;
  const items = (unit.items || []).map((id) => ITEM_MAP[id]).filter(Boolean);
  const src = unit.anim || unit.pixel || unit.art;
  return (
    <Float speed={fx === 'strike' ? 7 : 1.6} rotationIntensity={0.03} floatIntensity={fx === 'hit' ? 1.5 : 0.3}>
      <Html
        transform
        position={[0, 1.28, 0]}
        distanceFactor={8}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
        zIndexRange={[140, 0]}
      >
        <div
          className={`rook-unit${enemy ? ' is-enemy' : ''} star-${unit.star}${fx ? ` fx-${fx}` : ''}`}
          onMouseEnter={() => onHover?.(unit)}
          onMouseLeave={() => onHover?.(null)}
        >
          <div className="rook-unit-aura" />
          <img
            src={src}
            alt={unit.name}
            draggable={false}
            onError={(e) => {
              if (unit.pixel && e.currentTarget.src !== unit.pixel) e.currentTarget.src = unit.pixel;
              else if (unit.art) e.currentTarget.src = unit.art;
            }}
          />
          <div className="rook-unit-plate">
            <span className="rook-stars">{'★'.repeat(unit.star)}</span>
            <strong>{unit.name}</strong>
            {!!items.length && (
              <span className="rook-item-row">
                {items.map((item) => <i key={item.id} title={item.name}>{item.icon}</i>)}
              </span>
            )}
          </div>
        </div>
      </Html>
    </Float>
  );
}

function ArenaGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#2a4a28" roughness={1} />
      </mesh>
      {/* Demi-plateau allié (herbe) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 2.6]} receiveShadow>
        <planeGeometry args={[11, 5.2]} />
        <meshStandardMaterial color="#4f9a55" roughness={0.85} />
      </mesh>
      {/* Demi-plateau ennemi (terre) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -2.6]} receiveShadow>
        <planeGeometry args={[11, 5.2]} />
        <meshStandardMaterial color="#9a7a4a" roughness={0.9} />
      </mesh>
      {/* Ligne de séparation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[10.5, 0.55]} />
        <meshStandardMaterial color="#6a8ab0" transparent opacity={0.45} metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[8.3, 8.7, 64]} />
        <meshStandardMaterial color="#d4b06a" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CameraRig({ fighting }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || !fighting) return;
    const t = state.clock.elapsedTime;
    ref.current.target.x = Math.sin(t * 0.3) * 0.25;
    ref.current.update();
  });
  return (
    <OrbitControls
      ref={ref}
      enablePan={false}
      minPolarAngle={0.7}
      maxPolarAngle={1.05}
      minAzimuthAngle={-0.4}
      maxAzimuthAngle={0.4}
      minDistance={11}
      maxDistance={16}
      target={[0, 0.4, 0.35]}
      enableDamping
      dampingFactor={0.08}
    />
  );
}

function BoardScene({
  board,
  enemyBoard,
  selectedUid,
  placing,
  fxMap,
  stage,
  onCellClick,
  onHoverUnit
}) {
  const cells = useMemo(() => SLOTS, []);

  return (
    <>
      <SoftShadows size={16} samples={10} focus={0.7} />
      <color attach="background" args={['#1a2e1c']} />
      <fog attach="fog" args={['#3a5a3a', 16, 36]} />
      <Environment preset="forest" />

      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={[8, 14, 5]}
        intensity={1.4}
        shadow-mapSize={[2048, 2048]}
        color="#fff4d8"
      />
      <hemisphereLight args={['#b8d8ff', '#3a5a2a', 0.5]} />

      <ArenaGround />
      <Sparkles count={22} scale={[12, 2.5, 12]} size={2} speed={0.2} opacity={0.28} color="#e8ffc8" />

      {cells.map((cell) => {
        const list = cell.side === 'ally' ? board : enemyBoard;
        const unit = list[cell.index];
        const isSelected = cell.side === 'ally' && unit?.uid === selectedUid;
        const isPlaceTarget = cell.side === 'ally' && !unit && placing;
        const canClick = stage === 'prep' && cell.side === 'ally';
        return (
          <group
            key={`${cell.side}-${cell.index}`}
            position={[cell.x, 0, cell.z]}
            onClick={(e) => {
              e.stopPropagation();
              if (canClick) onCellClick?.(cell.index);
            }}
          >
            <HexMesh
              size={cell.size}
              selected={isSelected}
              occupied={!!unit}
              enemy={cell.side === 'enemy'}
              placing={isPlaceTarget}
              showBuy={isPlaceTarget}
            />
            <UnitMarker
              unit={unit}
              enemy={cell.side === 'enemy'}
              fx={unit ? fxMap[unit.uid] : null}
              onHover={onHoverUnit}
            />
          </group>
        );
      })}

      <ContactShadows position={[0, -0.28, 0]} opacity={0.45} scale={20} blur={2.6} far={10} />
      <CameraRig fighting={stage === 'fight'} />
    </>
  );
}

export default function ArenaBoard3D(props) {
  const {
    board,
    enemyBoard,
    selectedUid,
    placing,
    fxMap,
    stage,
    onCellClick,
    onHoverUnit
  } = props;
  const safeBoard = board?.length === BOARD_SIZE ? board : Array(BOARD_SIZE).fill(null);
  const safeEnemy = enemyBoard?.length === BOARD_SIZE ? enemyBoard : Array(BOARD_SIZE).fill(null);

  return (
    <div className="rook-stage">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 12.2, 10.8], fov: 34, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <BoardScene
            board={safeBoard}
            enemyBoard={safeEnemy}
            selectedUid={selectedUid}
            placing={placing}
            fxMap={fxMap}
            stage={stage}
            onCellClick={onCellClick}
            onHoverUnit={onHoverUnit}
          />
        </Suspense>
      </Canvas>
      <div className="rook-stage-hint">Glisser · zoomer · hex TFT</div>
    </div>
  );
}
