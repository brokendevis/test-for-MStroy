import { describe, expect, it } from 'vitest';

import { TreeStore } from '@/store/TreeStore';
import type { ItemId } from '@/store/types';

import { createItem, createTreeItems, expandedOrderWithoutRoot, type Item } from './fixtures/treeItems';

const ids = (items: readonly { id: ItemId }[]): ItemId[] => items.map((item) => item.id);
const labels = (items: readonly Item[]): string[] => items.map((item) => item.label);

describe('TreeStore / getAll', () => {
  it('возвращает все элементы в порядке исходного массива', () => {
    const items = createTreeItems();
    const store = new TreeStore(items);

    expect(store.getAll()).toHaveLength(8);
    expect(store.getAll()).toEqual(items);
  });

  it('создаёт пустое хранилище, если массив не передан', () => {
    expect(new TreeStore().getAll()).toEqual([]);
    expect(new TreeStore([]).getAll()).toEqual([]);
  });

  it('возвращает копию массива, а не внутреннее состояние', () => {
    const store = new TreeStore(createTreeItems());

    store.getAll().pop();

    expect(store.getAll()).toHaveLength(8);
  });
});

describe('TreeStore / getItem', () => {
  it('возвращает сам объект элемента из хранилища', () => {
    const items = createTreeItems();
    const store = new TreeStore(items);

    expect(store.getItem(4)).toBe(items[3]);
    expect(store.getItem('91064cef')?.label).toBe('Айтем 2');
  });

  it('возвращает undefined для неизвестного id', () => {
    const store = new TreeStore(createTreeItems());

    expect(store.getItem(999)).toBeUndefined();
    expect(store.getItem('нет такого id')).toBeUndefined();
  });

  it('различает числовые и строковые id', () => {
    const store = new TreeStore([createItem(1, null, 'число 1'), createItem('1', null, 'строка 1')]);

    expect(store.getItem(1)?.label).toBe('число 1');
    expect(store.getItem('1')?.label).toBe('строка 1');
  });
});

describe('TreeStore / getChildren', () => {
  it('возвращает прямых детей в порядке добавления', () => {
    const store = new TreeStore(createTreeItems());

    expect(labels(store.getChildren(1))).toEqual(['Айтем 2', 'Айтем 3']);
    expect(labels(store.getChildren('91064cef'))).toEqual(['Айтем 4', 'Айтем 5', 'Айтем 6']);
    expect(ids(store.getChildren(4))).toEqual([7, 8]);
  });

  it('возвращает пустой массив для элемента без детей', () => {
    const store = new TreeStore(createTreeItems());

    expect(store.getChildren(7)).toEqual([]);
  });

  it('возвращает пустой массив для неизвестного id', () => {
    const store = new TreeStore(createTreeItems());

    expect(store.getChildren(999)).toEqual([]);
  });

  it('возвращает копию массива детей', () => {
    const store = new TreeStore(createTreeItems());

    store.getChildren(1).push(createItem(100, 1));
    store.getChildren('91064cef').length = 0;

    expect(store.getChildren(1)).toHaveLength(2);
    expect(store.getChildren('91064cef')).toHaveLength(3);
    expect(store.getAll()).toHaveLength(8);
  });

  it('отдаёт детей по id родителя, даже если родителя ещё нет в хранилище', () => {
    const store = new TreeStore([createItem('ребёнок', 'ещё-не-добавлен')]);

    expect(labels(store.getChildren('ещё-не-добавлен'))).toEqual(['Айтем ребёнок']);
  });
});

describe('TreeStore / getAllChildren', () => {
  it('возвращает всех потомков в порядке развёрнутого дерева', () => {
    const store = new TreeStore(createTreeItems());

    expect(ids(store.getAllChildren(1))).toEqual(expandedOrderWithoutRoot);
  });

  it('обходит только поддерево указанного элемента и не включает сам элемент', () => {
    const store = new TreeStore(createTreeItems());

    expect(ids(store.getAllChildren(4))).toEqual([7, 8]);
    expect(ids(store.getAllChildren('91064cef'))).toEqual([4, 7, 8, 5, 6]);
  });

  it('возвращает пустой массив для листа и для неизвестного id', () => {
    const store = new TreeStore(createTreeItems());

    expect(store.getAllChildren(7)).toEqual([]);
    expect(store.getAllChildren(999)).toEqual([]);
  });

  it('обходит глубокое дерево без переполнения стека', () => {
    const depth = 10_000;
    const store = new TreeStore(
      Array.from({ length: depth }, (_, index) => createItem(index, index === 0 ? null : index - 1)),
    );

    expect(store.getAllChildren(0)).toHaveLength(depth - 1);
  });

  it('не зацикливается на некорректных данных с циклом', () => {
    const store = new TreeStore([createItem('a', 'b'), createItem('b', 'a')]);

    expect(ids(store.getAllChildren('a'))).toEqual(['b']);
  });
});

describe('TreeStore / getAllParents', () => {
  it('возвращает цепочку от элемента до корня', () => {
    const store = new TreeStore(createTreeItems());

    expect(ids(store.getAllParents(7))).toEqual([7, 4, '91064cef', 1]);
    expect(ids(store.getAllParents(3))).toEqual([3, 1]);
  });

  it('для корневого элемента возвращает массив из него самого', () => {
    const store = new TreeStore(createTreeItems());

    expect(ids(store.getAllParents(1))).toEqual([1]);
  });

  it('возвращает пустой массив для неизвестного id', () => {
    const store = new TreeStore(createTreeItems());

    expect(store.getAllParents(999)).toEqual([]);
  });

  it('останавливается, если родителя нет в хранилище', () => {
    const store = new TreeStore([createItem('a', 'missing')]);

    expect(ids(store.getAllParents('a'))).toEqual(['a']);
  });

  it('не зацикливается на некорректных данных с циклом', () => {
    const store = new TreeStore([createItem('a', 'b'), createItem('b', 'a')]);

    expect(ids(store.getAllParents('a'))).toEqual(['a', 'b']);
  });
});

describe('TreeStore / setItems', () => {
  it('полностью заменяет ранее загруженные данные', () => {
    const store = new TreeStore(createTreeItems());

    store.setItems([createItem('a', null), createItem('b', 'a')]);

    expect(ids(store.getAll())).toEqual(['a', 'b']);
    expect(store.getItem(1)).toBeUndefined();
    expect(store.getChildren('91064cef')).toEqual([]);
    expect(ids(store.getChildren('a'))).toEqual(['b']);
    expect(ids(store.getAllParents('b'))).toEqual(['b', 'a']);
  });

  it('пустой массив очищает хранилище', () => {
    const store = new TreeStore(createTreeItems());

    store.setItems([]);

    expect(store.getAll()).toEqual([]);
    expect(store.getItem(1)).toBeUndefined();
    expect(store.getChildren(1)).toEqual([]);
  });

  it('пересобирает индексы без дублей при повторной установке тех же данных', () => {
    const items = createTreeItems();
    const store = new TreeStore(items);

    store.setItems(items);

    expect(store.getAll()).toHaveLength(8);
    expect(store.getChildren(1)).toHaveLength(2);
    expect(store.getAllChildren(1)).toHaveLength(7);
  });
});

describe('TreeStore / addItem', () => {
  it('добавляет элемент в хранилище и к родителю', () => {
    const store = new TreeStore(createTreeItems());

    store.addItem(createItem(9, 8, 'Айтем 9'));

    expect(store.getAll()).toHaveLength(9);
    expect(labels(store.getChildren(8))).toEqual(['Айтем 9']);
    expect(ids(store.getAllParents(9))).toEqual([9, 8, 4, '91064cef', 1]);
  });

  it('добавляет корневой элемент', () => {
    const store = new TreeStore(createTreeItems());

    store.addItem(createItem('root-2', null, 'Второй корень'));

    expect(ids(store.getAllParents('root-2'))).toEqual(['root-2']);
    expect(store.getAll()).toHaveLength(9);
  });

  it('заменяет элемент с существующим id, не создавая дублей', () => {
    const store = new TreeStore(createTreeItems());

    store.addItem(createItem(3, 1, 'Айтем 3 (новый)'));

    expect(store.getAll()).toHaveLength(8);
    expect(store.getItem(3)?.label).toBe('Айтем 3 (новый)');
    expect(labels(store.getChildren(1))).toEqual(['Айтем 2', 'Айтем 3 (новый)']);
  });

  it('переносит элемент к новому родителю при повторном добавлении', () => {
    const store = new TreeStore(createTreeItems());

    store.addItem(createItem(7, 5, 'Айтем 7'));

    expect(ids(store.getChildren(5))).toEqual([7]);
    expect(ids(store.getChildren(4))).toEqual([8]);
    expect(ids(store.getAllParents(7))).toEqual([7, 5, '91064cef', 1]);
  });

  it('встраивает элемент в дерево после добавления его родителя', () => {
    const store = new TreeStore([createItem('parent', null, 'Родитель')]);

    store.addItem(createItem('child', 'parent', 'Ребёнок'));

    expect(labels(store.getChildren('parent'))).toEqual(['Ребёнок']);
    expect(ids(store.getAllChildren('parent'))).toEqual(['child']);
  });
});

describe('TreeStore / removeItem', () => {
  it('удаляет элемент вместе со всем поддеревом', () => {
    const store = new TreeStore(createTreeItems());

    store.removeItem(4);

    expect(store.getAll()).toHaveLength(5);
    expect(store.getItem(4)).toBeUndefined();
    expect(store.getItem(7)).toBeUndefined();
    expect(store.getItem(8)).toBeUndefined();
    expect(store.getAllChildren(4)).toEqual([]);
  });

  it('убирает удалённый элемент из списка детей родителя', () => {
    const store = new TreeStore(createTreeItems());

    store.removeItem('91064cef');

    expect(labels(store.getChildren(1))).toEqual(['Айтем 3']);
    expect(store.getAll()).toHaveLength(2);
  });

  it('удаляет лист, не затрагивая братьев', () => {
    const store = new TreeStore(createTreeItems());

    store.removeItem(7);

    expect(ids(store.getChildren(4))).toEqual([8]);
    expect(store.getAll()).toHaveLength(7);
  });

  it('удаление корня очищает дерево', () => {
    const store = new TreeStore(createTreeItems());

    store.removeItem(1);

    expect(store.getAll()).toEqual([]);
    expect(store.getAllChildren(1)).toEqual([]);
  });

  it('ничего не делает для неизвестного id', () => {
    const store = new TreeStore(createTreeItems());

    store.removeItem(999);

    expect(store.getAll()).toHaveLength(8);
  });
});

describe('TreeStore / updateItem', () => {
  it('обновляет поля элемента, сохраняя ссылку в хранилище', () => {
    const items = createTreeItems();
    const store = new TreeStore(items);
    const target = items[3];

    store.updateItem({ id: 4, parent: '91064cef', label: 'Айтем 4 (обновлён)' });

    expect(store.getItem(4)).toBe(target);
    expect(store.getItem(4)?.label).toBe('Айтем 4 (обновлён)');
    expect(store.getItem(4)?.parent).toBe('91064cef');
  });

  it('переносит элемент к новому родителю', () => {
    const store = new TreeStore(createTreeItems());

    store.updateItem(createItem(7, 5, 'Айтем 7'));

    expect(ids(store.getChildren(5))).toEqual([7]);
    expect(ids(store.getChildren(4))).toEqual([8]);
    expect(ids(store.getAllParents(7))).toEqual([7, 5, '91064cef', 1]);
    expect(ids(store.getAllChildren(5))).toEqual([7]);
  });

  it('делает элемент корневым при parent: null', () => {
    const store = new TreeStore(createTreeItems());

    store.updateItem(createItem('91064cef', null, 'Айтем 2'));

    expect(ids(store.getAllParents('91064cef'))).toEqual(['91064cef']);
    expect(labels(store.getChildren(1))).toEqual(['Айтем 3']);
  });

  it('ничего не делает для неизвестного id', () => {
    const store = new TreeStore(createTreeItems());

    store.updateItem(createItem(999, null, 'нет такого'));

    expect(store.getAll()).toHaveLength(8);
    expect(store.getItem(999)).toBeUndefined();
  });

  it('обновляет данные, не ломая связи между элементами', () => {
    const store = new TreeStore(createTreeItems());

    store.updateItem(createItem(4, '91064cef', 'Айтем 4 (обновлён)'));

    expect(ids(store.getChildren('91064cef'))).toEqual([4, 5, 6]);
    expect(ids(store.getAllChildren('91064cef'))).toEqual([4, 7, 8, 5, 6]);
    expect(ids(store.getAllParents(8))).toEqual([8, 4, '91064cef', 1]);
  });
});

describe('TreeStore / публичная точка входа', () => {
  it('доступен как именованный и как default экспорт из src/index.ts', async () => {
    const module = await import('@/index');

    expect(module.TreeStore).toBe(TreeStore);
    expect(module.default).toBe(TreeStore);
  });
});
