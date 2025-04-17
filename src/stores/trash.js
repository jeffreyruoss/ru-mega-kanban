import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

const TRASH_STORAGE_KEY = 'ru-mega-kanban-trash'
const LAST_EMPTIED_TRASH_KEY = 'ru-mega-kanban-last-emptied-trash'

export const useTrashStore = defineStore('trash', () => {
  // Initialize from localStorage or empty array
  const trashedItems = ref(loadFromLocalStorage())

  // Setup persistence
  watch(trashedItems, saveData, { deep: true })

  function loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(TRASH_STORAGE_KEY)
      return savedData ? JSON.parse(savedData) : { columns: [], blocks: [] }
    } catch (error) {
      console.error('Error loading trash data:', error)
      return { columns: [], blocks: [] }
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashedItems.value))
    } catch (error) {
      console.error('Error saving trash data:', error)
    }
  }

  async function saveToSupabase() {
    try {
      // Only attempt to save to Supabase if we have valid credentials
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Skipping Supabase save - no credentials configured')
        return
      }

      // Check if we have existing trash data
      const { data: existingData, error: fetchError } = await supabase
        .from('kanban_trash')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError) {
        console.warn('Error fetching existing trash data:', fetchError)
        // Continue anyway to try the insert
      }

      // Save trash data - update if exists, insert if not
      if (existingData && existingData.length > 0) {
        // Update existing data
        const { error: dataError } = await supabase
          .from('kanban_trash')
          .update({ data: trashedItems.value })
          .eq('id', existingData[0].id)

        if (dataError) {
          console.error('Error updating trash data:', dataError)

          // If update fails, try insert as fallback
          if (dataError.code === '42501') {
            // Permission denied error
            console.log('Attempting insert as fallback...')
            const { error: insertError } = await supabase
              .from('kanban_trash')
              .insert({ data: trashedItems.value })

            if (insertError) throw insertError
          } else {
            throw dataError
          }
        }
      } else {
        // Insert new data
        const { error: dataError } = await supabase
          .from('kanban_trash')
          .insert({ data: trashedItems.value })

        if (dataError) throw dataError
      }
    } catch (err) {
      console.error('Error saving trash data to Supabase:', err)
      // We'll still have the local data saved even if Supabase fails
    }
  }

  async function loadFromSupabase() {
    try {
      // Only attempt to load from Supabase if we have valid credentials
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Skipping Supabase load - no credentials configured')
        return
      }

      // Get trash data
      const { data, error: dataError } = await supabase
        .from('kanban_trash')
        .select('data')
        .order('created_at', { ascending: false })
        .limit(1)

      if (dataError) {
        console.warn('Trash data query error:', dataError)
        // Just continue with local data
        return
      }

      if (data && data.length > 0 && data[0].data) {
        trashedItems.value = data[0].data
        localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(data[0].data))
      }
    } catch (err) {
      console.error('Error loading trash data from Supabase:', err)
      // We'll continue with local data
    }
  }

  function saveData() {
    saveToLocalStorage()
    saveToSupabase()
  }

  function addTrashedColumn(column) {
    // Add deletion timestamp
    const trashedColumn = {
      ...column,
      deletedAt: new Date().toISOString(),
    }
    trashedItems.value.columns.unshift(trashedColumn)
  }

  function addTrashedBlock(block, columnId, columnTitle) {
    // Add deletion timestamp and column reference
    const trashedBlock = {
      ...block,
      sourceColumnId: columnId,
      sourceColumnTitle: columnTitle,
      deletedAt: new Date().toISOString(),
    }
    trashedItems.value.blocks.unshift(trashedBlock)
  }

  function restoreColumn(columnId) {
    const index = trashedItems.value.columns.findIndex((c) => c.id === columnId)
    if (index !== -1) {
      const column = trashedItems.value.columns.splice(index, 1)[0]
      // Remove the deletedAt property
      delete column.deletedAt
      return column
    }
    return null
  }

  function restoreBlock(blockId) {
    const index = trashedItems.value.blocks.findIndex((b) => b.id === blockId)
    if (index !== -1) {
      const block = trashedItems.value.blocks.splice(index, 1)[0]
      // Save the source column ID before removing it
      const sourceColumnId = block.sourceColumnId

      // Remove the deletedAt and source properties
      delete block.deletedAt
      delete block.sourceColumnId
      delete block.sourceColumnTitle

      // Return both the block and its original column ID
      return {
        block,
        sourceColumnId,
      }
    }
    return null
  }

  function clearTrash() {
    trashedItems.value = { columns: [], blocks: [] }
  }

  function deleteItemPermanently(id, type) {
    if (type === 'column') {
      const index = trashedItems.value.columns.findIndex((c) => c.id === id)
      if (index !== -1) {
        trashedItems.value.columns.splice(index, 1)
        return true
      }
    } else if (type === 'block') {
      const index = trashedItems.value.blocks.findIndex((b) => b.id === id)
      if (index !== -1) {
        trashedItems.value.blocks.splice(index, 1)
        return true
      }
    }
    return false
  }

  function cleanupOldTrashItems() {
    // Check if we've already done cleanup today
    const lastEmptied = localStorage.getItem(LAST_EMPTIED_TRASH_KEY)
    const today = new Date().toDateString()

    if (lastEmptied === today) {
      // Already cleaned up today, skip
      return false
    }

    // Track if anything was deleted
    let anyItemsDeleted = false
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Filter out columns older than 30 days
    const initialColumnsCount = trashedItems.value.columns.length
    trashedItems.value.columns = trashedItems.value.columns.filter((column) => {
      if (!column.deletedAt) return true

      const deletedDate = new Date(column.deletedAt)
      return deletedDate > thirtyDaysAgo
    })

    // Filter out blocks older than 30 days
    const initialBlocksCount = trashedItems.value.blocks.length
    trashedItems.value.blocks = trashedItems.value.blocks.filter((block) => {
      if (!block.deletedAt) return true

      const deletedDate = new Date(block.deletedAt)
      return deletedDate > thirtyDaysAgo
    })

    // Check if any items were deleted
    anyItemsDeleted =
      initialColumnsCount > trashedItems.value.columns.length ||
      initialBlocksCount > trashedItems.value.blocks.length

    // Save the date we did the cleanup
    if (anyItemsDeleted) {
      localStorage.setItem(LAST_EMPTIED_TRASH_KEY, today)
      saveData() // Persist changes to localStorage and Supabase
    }

    return anyItemsDeleted
  }

  return {
    trashedItems,
    addTrashedColumn,
    addTrashedBlock,
    restoreColumn,
    restoreBlock,
    clearTrash,
    deleteItemPermanently,
    loadFromSupabase,
    cleanupOldTrashItems,
  }
})
