import { mount } from '@vue/test-utils';
import type { GetRowIdParams, ModelUpdatedEvent, ValueGetterFunc, ValueGetterParams } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import { describe, expect, it, vi } from 'vitest';

import LoadingOverlay from '@/components/LoadingOverlay.vue';
import TreeTable from '@/components/TreeTable.vue';
import { buildTreeRows, type TreeRow } from '@/grid/buildTreeRows';
import {
  CATEGORY_COLUMN_ID,
  CATEGORY_GROUP_CLASS,
  CATEGORY_GROUP_LABEL,
  CATEGORY_LEAF_CLASS,
  CATEGORY_LEAF_LABEL,
  categoryCellClass,
  categoryLabel,
  COLUMN_DEFS,
  hasChildren,
  LABEL_COLUMN_ID,
  ROW_NUMBER_COLUMN_ID,
  rowNumber,
} from '@/grid/columns';
import { TREE_DATA_CHILDREN_FIELD, TREE_GRID_OPTIONS } from '@/grid/gridOptions';
import { gridTheme } from '@/grid/gridTheme';
import { TreeStore } from '@/store/TreeStore';

import { createTreeItems, type Item } from './fixtures/treeItems';

const valueParams = (data?: TreeRow<Item>): ValueGetterParams<TreeRow<Item>> => ({ data }) as ValueGetterParams<TreeRow<Item>>;

const callValueGetter = (
  getter: string | ValueGetterFunc<TreeRow<Item>> | undefined,
  params: ValueGetterParams<TreeRow<Item>>,
): unknown => {
  if (typeof getter !== 'function') {
    throw new Error('valueGetter is not a function');
  }
  return getter(params);
};

const gridProp = (wrapper: { props: (key: string) => unknown }, key: string): unknown => wrapper.props(key);

describe('TreeTable / категории и нумерация', () => {
  it('различает группу и элемент по наличию детей', () => {
    const rows = buildTreeRows(new TreeStore(createTreeItems()));
    const group = rows[0];
    const leaf = rows[0]?.children?.[1];

    expect(hasChildren(group)).toBe(true);
    expect(hasChildren(leaf)).toBe(false);
    expect(hasChildren(undefined)).toBe(false);
    expect(categoryLabel(group)).toBe(CATEGORY_GROUP_LABEL);
    expect(categoryLabel(leaf)).toBe(CATEGORY_LEAF_LABEL);
    expect(categoryLabel(undefined)).toBe(CATEGORY_LEAF_LABEL);
    expect(categoryCellClass(group)).toBe(CATEGORY_GROUP_CLASS);
    expect(categoryCellClass(leaf)).toBe(CATEGORY_LEAF_CLASS);
  });

  it('считает порядковый номер строки с единицы', () => {
    expect(rowNumber(0)).toBe(1);
    expect(rowNumber(7)).toBe(8);
    expect(rowNumber(null)).toBe(0);
    expect(rowNumber(undefined)).toBe(0);
  });

  it('valueGetter колонок отдают текст категории и номер по индексу узла', () => {
    const rows = buildTreeRows(new TreeStore(createTreeItems()));
    expect(callValueGetter(COLUMN_DEFS[0]?.valueGetter, { node: { rowIndex: 4 } } as unknown as ValueGetterParams<TreeRow<Item>>)).toBe(5);
    expect(callValueGetter(COLUMN_DEFS[1]?.valueGetter, valueParams(rows[0]))).toBe('Группа');
    expect(callValueGetter(COLUMN_DEFS[1]?.valueGetter, valueParams(rows[0]?.children?.[1]))).toBe('Элемент');
  });
});

describe('TreeTable / конфигурация колонок', () => {
  it('идёт в порядке «№ п\п», «Категория», «Наименование»', () => {
    expect(COLUMN_DEFS.map((column) => column.colId)).toEqual([
      ROW_NUMBER_COLUMN_ID,
      CATEGORY_COLUMN_ID,
      LABEL_COLUMN_ID,
    ]);
    expect(COLUMN_DEFS.map((column) => column.headerName)).toEqual(['№ п\\п', 'Категория', 'Наименование']);
  });

  it('показывает дерево во второй колонке', () => {
    expect(COLUMN_DEFS[1]?.showRowGroup).toBe(true);
    expect(COLUMN_DEFS[1]?.cellRendererParams).toEqual({ suppressCount: true });
  });

  it('читает наименование из поля label и растягивает колонку', () => {
    expect(COLUMN_DEFS[2]?.field).toBe('label');
    expect(COLUMN_DEFS[2]?.flex).toBe(1);
  });
});

describe('TreeTable / опции грида', () => {
  it('включает tree data с вложенными записями и полным разворотом', () => {
    expect(TREE_GRID_OPTIONS.treeData).toBe(true);
    expect(TREE_GRID_OPTIONS.treeDataChildrenField).toBe(TREE_DATA_CHILDREN_FIELD);
    expect(TREE_GRID_OPTIONS.treeDataDisplayType).toBe('custom');
    expect(TREE_GRID_OPTIONS.groupDefaultExpanded).toBe(-1);
  });

  it('даёт строкам стабильные id без смешения типов', () => {
    const getRowId = TREE_GRID_OPTIONS.getRowId;

    expect(getRowId?.({ data: { id: 1 } } as unknown as GetRowIdParams<TreeRow<Item>>)).toBe('n:1');
    expect(getRowId?.({ data: { id: '1' } } as unknown as GetRowIdParams<TreeRow<Item>>)).toBe('s:1');
  });

  it('обновляет нумерацию при изменении модели', () => {
    const refreshCells = vi.fn();

    TREE_GRID_OPTIONS.onModelUpdated?.({ api: { refreshCells } } as unknown as ModelUpdatedEvent);

    expect(refreshCells).toHaveBeenCalledWith({ columns: [ROW_NUMBER_COLUMN_ID], force: true });
  });

  it('выдаёт тему Quartz с параметрами', () => {
    expect(gridTheme).toBeDefined();
    expect(typeof gridTheme.withParams).toBe('function');
  });
});

describe('TreeTable / монтирование', () => {
  it('передаёт строки, состояние загрузки, тему и overlay в AgGridVue', () => {
    const rows = buildTreeRows(new TreeStore(createTreeItems()));
    const wrapper = mount(TreeTable, {
      props: { rows, loading: true },
      global: { stubs: { AgGridVue: true } },
    });
    const grid = wrapper.findComponent(AgGridVue);

    expect(grid.exists()).toBe(true);
    expect(gridProp(grid, 'gridOptions')).toBe(TREE_GRID_OPTIONS);
    expect(gridProp(grid, 'rowData')).toEqual(rows);
    expect(gridProp(grid, 'loading')).toBe(true);
    expect(gridProp(grid, 'theme')).toBe(gridTheme);
    expect(gridProp(grid, 'loadingOverlayComponent')).toBe(LoadingOverlay);
  });

  it('стартует с пустыми строками и выключенной загрузкой', () => {
    const wrapper = mount(TreeTable, { global: { stubs: { AgGridVue: true } } });
    const grid = wrapper.findComponent(AgGridVue);

    expect(gridProp(grid, 'rowData')).toEqual([]);
    expect(gridProp(grid, 'loading')).toBe(false);
  });
});
