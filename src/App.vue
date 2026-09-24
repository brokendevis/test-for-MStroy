<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { fetchItems, type Item } from '@/api/itemsApi';
import TreeTable from '@/components/TreeTable.vue';
import { useTreeStore } from '@/composables/useTreeStore';

const { store, rows } = useTreeStore<Item>();
const loading = ref(true);

onMounted(async () => {
  store.setItems(await fetchItems());
  loading.value = false;
});
</script>

<template>
  <main class="app-shell">
    <section class="app-card">
      <TreeTable :rows="rows" :loading="loading" />
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  padding: 40px;
}

.app-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.app-shell :deep(.ag-root-wrapper) {
  border: none;
}
</style>
