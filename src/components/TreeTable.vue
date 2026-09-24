<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3';

import type { Item } from '@/api/itemsApi';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import '@/grid/agGridSetup';
import type { TreeRow } from '@/grid/buildTreeRows';
import { TREE_GRID_OPTIONS } from '@/grid/gridOptions';
import { gridTheme } from '@/grid/gridTheme';

withDefaults(defineProps<{ rows?: TreeRow<Item>[]; loading?: boolean }>(), {
  rows: () => [],
  loading: false,
});
</script>

<template>
  <AgGridVue
    class="tree-table"
    :grid-options="TREE_GRID_OPTIONS"
    :row-data="rows"
    :loading="loading"
    :theme="gridTheme"
    :loading-overlay-component="LoadingOverlay"
  />
</template>

<style scoped>
.tree-table {
  width: 100%;
}

.tree-table :deep(.ag-row-group) {
  font-weight: 600;
}

.tree-table :deep(.category-cell--leaf) {
  color: #7b8289;
}
</style>
