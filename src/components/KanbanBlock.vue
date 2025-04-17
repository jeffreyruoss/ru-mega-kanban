<script setup>
import { defineProps, defineEmits, ref, defineExpose, onMounted, watch } from 'vue'
import { useTextareaAutosize } from '@vueuse/core'

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
  columnId: {
    type: [Number, String],
    required: true,
  },
  blockIndex: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits([
  'update:content',
  'add-block-after',
  'drag-start',
  'delete-block',
  'navigate-up',
  'navigate-down',
  'update:style',
])

const textareaRef = ref(null)
const isWarningText = ref(false)

// Set up textarea autosizing with VueUse
const { textarea, input } = useTextareaAutosize({
  input: props.block.content || '',
  element: textareaRef,
})

// Update the textarea value when it changes from parent
watch(
  () => props.block.content,
  (newContent) => {
    input.value = newContent || ''
  },
  { immediate: true },
)

// When input changes, emit update to parent
watch(input, (newValue) => {
  emit('update:content', newValue)
})

function handleKeydown(event) {
  if (event.key === 'Tab') {
    handleTabKey(event)
  } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    handleCommandEnter(event)
  } else if (event.key === 'Delete' && (event.metaKey || event.ctrlKey)) {
    handleCommandDelete(event)
  } else if (event.key === 'Backspace' && (event.metaKey || event.ctrlKey)) {
    // For Mac keyboards, Backspace is often labeled as Delete
    handleCommandDelete(event)
  } else if (event.key === 'ArrowUp') {
    handleArrowUp(event)
  } else if (event.key === 'ArrowDown') {
    handleArrowDown(event)
  } else if (event.key === 'i' && (event.metaKey || event.ctrlKey)) {
    // Handle Cmd/Ctrl + i to toggle warning text
    handleCommandI(event)
  }
}

// Handle tab indentation
function handleTabKey(event) {
  event.preventDefault()
  const start = event.target.selectionStart
  const end = event.target.selectionEnd
  const value = event.target.value

  // If text is selected
  if (start !== end) {
    // Get the selected text and surrounding content
    const beforeSelection = value.substring(0, start)
    const selectedText = value.substring(start, end)
    const afterSelection = value.substring(end)

    // Split selected text into lines
    const lines = selectedText.split('\n')

    let modifiedText
    let newSelectionStart = start

    if (event.shiftKey) {
      // Remove tab from beginning of each line if shift is pressed (unindent)
      modifiedText = lines
        .map((line) => {
          if (line.startsWith('\t')) {
            return line.substring(1)
          } else {
            return line
          }
        })
        .join('\n')

      // Calculate new selection position
      newSelectionStart = Math.max(start - (start > 0 && beforeSelection.endsWith('\n') ? 0 : 1), 0)
    } else {
      // Add tab to each line (indent)
      modifiedText = lines.map((line) => '\t' + line).join('\n')
    }

    // Combine everything back together
    const newContent = beforeSelection + modifiedText + afterSelection
    input.value = newContent

    // Adjust selection
    setTimeout(() => {
      event.target.selectionStart = event.shiftKey ? newSelectionStart : start
      event.target.selectionEnd = start + modifiedText.length
    }, 0)
  } else {
    // No text selected - work with single line or cursor position
    if (event.shiftKey) {
      // If shift key is pressed, try to remove a tab from the beginning of the line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const beforeLine = value.substring(0, lineStart)
      const currentLine = value.substring(
        lineStart,
        value.indexOf('\n', start) > -1 ? value.indexOf('\n', start) : value.length,
      )
      const afterCurrentLine =
        value.indexOf('\n', start) > -1 ? value.substring(value.indexOf('\n', start)) : ''

      // Check if the line starts with a tab
      if (currentLine.startsWith('\t')) {
        const newLine = currentLine.substring(1)
        const newContent = beforeLine + newLine + afterCurrentLine
        input.value = newContent

        // Adjust cursor position
        setTimeout(() => {
          event.target.selectionStart = event.target.selectionEnd = Math.max(start - 1, lineStart)
        }, 0)
      }
    } else {
      // Insert tab at cursor position (existing behavior)
      const newContent = value.substring(0, start) + '\t' + value.substring(end)
      input.value = newContent

      // Move cursor position after the inserted tab
      setTimeout(() => {
        event.target.selectionStart = event.target.selectionEnd = start + 1
      }, 0)
    }
  }
}

// Handle Cmd/Ctrl + Enter to add a new block
function handleCommandEnter(event) {
  event.preventDefault()
  emit('add-block-after')
}

// Handle Cmd/Ctrl + Delete to delete a block
function handleCommandDelete(event) {
  event.preventDefault()
  emit('delete-block')
}

// Handle Cmd/Ctrl + i to toggle warning text
function handleCommandI(event) {
  event.preventDefault()
  isWarningText.value = !isWarningText.value

  // Emit event to update block styling in the store
  emit('update:style', { isWarningText: isWarningText.value })
}

// Handle up arrow key to navigate to previous block
function handleArrowUp(event) {
  const textarea = event.target
  const value = textarea.value
  const cursorPosition = textarea.selectionStart

  // Check if cursor is on the first line
  const isFirstLine = value.lastIndexOf('\n', cursorPosition - 1) === -1

  if (isFirstLine) {
    // Emit event to navigate to previous block
    emit('navigate-up', { blockIndex: props.blockIndex, columnId: props.columnId })
  }
}

// Handle down arrow key to navigate to next block
function handleArrowDown(event) {
  const textarea = event.target
  const value = textarea.value
  const cursorPosition = textarea.selectionStart

  // Check if cursor is on the last line
  const nextNewlinePos = value.indexOf('\n', cursorPosition)
  const isLastLine = nextNewlinePos === -1

  if (isLastLine) {
    // Emit event to navigate to next block
    emit('navigate-down', { blockIndex: props.blockIndex, columnId: props.columnId })
  }
}

function focus() {
  textareaRef.value?.focus()
}

// Initialize warning text state from block data
onMounted(() => {
  isWarningText.value = props.block.isWarningText || false
})

function handleDragStart(event) {
  // Set data for the drag operation
  event.dataTransfer.setData(
    'text/plain',
    JSON.stringify({
      columnId: props.columnId,
      blockIndex: props.blockIndex,
    }),
  )
  event.dataTransfer.effectAllowed = 'move'

  // Add a class to the element being dragged
  event.target.closest('.block-container').classList.add('dragging')

  // Emit event for parent component to handle
  emit('drag-start', event)
}

function handleDragEnd(event) {
  // Remove dragging class
  event.target.closest('.block-container').classList.remove('dragging')
}

defineExpose({
  focus,
})
</script>

<template>
  <div class="block-container mb-3 relative group">
    <div
      class="drag-handle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-70 hover:opacity-100 focus-within:opacity-70 absolute top-1 left-1 w-6 h-6 pr-2 rounded-sm z-10 transition-opacity"
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        class="w-full h-full"
      >
        <title>cursor-move</title>
        <path
          d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"
        />
      </svg>
    </div>
    <textarea
      ref="textarea"
      v-model="input"
      @keydown="handleKeydown"
      placeholder="Enter text here..."
      class="w-full p-1 pl-6 min-h-[40px] overflow-y-hidden transition-colors focus:border-primary border-none text-base resize-none bg-transparent"
      :class="{ 'text-warning': isWarningText, 'text-white': !isWarningText }"
      rows="1"
    ></textarea>
  </div>
</template>

<style>
.block-container {
  transition: opacity 0.3s;
}
.block-container.dragging {
  opacity: 0.5;
}
/* Add support for focus state to show the move icon */
.block-container:focus-within .drag-handle {
  opacity: 0.7;
}
textarea {
  line-height: 24px !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  box-sizing: border-box !important;
  -ms-overflow-style: none !important; /* Hide scrollbar in IE and Edge */
  scrollbar-width: none !important; /* Hide scrollbar in Firefox */
}
/* Hide scrollbar in Webkit/Blink browsers */
textarea::-webkit-scrollbar {
  display: none !important;
}
</style>
