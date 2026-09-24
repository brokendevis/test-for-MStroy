import { describe, expect, it } from 'vitest';

import { buildTreeRows, rowId, type TreeRow } from '@/grid/buildTreeRows';
import { TreeStore } from '@/store/TreeStore';
import type { ItemId } from '@/store/types';

import { createItem, createTreeItems, expandedOrder, type Item } from './fixtures/treeItems';

const flatten = (rows: readonly TreeRow<Item>[]): ItemId[] => {
  const result: ItemId[] = [];
  const stack = [...rows].reverse();

  let row = stack.pop();
  while (row !== undefined) {
    result.push(row.id);

    const children = row.children;
    if (children !== undefined) {
      for (let i = children.length - 1; i >= 0; i -= 1) {
        const child = children[i];
        if (child !== undefined) {
          stack.push(child);
        }
      }
    }

    row = stack.pop();
  }

  return result;
};

describe('buildTreeRows', () => {
  it('строит один корень с вложенными детьми в порядке хранилища', () => {
    const rows = buildTreeRows(new TreeStore(createTreeItems()));

    expect(rows.map((row) => row.id)).toEqual([1]);
    expect(rows[0]?.children?.map((row) => row.id)).toEqual(['91064cef', 3]);
    expect(rows[0]?.children?.[0]?.children?.map((row) => row.id)).toEqual([4, 5, 6]);
    expect(rows[0]?.children?.[0]?.children?.[0]?.children?.map((row) => row.id)).toEqual([7, 8]);
    expect(rows[0]?.children?.[0]?.children?.[0]?.children?.[0]?.children).toBeUndefined();
  });

  it('даёт обход в глубину, совпадающий с макетом задания', () => {
    const rows = buildTreeRows(new TreeStore(createTreeItems()));

    expect(flatten(rows)).toEqual(expandedOrder);
  });

  it('отдаёт копии строк и не мутирует элементы хранилища', () => {
    const items = createTreeItems();
    const store = new TreeStore(items);
    const rows = buildTreeRows(store);

    expect(rows[0]).not.toBe(items[0]);
    expect(items[0]).not.toHaveProperty('children');
    expect(store.getItem(1)).not.toHaveProperty('children');
  });

  it('сохраняет произвольные поля элементов', () => {
    const rows = buildTreeRows(new TreeStore(createTreeItems()));

    expect(rows[0]?.label).toBe('Айтем 1');
    expect(rows[0]?.children?.[0]?.label).toBe('Айтем 2');
  });

  it('делает корнями элементы без родителя и элементы с отсутствующим родителем', () => {
    const store = new TreeStore([createItem('orphan', 'missing', 'Сирота'), createItem('root', null, 'Корень')]);

    const rows = buildTreeRows(store);

    expect(rows.map((row) => row.id)).toEqual(['orphan', 'root']);
  });

  it('перестраивается после изменений в хранилище', () => {
    const store = new TreeStore(createTreeItems());

    store.removeItem(4);
    store.addItem(createItem('new', '91064cef', 'Айтем новый'));

    const rows = buildTreeRows(store);

    expect(rows[0]?.children?.[0]?.children?.map((row) => row.id)).toEqual([5, 6, 'new']);
  });

  it('не смешивает числовые и строковые id в идентификаторах строк', () => {
    expect(rowId(1)).toBe('n:1');
    expect(rowId('1')).toBe('s:1');
    expect(rowId(1)).not.toBe(rowId('1'));
  });
});
