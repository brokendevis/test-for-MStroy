import { readFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchItems, ITEMS_LOAD_DELAY_MS, ITEMS_URL, type Item } from '@/api/itemsApi';
import { TreeStore } from '@/store/TreeStore';

const payload: Item[] = [{ id: 1, parent: null, label: 'Айтем 1' }];

const jsonResponse = (body: unknown): Response =>
  ({
    json: async () => body,
  }) as unknown as Response;

describe('itemsApi / fetchItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('держит искусственную задержку ровно две секунды', () => {
    expect(ITEMS_LOAD_DELAY_MS).toBe(2000);
  });

  it('загружает данные через fetch по умолчанию из /items.json', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(payload));
    vi.stubGlobal('fetch', fetchMock);

    const pending = fetchItems();
    await vi.advanceTimersByTimeAsync(ITEMS_LOAD_DELAY_MS);

    await expect(pending).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(ITEMS_URL);
  });

  it('не отдаёт данные раньше двух секунд', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(payload)));

    let resolved = false;
    const pending = fetchItems().then((items) => {
      resolved = true;
      return items;
    });

    await vi.advanceTimersByTimeAsync(ITEMS_LOAD_DELAY_MS - 1);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toEqual(payload);
    expect(resolved).toBe(true);
  });

  it('держит паузу, даже если ответ пришёл раньше', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return jsonResponse(payload);
      }),
    );

    const pending = fetchItems();
    await vi.advanceTimersByTimeAsync(ITEMS_LOAD_DELAY_MS);

    await expect(pending).resolves.toEqual(payload);
  });

  it('позволяет переопределить url', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(payload));
    vi.stubGlobal('fetch', fetchMock);

    const pending = fetchItems('/custom/items.json');
    await vi.advanceTimersByTimeAsync(ITEMS_LOAD_DELAY_MS);
    await pending;

    expect(fetchMock).toHaveBeenCalledWith('/custom/items.json');
  });
});

describe('public/items.json', () => {
  it('лежит в public и содержит массив из условия задания', () => {
    const items = JSON.parse(readFileSync('public/items.json', 'utf8')) as Item[];
    const store = new TreeStore(items);

    expect(items).toHaveLength(8);
    expect(store.getAllChildren(1).map((item) => item.label)).toEqual([
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
