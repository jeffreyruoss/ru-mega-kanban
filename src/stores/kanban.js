import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useTrashStore } from './trash'

const STORAGE_KEY = 'ru-mega-kanban-data'
const PROJECT_NAME_KEY = 'ru-mega-kanban-project-name'

export const useKanbanStore = defineStore('kanban', () => {
  // Initialize from localStorage or empty array
  const columns = ref(loadFromLocalStorage())
  const isLoading = ref(false)
  const error = ref(null)
  const projectName = ref(localStorage.getItem(PROJECT_NAME_KEY) || 'Mega Kanban')
  let columnCount = getInitialColumnCount(columns.value)

  // Setup persistence
  watch(columns, saveData, { deep: true })
  watch(projectName, saveProjectName)

  // Load data from Supabase
  loadFromSupabase()

  async function loadFromSupabase() {
    try {
      isLoading.value = true
      error.value = null

      console.log('Supabase config:', {
        url: import.meta.env.VITE_SUPABASE_URL ? 'Set (masked)' : 'Not set',
        key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (masked)' : 'Not set',
      })

      // Get project name first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(1)

      if (projectError) {
        console.error('Project query error:', projectError)
        throw projectError
      }

      if (projectData && projectData.length > 0) {
        projectName.value = projectData[0].name
        localStorage.setItem(PROJECT_NAME_KEY, projectData[0].name)
      }

      // Get kanban data
      const { data, error: dataError } = await supabase
        .from('kanban_data')
        .select('data')
        .order('created_at', { ascending: false })
        .limit(1)

      if (dataError) {
        console.error('Kanban data query error:', dataError)
        throw dataError
      }

      if (data && data.length > 0) {
        columns.value = data[0].data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data[0].data))
        columnCount = getInitialColumnCount(columns.value)
      }
    } catch (err) {
      console.error('Error loading data from Supabase:', err)
      error.value = `Failed to load data from server: ${err.message || 'Unknown error'}. Using local data instead.`
    } finally {
      isLoading.value = false
    }
  }

  async function saveToSupabase() {
    try {
      error.value = null

      // Check if we have existing data
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)

      // Save project name - update if exists, insert if not
      if (existingProjects && existingProjects.length > 0) {
        // Update existing project
        const { error: projectError } = await supabase
          .from('projects')
          .update({ name: projectName.value })
          .eq('id', existingProjects[0].id)

        if (projectError) throw projectError
      } else {
        // Insert new project
        const { error: projectError } = await supabase
          .from('projects')
          .insert({ name: projectName.value })

        if (projectError) throw projectError
      }

      // Check if we have existing kanban data
      const { data: existingData } = await supabase
        .from('kanban_data')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)

      // Save kanban data - update if exists, insert if not
      if (existingData && existingData.length > 0) {
        // Update existing data
        const { error: dataError } = await supabase
          .from('kanban_data')
          .update({ data: columns.value })
          .eq('id', existingData[0].id)

        if (dataError) throw dataError
      } else {
        // Insert new data
        const { error: dataError } = await supabase
          .from('kanban_data')
          .insert({ data: columns.value })

        if (dataError) throw dataError
      }
    } catch (err) {
      console.error('Error saving data to Supabase:', err)
      error.value = `Failed to save data to server: ${err.message || 'Unknown error'}. Data saved locally only.`
    }
  }

  function loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      return savedData ? JSON.parse(savedData) : []
    } catch (error) {
      console.error('Error loading kanban data:', error)
      return []
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columns.value))
    } catch (error) {
      console.error('Error saving kanban data:', error)
    }
  }

  function saveProjectName() {
    localStorage.setItem(PROJECT_NAME_KEY, projectName.value)
    saveToSupabase()
  }

  function saveData() {
    saveToLocalStorage()
    saveToSupabase()
  }

  function getInitialColumnCount(cols) {
    // Find the highest column number to continue numbering
    if (!cols.length) return 0

    const columnNumbers = cols
      .map((col) => {
        const match = col.title.match(/Column (\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter((num) => !isNaN(num))

    return Math.max(0, ...columnNumbers)
  }

  function addColumn() {
    columnCount++
    columns.value.push({
      id: Date.now(),
      title: `Column ${columnCount}`,
      blocks: [
        {
          id: Date.now() + '-block',
          content: '',
        },
      ],
    })
  }

  function updateBlockContent(columnId, blockId, newContent) {
    const column = columns.value.find((c) => c.id === columnId)
    if (column) {
      const block = column.blocks.find((b) => b.id === blockId)
      if (block) {
        block.content = newContent
      }
    }
  }

  function updateBlockStyle(columnId, blockId, styleData) {
    const column = columns.value.find((c) => c.id === columnId)
    if (column) {
      const block = column.blocks.find((b) => b.id === blockId)
      if (block) {
        // Merge style data with block
        Object.assign(block, styleData)
      }
    }
  }

  function updateColumnTitle(columnId, newTitle) {
    const column = columns.value.find((c) => c.id === columnId)
    if (column) {
      column.title = newTitle
    }
  }

  function addBlockAfter(columnId, blockId) {
    const column = columns.value.find((c) => c.id === columnId)
    if (!column) return null

    const blockIndex = column.blocks.findIndex((b) => b.id === blockId)
    if (blockIndex !== -1) {
      const newBlock = {
        id: Date.now() + '-block',
        content: '',
      }
      // Insert the new block after the current block
      column.blocks.splice(blockIndex + 1, 0, newBlock)
      return newBlock
    }
    return null
  }

  function deleteBlock(columnId, blockId) {
    const column = columns.value.find((c) => c.id === columnId)
    if (column) {
      const blockIndex = column.blocks.findIndex((b) => b.id === blockId)
      if (blockIndex !== -1 && column.blocks.length > 1) {
        // Get the trash store
        const trashStore = useTrashStore()

        // Get block before removing it
        const block = column.blocks[blockIndex]

        // Add to trash
        trashStore.addTrashedBlock(block, columnId, column.title)

        // Remove from column
        column.blocks.splice(blockIndex, 1)
        return true
      }
    }
    return false
  }

  function deleteColumn(columnId) {
    const columnIndex = columns.value.findIndex((c) => c.id === columnId)
    if (columnIndex !== -1) {
      // Get the trash store
      const trashStore = useTrashStore()

      // Get column before removing it
      const column = columns.value[columnIndex]

      // Add to trash
      trashStore.addTrashedColumn(column)

      // Remove from columns
      columns.value.splice(columnIndex, 1)
      return true
    }
    return false
  }

  function reorderColumns(sourceIndex, targetIndex) {
    if (
      sourceIndex >= 0 &&
      sourceIndex < columns.value.length &&
      targetIndex >= 0 &&
      targetIndex < columns.value.length &&
      sourceIndex !== targetIndex
    ) {
      // Remove the column from its current position
      const [movedColumn] = columns.value.splice(sourceIndex, 1)
      // Insert it at the new position
      columns.value.splice(targetIndex, 0, movedColumn)
      return true
    }
    return false
  }

  function reorderBlocks(sourceColumnId, sourceBlockIndex, targetColumnId, targetBlockIndex) {
    // Find the source and target columns
    const sourceColumn = columns.value.find((col) => col.id === sourceColumnId)
    const targetColumn = columns.value.find((col) => col.id === targetColumnId)

    if (!sourceColumn || !targetColumn) return false

    // Ensure indices are valid
    if (
      sourceBlockIndex < 0 ||
      sourceBlockIndex >= sourceColumn.blocks.length ||
      targetBlockIndex < 0 ||
      targetBlockIndex > targetColumn.blocks.length // Allow appending at the end
    ) {
      return false
    }

    // Remove block from source column
    const [movedBlock] = sourceColumn.blocks.splice(sourceBlockIndex, 1)

    // Insert block into target column
    targetColumn.blocks.splice(targetBlockIndex, 0, movedBlock)

    return true
  }

  function restoreColumnFromTrash(column) {
    columns.value.push(column)
    return true
  }

  function restoreBlockToColumn(block, columnId) {
    const column = columns.value.find((c) => c.id === columnId)
    if (column) {
      column.blocks.push(block)
      return true
    }
    return false
  }

  return {
    columns,
    projectName,
    isLoading,
    error,
    addColumn,
    updateBlockContent,
    updateBlockStyle,
    updateColumnTitle,
    addBlockAfter,
    deleteBlock,
    deleteColumn,
    reorderColumns,
    reorderBlocks,
    loadFromSupabase,
    restoreColumnFromTrash,
    restoreBlockToColumn,
  }
})
