import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import { SERVER_URL, DEVICE_ID } from '../config/device'

/**
 * Hub API — communicates with the PHP backend on ixope-hub.com
 * This handles fetching images/videos that have been uploaded to the server,
 * as well as device registration status.
 */
const baseQueryWithRetry = retry(
  fetchBaseQuery({ baseUrl: `${SERVER_URL}` }),
  { maxRetries: 2 }
)

export const hubApi = createApi({
  reducerPath: 'hubApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['HubImages', 'HubVideos'],
  endpoints: (builder) => ({
    // Get all images uploaded to hub for this device
    getHubImages: builder.query({
      query: (deviceId = DEVICE_ID) => `/api_images.php?id=${deviceId}`,
      providesTags: ['HubImages'],
    }),

    // Get all videos uploaded to hub for this device
    getHubVideos: builder.query({
      query: (deviceId = DEVICE_ID) => `/api_videos.php?id=${deviceId}`,
      providesTags: ['HubVideos'],
    }),

    // Get device info from hub
    getDeviceInfo: builder.query({
      query: (deviceId = DEVICE_ID) => `/api_device.php?id=${deviceId}`,
    }),
  }),
})

export const {
  useGetHubImagesQuery,
  useGetHubVideosQuery,
  useGetDeviceInfoQuery,
} = hubApi

