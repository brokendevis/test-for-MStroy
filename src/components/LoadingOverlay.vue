<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ params?: { loadingMessage?: string } }>();

const message = computed(() => props.params?.loadingMessage ?? 'Загрузка данных…');
</script>

<template>
  <div class="loading-overlay">
    <span class="loading-overlay__spinner" aria-hidden="true" />
    <span class="loading-overlay__message">{{ message }}</span>
  </div>
</template>

<style scoped>
.loading-overlay {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 15px;
}

.loading-overlay__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: loading-overlay-spin 0.8s linear infinite;
}

@keyframes loading-overlay-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
