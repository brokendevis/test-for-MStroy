import { afterAll, describe, expect, it } from 'vitest';

import { TreeStore } from '@/store/TreeStore';

interface PerfItem {
  id: number;
  parent: number | null;
  label: string;
}

const ITEM_COUNT = ((): number => {
  const raw = Number(process.env['PERF_ITEMS']);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 200_000;
})();

const DEPTH = 50_000;

const BRANCHING = 10;

const buildItems = (count: number, branch: number): PerfItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    parent: index === 0 ? null : Math.floor((index - 1) / branch),
    label: `Айтем ${index}`,
  }));

const buildChain = (count: number): PerfItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    parent: index === 0 ? null : index - 1,
    label: `Айтем ${index}`,
  }));

const shuffle = <T>(list: T[]): T[] => {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = list[i];
    const b = list[j];
    if (a !== undefined && b !== undefined) {
      list[i] = b;
      list[j] = a;
    }
  }
  return list;
};

const metrics: Record<string, number> = {};

const measure = (name: string, operation: () => void): number => {
  const start = performance.now();
  operation();
  const ms = performance.now() - start;
  metrics[name] = ms;
  console.log(`${name}: ${ms.toFixed(2)} ms`);
  return ms;
};

afterAll(() => {
  console.table(Object.entries(metrics).map(([operation, ms]) => ({ operation, ms: ms.toFixed(2) })));
});

describe(`TreeStore / производительность (${ITEM_COUNT} элементов)`, () => {
  const items = shuffle(buildItems(ITEM_COUNT, BRANCHING));
  const store = new TreeStore<PerfItem>();

  it('setItems — один проход по массиву', () => {
    const ms = measure('setItems', () => store.setItems(items));

    expect(store.getAll()).toHaveLength(ITEM_COUNT);
    expect(ms).toBeLessThan(3000);
  }, 60_000);

  it('точечные выборки: getItem / getChildren / getAllParents', () => {
    expect(store.getItem(ITEM_COUNT - 1)).toBeDefined();

    expect(measure('getItem', () => void store.getItem(ITEM_COUNT - 1))).toBeLessThan(50);
    expect(measure('getChildren', () => void store.getChildren(0))).toBeLessThan(50);
    expect(measure('getAllParents', () => void store.getAllParents(ITEM_COUNT - 1))).toBeLessThan(50);
  }, 60_000);

  it('getAll — копия всего массива', () => {
    let size = 0;
    const ms = measure('getAll', () => {
      size = store.getAll().length;
    });

    expect(size).toBe(ITEM_COUNT);
    expect(ms).toBeLessThan(1000);
  }, 60_000);

  it('getAllChildren — полный обход дерева', () => {
    let visited = 0;
    const ms = measure('getAllChildren', () => {
      visited = store.getAllChildren(0).length;
    });

    expect(visited).toBe(ITEM_COUNT - 1);
    expect(ms).toBeLessThan(3000);
  }, 60_000);

  it('addItem / updateItem / removeItem одного элемента', () => {
    const added: PerfItem = { id: ITEM_COUNT + 1, parent: 0, label: 'временный' };

    expect(measure('addItem', () => store.addItem(added))).toBeLessThan(50);
    expect(measure('updateItem', () => store.updateItem({ ...added, label: 'обновлённый' }))).toBeLessThan(50);
    expect(measure('removeItem (лист)', () => store.removeItem(added.id))).toBeLessThan(50);

    expect(store.getAll()).toHaveLength(ITEM_COUNT);
    expect(store.getItem(added.id)).toBeUndefined();
  }, 60_000);

  it(`${DEPTH} уровней вложенности обходятся без переполнения стека`, () => {
    const deepStore = new TreeStore<PerfItem>();
    const chain = buildChain(DEPTH);

    expect(measure('setItems (цепочка)', () => deepStore.setItems(chain))).toBeLessThan(3000);

    let visited = 0;
    const ms = measure('getAllChildren (цепочка)', () => {
      visited = deepStore.getAllChildren(0).length;
    });
    expect(ms).toBeLessThan(3000);
    expect(measure('getAllParents (цепочка)', () => void deepStore.getAllParents(DEPTH - 1))).toBeLessThan(100);

    expect(visited).toBe(DEPTH - 1);
  }, 60_000);
});
