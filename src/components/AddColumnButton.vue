<script setup>
import { useKanbanStore } from '../stores/kanban'

const kanbanStore = useKanbanStore()

function addColumn() {
  kanbanStore.addColumn()
}
</script>

<template>
  <button
    @click="addColumn"
    class="opacity-70 hover:opacity-100 text-sm uppercase px-3 py-1 rounded-md text-white border-[1px] border-gray-700 hover:cursor-pointer"
  >
    + Add Column
  </button>
</template>
