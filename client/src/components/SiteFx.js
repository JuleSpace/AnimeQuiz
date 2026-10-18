import React, { useEffect, useState } from 'react';

// « 3, 2, 1, GO! » façon départ de niveau. Ne bloque rien : le chrono tourne déjà derrière.
const STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;

export const Countdown = ({ runId, onDone }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!runId) return undefined;
    setStep(0);
    const timers = STEPS.map((_, index) => setTimeout(() => setStep(index), index * STEP_MS));
    timers.push(setTimeout(() => {
      setStep(-1);
      if (onDone) onDone();
    }, STEPS.length * STEP_MS + 150));
    return () => timers.forEach(clearTimeout);
  }, [runId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!runId || step < 0) return null;
  const label = STEPS[step];
  return (
    <div className="ce-count" aria-live="polite">
      <span key={label} className={label === 'GO!' ? 'is-go' : ''}>{label}</span>
    </div>
  );
};
