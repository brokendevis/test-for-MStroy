import type { GridOptions } from 'ag-grid-community';

import type { Item } from '@/api/itemsApi';
import { rowId, type TreeRow } from '@/grid/buildTreeRows';
import { COLUMN_DEFS, ROW_NUMBER_COLUMN_ID } from '@/grid/columns';

export const TREE_DATA_CHILDREN_FIELD = 'children';

export const TREE_GRID_OPTIONS: GridOptions<TreeRow<Item>> = {
  treeData: true,
  treeDataChildrenField: TREE_DATA_CHILDREN_FIELD,
  treeDataDisplayType: 'custom',
  groupDefaultExpanded: -1,
  domLayout: 'autoHeight',
  getRowId: (params) => rowId(params.data.id),
  columnDefs: COLUMN_DEFS,
  defaultColDef: {
    sortable: false,
    resizable: false,
    suppressMovable: true,
    suppressHeaderMenuButton: true,
  },
  suppressCellFocus: true,
  rowHeight: 44,
  headerHeight: 48,
  onModelUpdated: (params) => {
    params.api.refreshCells({ columns: [ROW_NUMBER_COLUMN_ID], force: true });
  },
};
