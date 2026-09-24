import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, type VNode } from 'vue';

import App from '@/App.vue';
import { ITEMS_LOAD_DELAY_MS } from '@/api/itemsApi';
import { type TreeRow } from '@/grid/buildTreeRows';

import { createTreeItems, type Item } from './fixtures/treeItems';

vi.mock('@/api/itemsApi', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/itemsApi')>();
  return { ...original, fetchItems: vi.fn() };
});

const { fetchItems } = await import('@/api/itemsApi');
const fetchItemsMock = vi.mocked(fetchItems);

const renderRow = (row: TreeRow<Item>): VNode[] => [
  h('div', { 'data-row-label': '' }, String(row.label)),
  ...(row.children ?? []).flatMap(renderRow),
];

const AgGridStub = defineComponent({
  name: 'AgGridVue',
  props: { rowData: { type: Array, default: () => [] }, loading: { type: Boolean, default: false } },
  setup(props) {
    return () =>
      h('div', { class: 'ag-grid-stub', 'data-loading': String(props.loading) }, [
        ...(props.rowData as TreeRow<Item>[]).flatMap(renderRow),
      ]);
  },
});

const mountApp = () =>
  mount(App, {
    global: {
      stubs: { AgGridVue: AgGridStub },
    },
  });

const rowLabels = (wrapper: { findAll: (selector: string) => { text: () => string }[] }): string[] =>
  wrapper.findAll('[data-row-label]').map((node) => node.text());

describe('App / загрузка данных', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchItemsMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(createTreeItems()), ITEMS_LOAD_DELAY_MS)),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    fetchItemsMock.mockReset();
  });

  it('инициализирует пустое хранилище и показывает загрузку', async () => {
    const wrapper = mountApp();

    await nextTick();

    expect(wrapper.findComponent(AgGridStub).props('loading')).toBe(true);
    expect(wrapper.findComponent(AgGridStub).props('rowData')).toEqual([]);
  });

  it('подставляет данные через setItems и обновляет таблицу без перезагрузки', async () => {
    const wrapper = mountApp();

    await vi.advanceTimersByTimeAsync(ITEMS_LOAD_DELAY_MS);
    await flushPromises();
    await nextTick();

    expect(fetchItemsMock).toHaveBeenCalledTimes(1);
    expect(wrapper.findComponent(AgGridStub).props('loading')).toBe(false);
    expect(rowLabels(wrapper)).toEqual([
      'Айтем 1',
      'Айтем 2',
      'Айтем 4',
      'Айтем 7',
      'Айтем 8',
      'Айтем 5',
      'Айтем 6',
      'Айтем 3',
    ]);
  });
});
