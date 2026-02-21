import type { Skill } from "@/lib/types/skill";

export const reduxToolkitSkill: Skill = {
  id: "system-redux-toolkit",
  name: "Redux Toolkit State Management",
  description: "Redux Toolkit state management — createSlice, configureStore, typed hooks, async thunks.",
  enabled: true,
  content: `## State Management: Redux Toolkit — MANDATORY

**You MUST use Redux Toolkit (RTK) for ALL shared state. Do NOT use React Context, Zustand, or other state libraries for shared state.**

### Store Setup
\`\`\`tsx
import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './features/counter/counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
\`\`\`

### Typed Hooks (create once, use everywhere)
\`\`\`tsx
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
\`\`\`

### Creating Slices
\`\`\`tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CounterState {
  value: number
  status: 'idle' | 'loading' | 'failed'
}

const initialState: CounterState = { value: 0, status: 'idle' }

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => { state.value += 1 },
    decrement: (state) => { state.value -= 1 },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
  },
})

export const { increment, decrement, incrementByAmount } = counterSlice.actions
export default counterSlice.reducer
\`\`\`

### Async Thunks
\`\`\`tsx
import { createAsyncThunk } from '@reduxjs/toolkit'

export const fetchUser = createAsyncThunk('user/fetch', async (userId: string) => {
  const res = await fetch(\`/api/users/\${userId}\`)
  return res.json()
})

// Handle in slice with extraReducers
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => { state.status = 'loading' })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.status = 'idle'
      state.data = action.payload
    })
    .addCase(fetchUser.rejected, (state) => { state.status = 'failed' })
},
\`\`\`

### Provider Setup
\`\`\`tsx
import { Provider } from 'react-redux'
import { store } from './store'

function App() {
  return (
    <Provider store={store}>
      <MyApp />
    </Provider>
  )
}
\`\`\`

### Critical Rules

**ALWAYS:**
* Use \`createSlice\` — never write reducers or action creators manually
* Use Immer-powered mutable syntax inside reducers (RTK enables it by default)
* Use typed hooks (\`useAppSelector\`, \`useAppDispatch\`) — never use untyped \`useSelector\`/\`useDispatch\`
* One slice per feature/domain with its own file
* Export actions and reducer from the slice file
* Use \`PayloadAction<T>\` for typed action payloads
* Use \`useState\` ONLY for local UI state (form inputs, toggles)

**NEVER:**
* Write manual action types or action creators
* Mutate state outside of RTK reducers
* Put API calls directly in components — use \`createAsyncThunk\`
* Create a single massive slice — split by feature`,
};
