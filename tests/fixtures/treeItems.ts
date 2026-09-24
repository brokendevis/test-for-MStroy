import type { ItemId, TreeItem } from '@/store/types';

export interface Item extends TreeItem {
  label: string;
}

export const createItem = (id: ItemId, parent: ItemId | null, label = `Айтем ${String(id)}`): Item => ({
  id,
  parent,
  label,
});

export const createTreeItems = (): Item[] => [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cef', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cef', label: 'Айтем 4' },
  { id: 5, parent: '91064cef', label: 'Айтем 5' },
  { id: 6, parent: '91064cef', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
];

export const expandedOrder: ItemId[] = [1, '91064cef', 4, 7, 8, 5, 6, 3];

export const expandedOrderWithoutRoot: ItemId[] = expandedOrder.slice(1);
