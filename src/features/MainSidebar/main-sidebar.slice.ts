import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'

// Define a type for the slice state
interface MainSidebarState {
  activeMenu: string
}

// Define the initial state using that type
const initialState: MainSidebarState = {
    activeMenu: "off"
}

export const mainSidebarSlice = createSlice({
  name: 'mainSidebar',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setActiveMenu: (state, action: PayloadAction<string>) => {
      state.activeMenu = action.payload
    }

}})

export const {  setActiveMenu } = mainSidebarSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const selectActiveMenu = (state: RootState) => state.mainSidebar.activeMenu

export default mainSidebarSlice.reducer