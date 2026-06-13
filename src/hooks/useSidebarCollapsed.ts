import { useCallback, useState } from 'react';
import { z } from 'zod';

import { readStored, writeStored } from '@/services/storage';

const SIDEBAR_KEY = 'orbit.sidebar-collapsed';

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(
    () => readStored(SIDEBAR_KEY, z.boolean()) ?? false,
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeStored(SIDEBAR_KEY, next);
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
