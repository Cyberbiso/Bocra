import { createSlice } from '@reduxjs/toolkit'

interface DemoState {
  isDemo: boolean
}

const initialState: DemoState = {
  isDemo: false,
}

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    enableDemo(state) {
      state.isDemo = true
    },
    disableDemo(state) {
      state.isDemo = false
    },
    toggleDemo(state) {
      state.isDemo = !state.isDemo
    },
  },
})

export const { enableDemo, disableDemo, toggleDemo } = demoSlice.actions
export default demoSlice.reducer
