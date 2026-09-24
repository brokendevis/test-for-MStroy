import type { ColDef } from 'ag-grid-community';

import type { Item } from '@/api/itemsApi';
import type { TreeRow } from '@/grid/buildTreeRows';

export const ROW_NUMBER_COLUMN_ID = 'rowNumber';
export const CATEGORY_COLUMN_ID = 'category';
export const LABEL_COLUMN_ID = 'label';

export const CATEGORY_GROUP_LABEL = 'Группа';
export const CATEGORY_LEAF_LABEL = 'Элемент';

export const CATEGORY_GROUP_CLASS = 'category-cell--group';
export const CATEGORY_LEAF_CLASS = 'category-cell--leaf';

export const hasChildren = (row?: TreeRow<Item>): boolean => (row?.children?.length ?? 0) > 0;

export const categoryLabel = (row?: TreeRow<Item>): string =>
  hasChildren(row) ? CATEGORY_GROUP_LABEL : CATEGORY_LEAF_LABEL;

export const categoryCellClass = (row?: TreeRow<Item>): string =>
  hasChildren(row) ? CATEGORY_GROUP_CLASS : CATEGORY_LEAF_CLASS;

export const rowNumber = (rowIndex?: number | null): number => (rowIndex ?? -1) + 1;

export const COLUMN_DEFS: ColDef<TreeRow<Item>>[] = [
  {
    colId: ROW_NUMBER_COLUMN_ID,
    headerName: '№ п\\п',
    width: 90,
    valueGetter: (params) => rowNumber(params.node?.rowIndex),
  },
  {
    colId: CATEGORY_COLUMN_ID,
    headerName: 'Категория',
    width: 310,
    showRowGroup: true,
    valueGetter: (params) => categoryLabel(params.data),
    cellClass: (params) => categoryCellClass(params.data),
    cellRendererParams: { suppressCount: true },
  },
  {
    colId: LABEL_COLUMN_ID,
    field: 'label',
    headerName: 'Наименование',
    flex: 1,
  },
];
