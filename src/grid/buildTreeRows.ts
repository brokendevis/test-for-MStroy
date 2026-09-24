import type { TreeStore } from '@/store/TreeStore';
import type { ItemId, TreeItem } from '@/store/types';

export type TreeRow<T extends TreeItem> = T & { children?: TreeRow<T>[] };

export const rowId = (id: ItemId): string => (typeof id === 'number' ? `n:${id}` : `s:${id}`);

export const buildTreeRows = <T extends TreeItem>(store: TreeStore<T>): TreeRow<T>[] => {
  const rows: TreeRow<T>[] = [];
  const childrenByParent = new Map<ItemId, TreeRow<T>[]>();
  const knownIds = new Set<ItemId>();

  for (const item of store.getAll()) {
    const row: TreeRow<T> = { ...item };
    rows.push(row);
    knownIds.add(row.id);

    const parentId = row.parent;
    if (parentId === null) {
      continue;
    }

    const siblings = childrenByParent.get(parentId);
    if (siblings === undefined) {
      childrenByParent.set(parentId, [row]);
    } else {
      siblings.push(row);
    }
  }

  const roots: TreeRow<T>[] = [];

  for (const row of rows) {
    const children = childrenByParent.get(row.id);
    if (children !== undefined) {
      row.children = children;
    }

    const parentId = row.parent;
    if (parentId === null || !knownIds.has(parentId)) {
      roots.push(row);
    }
  }

  return roots;
};
