import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL, DEVICE_ID } from '../config/device'

const baseQueryWithRetry = retry(
  fetchBaseQuery({ baseUrl: API_BASE_URL }),
  { maxRetries: 3 }
)

export const ixopeApi = createApi({
  reducerPath: 'ixopeApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Images', 'Videos', 'Health', 'Patients'],
  endpoints: (builder) => ({

    // ─── Images ────────────────────────────────────────────────────────
    getAllImages: builder.query({
      query: () => `/captures/images?device_id=${DEVICE_ID}`,
      providesTags: ['Images'],
    }),
    getScopeImages: builder.query({
      query: (scope) => `/captures/images?device_id=${DEVICE_ID}&scope=${scope}`,
      providesTags: (result, error, scope) => [{ type: 'Images', id: scope }],
    }),
    getPatientImages: builder.query({
      query: (patientId) => `/captures/images?patient_id=${patientId}`,
      providesTags: (result, error, pid) => [{ type: 'Images', id: pid }],
    }),
    getImagesByDate: builder.query({
      query: ({ dateFrom, dateTo, scope }) => {
        let url = `/captures/images?device_id=${DEVICE_ID}`
        if (dateFrom) url += `&date_from=${dateFrom}`
        if (dateTo) url += `&date_to=${dateTo}`
        if (scope) url += `&scope=${scope}`
        return url
      },
      providesTags: ['Images'],
    }),
    deleteImage: builder.mutation({
      query: (imageId) => ({ url: `/captures/images/${imageId}`, method: 'DELETE' }),
      invalidatesTags: ['Images'],
    }),

    // ─── Snapshot Upload ───────────────────────────────────────────────
    uploadSnapshot: builder.mutation({
      query: ({ file, scope, bodyPart, notes }) => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: `/captures/images?id=${DEVICE_ID}&scope=${scope}${bodyPart ? `&body_part=${bodyPart}` : ''}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Images'],
    }),

    // ─── Update Image Notes ────────────────────────────────────────────
    updateImageNotes: builder.mutation({
      query: ({ imageId, notes }) => ({
        url: `/captures/images/${imageId}/notes?notes=${encodeURIComponent(notes)}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Images'],
    }),

    // ─── Videos ────────────────────────────────────────────────────────
    getAllVideos: builder.query({
      query: () => `/captures/videos?device_id=${DEVICE_ID}`,
      providesTags: ['Videos'],
    }),
    getScopeVideos: builder.query({
      query: (scope) => `/captures/videos?device_id=${DEVICE_ID}&scope=${scope}`,
      providesTags: (result, error, scope) => [{ type: 'Videos', id: scope }],
    }),
    deleteVideo: builder.mutation({
      query: (videoId) => ({ url: `/captures/videos/${videoId}`, method: 'DELETE' }),
      invalidatesTags: ['Videos'],
    }),

    // ─── Scope Stats ───────────────────────────────────────────────────
    getScopeStats: builder.query({
      query: (scope) => `/captures/stats?device_id=${DEVICE_ID}&scope=${scope}`,
    }),

    // ─── Device ────────────────────────────────────────────────────────
    getHealth: builder.query({
      query: () => `/devices/${DEVICE_ID}`,
      transformResponse: (response) => ({
        status: response?.device?.is_online ? 'ok' : 'offline',
        camera: 'available',
        timestamp: response?.device?.last_seen,
      }),
      transformErrorResponse: () => ({
        status: 'offline',
        camera: 'unavailable',
        timestamp: null,
      }),
      providesTags: ['Health'],
    }),

    // ─── Patients ──────────────────────────────────────────────────────
    getPatients: builder.query({
      query: (search = '') => `/patients?search=${search}`,
      providesTags: ['Patients'],
    }),
    createPatient: builder.mutation({
      query: (data) => ({ url: '/patients', method: 'POST', body: data }),
      invalidatesTags: ['Patients'],
    }),
  }),
})

export const {
  useGetAllImagesQuery,
  useGetAllVideosQuery,
  useGetScopeImagesQuery,
  useGetScopeVideosQuery,
  useGetPatientImagesQuery,
  useGetImagesByDateQuery,
  useGetScopeStatsQuery,
  useGetHealthQuery,
  useDeleteVideoMutation,
  useDeleteImageMutation,
  useUploadSnapshotMutation,
  useUpdateImageNotesMutation,
  useGetPatientsQuery,
  useCreatePatientMutation,
} = ixopeApi

