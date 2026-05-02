import { useEffect, useState } from 'react';

/**
 * Returns `true` only after `flag` has been truthy for at least `delay` ms.
 * Used to suppress the brief flash of a loading skeleton when data arrives quickly.
 */
export default function useDelayedFlag(flag, delay = 150) {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!flag) {
      setDelayed(false);
      return undefined;
    }
    const id = setTimeout(() => setDelayed(true), delay);
    return () => clearTimeout(id);
  }, [flag, delay]);

  return delayed;
}
