import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedImages: [],
  patientInfo: { name: '', id: '', dateOfBirth: '', notes: '' },
  generating: false,
}

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    toggleImageSelection(state, action) {
      const img = action.payload
      const idx = state.selectedImages.findIndex((i) => i.filename === img.filename)
      if (idx >= 0) {
        state.selectedImages.splice(idx, 1)
      } else {
        state.selectedImages.push(img)
      }
    },
    selectAllImages(state, action) {
      state.selectedImages = action.payload
    },
    clearSelection(state) {
      state.selectedImages = []
    },
    setPatientInfo(state, action) {
      state.patientInfo = { ...state.patientInfo, ...action.payload }
    },
    setGenerating(state, action) {
      state.generating = action.payload
    },
  },
})

export const { toggleImageSelection, selectAllImages, clearSelection, setPatientInfo, setGenerating } = reportSlice.actions
export default reportSlice.reducer

