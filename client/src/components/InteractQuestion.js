import React, { useRef, useState } from 'react';

const itemLabel = (item, index) => {
  if (item?.text) return item.text;
  if (item?.imageUrl) return `Image ${index + 1}`;
  return `Élément ${index + 1}`;
};

const byId = (items) => {
  const map = new Map();
  (items || []).forEach((item) => map.set(item.id, item));
  return map;
};

export const ItemEditor = ({ items, onChange, withImages = true }) => {
  const update = (index, patch) => {
    const next = items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="order-editor">
      {items.map((item, index) => (
        <div key={item.id} className="order-editor-row">
          <span className="order-index">{index + 1}</span>
          <input
            className="input"
            placeholder="Texte"
            value={item.text}
            onChange={(event) => update(index, { text: event.target.value })}
          />
          {withImages && (
            <input
              className="input"
              placeholder="Lien d'image (optionnel)"
              value={item.imageUrl}
              onChange={(event) => update(index, { imageUrl: event.target.value })}
            />
          )}
          <button type="button" className="btn" style={{ margin: 0 }} onClick={() => move(index, index - 1)} disabled={index === 0}>↑</button>
          <button type="button" className="btn" style={{ margin: 0 }} onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>↓</button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ margin: 0 }}
            onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
          >
            ✕
          </button>
        </div>
      ))}
      {items.length < 8 && (
        <button
          type="button"
          className="btn"
          onClick={() => onChange([
            ...items,
            {
              id: `i${Date.now()}`,
              text: '',
              imageUrl: '',
              x: ((items.length + 1) / (items.length + 2)) * 100,
              y: 50
            }
          ])}
        >
          Ajouter un élément
        </button>
      )}
    </div>
  );
};

export const OrderAnswer = ({ items, onSubmit }) => {
  const [rows, setRows] = useState(items || []);
  const dragFrom = useRef(null);

  const move = (from, to) => {
    if (from == null || to == null || from === to) return;
    setRows((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <div className="order-play">
      <p className="blind-hint">Glisse les éléments pour les remettre dans l'ordre.</p>
      <div className="order-list">
        {rows.map((item, index) => (
          <div
            key={item.id}
            className="order-card"
            draggable
            onDragStart={() => { dragFrom.current = index; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              move(dragFrom.current, index);
              dragFrom.current = null;
            }}
          >
            <span className="order-index">{index + 1}</span>
            {item.imageUrl && <img src={item.imageUrl} alt="" />}
            <span>{itemLabel(item, index)}</span>
            <span className="order-move">
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); move(index, index - 1); }} disabled={index === 0}>↑</button>
              <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); move(index, index + 1); }} disabled={index === rows.length - 1}>↓</button>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-success" onClick={() => onSubmit(rows.map((item) => item.id))}>
        Valider l'ordre
      </button>
    </div>
  );
};

const chipStyle = (mode, place) => (
  mode === 'timeline'
    ? { left: `${place.x}%`, top: '50%' }
    : { left: `${place.x}%`, top: `${place.y}%` }
);

export const PlaceBoard = ({
  mode = 'timeline',
  imageUrl = '',
  items = [],
  places = [],
  readOnly = false,
  onChange
}) => {
  const boardRef = useRef(null);
  const catalog = byId(items);
  const placedIds = new Set(places.map((place) => place.id));
  const tray = items.filter((item) => !placedIds.has(item.id));

  const pointFromEvent = (event) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return {
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(10, Math.min(90, y))
    };
  };

  const moveItem = (id, event) => {
    if (readOnly || !onChange) return;
    const point = pointFromEvent(event);
    if (!point) {
      onChange(places.filter((place) => place.id !== id));
      return;
    }
    const next = { id, x: point.x, y: mode === 'timeline' ? 50 : point.y };
    const without = places.filter((place) => place.id !== id);
    onChange([...without, next]);
  };

  return (
    <div className="place-wrap">
      <div
        ref={boardRef}
        className={`place-board ${mode === 'schema' ? 'schema' : 'timeline'}`}
        style={mode === 'schema' && imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
      >
        {mode === 'timeline' && <div className="place-line" />}
        {places.map((place) => {
          const item = catalog.get(place.id);
          if (!item) return null;
          const index = items.findIndex((entry) => entry.id === place.id);
          return (
            <div
              key={place.id}
              className="place-chip"
              style={chipStyle(mode, place)}
              onPointerDown={(event) => {
                if (readOnly) return;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (readOnly || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
                moveItem(place.id, event);
              }}
              onPointerUp={(event) => moveItem(place.id, event)}
            >
              {item.imageUrl && <img src={item.imageUrl} alt="" />}
              <span>{itemLabel(item, index)}</span>
            </div>
          );
        })}
      </div>
      {tray.length > 0 && (
        <div className="place-tray">
          {tray.map((item) => {
            const index = items.findIndex((entry) => entry.id === item.id);
            return (
              <div
                key={item.id}
                className="place-chip tray"
                onPointerDown={(event) => {
                  if (readOnly) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerUp={(event) => moveItem(item.id, event)}
              >
                {item.imageUrl && <img src={item.imageUrl} alt="" />}
                <span>{itemLabel(item, index)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PlaceAnswer = ({ items, mode, imageUrl, onSubmit }) => {
  const [places, setPlaces] = useState([]);

  return (
    <div>
      <p className="blind-hint">
        {mode === 'schema'
          ? 'Glisse chaque élément sur le schéma.'
          : 'Glisse chaque élément sur la frise, du plus ancien au plus récent.'}
      </p>
      <PlaceBoard
        mode={mode}
        imageUrl={imageUrl}
        items={items}
        places={places}
        onChange={setPlaces}
      />
      <button type="button" className="btn btn-success" onClick={() => onSubmit(places)}>
        Valider le placement
      </button>
    </div>
  );
};

export const OrderReview = ({ items, ids, title }) => {
  const catalog = byId(items);
  const ordered = (ids == null ? (items || []).map((item) => item.id) : ids)
    .map((id) => catalog.get(id))
    .filter(Boolean);

  return (
    <div className="order-review">
      {title && <div className="order-review-title">{title}</div>}
      <div className="order-list">
        {ordered.map((item, index) => (
          <div key={item.id} className="order-card review">
            <span className="order-index">{index + 1}</span>
            {item.imageUrl && <img src={item.imageUrl} alt="" />}
            <span>{itemLabel(item, index)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
