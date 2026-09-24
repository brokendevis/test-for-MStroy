import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { useTreeStore } from '@/composables/useTreeStore';

import { createItem, createTreeItems } from './fixtures/treeItems';

describe('useTreeStore', () => {
  it('начинает с пустого хранилища и пустого дерева', () => {
    const { store, rows } = useTreeStore();

    expect(store.getAll()).toEqual([]);
    expect(rows.value).toEqual([]);
  });

  it('пересчитывает строки после setItems', async () => {
    const { store, rows } = useTreeStore();

    store.setItems(createTreeItems());
    await nextTick();

    expect(rows.value).toHaveLength(1);
    expect(rows.value[0]?.children?.map((row) => row.id)).toEqual(['91064cef', 3]);
  });

  it('реагирует на addItem', async () => {
    const { store, rows } = useTreeStore(createTreeItems());

    store.addItem(createItem(9, 8, 'Айтем 9'));
    await nextTick();

    const row4 = rows.value[0]?.children?.[0]?.children?.[0];

    expect(row4?.children?.map((row) => row.id)).toEqual([7, 8]);
    expect(row4?.children?.[1]?.children?.map((row) => row.id)).toEqual([9]);
  });

  it('реагирует на updateItem со сменой родителя', async () => {
    const { store, rows } = useTreeStore(createTreeItems());

    store.updateItem(createItem(7, 3, 'Айтем 7'));
    await nextTick();

    expect(rows.value[0]?.children?.[1]?.children?.map((row) => row.id)).toEqual([7]);
  });

  it('реагирует на removeItem', async () => {
    const { store, rows } = useTreeStore(createTreeItems());

    store.removeItem('91064cef');
    await nextTick();

    expect(rows.value[0]?.children?.map((row) => row.id)).toEqual([3]);
  });

  it('не добавляет поле children в элементы хранилища', () => {
    const items = createTreeItems();
    const { store, rows } = useTreeStore(items);

    store.setItems(items);

    expect(rows.value[0]).not.toBe(items[0]);
    expect(items[0]).not.toHaveProperty('children');
  });
});
