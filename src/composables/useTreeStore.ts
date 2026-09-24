import { computed, reactive, type ComputedRef } from 'vue';

import { buildTreeRows, type TreeRow } from '@/grid/buildTreeRows';
import { TreeStore } from '@/store/TreeStore';
import type { TreeItem } from '@/store/types';

export interface UseTreeStoreResult<T extends TreeItem> {
  store: TreeStore<T>;
  rows: ComputedRef<TreeRow<T>[]>;
}

export const useTreeStore = <T extends TreeItem>(initial: readonly T[] = []): UseTreeStoreResult<T> => {
  const store = reactive(new TreeStore<T>(initial)) as TreeStore<T>;
  const rows = computed(() => buildTreeRows(store));

  return { store, rows };
};
