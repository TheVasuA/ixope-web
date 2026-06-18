# Implementation Plan: IXOPE Web Portal

## Overview

Build a modern React-based web portal for the IXOPE medical imaging device. The portal provides a dashboard with scope category navigation, image/video galleries with lightbox viewing, live MJPEG feed, file upload management, PDF medical report generation, and device health monitoring. Built with Vite + React + TypeScript, Redux Toolkit for state management, RTK Query for API communication with the Flask server, Tailwind CSS for styling, and jsPDF for report generation.

## Tasks

- [ ] 1. Project Scaffolding and Configuration
  - [ ] 1.1 Initialize Vite + React + TypeScript project in ixope_web/ with `npm create vite@latest . -- --template react-ts`
  - [ ] 1.2 Install core dependencies: @reduxjs/toolkit, react-redux, react-router-dom, lucide-react, jspdf, react-hot-toast
  - [ ] 1.3 Install dev dependencies: tailwindcss, postcss, autoprefixer, @types/react, @types/react-dom
  - [ ] 1.4 Configure Tailwind CSS with darkMode: 'class' strategy, extend theme with medical color palette
  - [ ] 1.5 Configure TypeScript tsconfig.json with path aliases (e.g., @/ for src/)
  - [ ] 1.6 Create project folder structure: src/pages, src/components/ui, src/components/layout, src/store/slices, src/services, src/hooks, src/utils, src/types, src/config
  - [ ] 1.7 Create src/index.css with Tailwind directives (@tailwind base, components, utilities) and CSS custom properties for medical theme
  - [ ] 1.8 Configure Vite proxy to forward /api and /scope requests to Flask server during development

- [ ] 2. TypeScript Types and Configuration
  - [ ] 2.1 Create src/types/index.ts with ScopeCategory, ImageMeta, VideoMeta, ScopeStats, HealthStatus, UploadItem, PatientInfo, DeviceConfig interfaces
  - [ ] 2.2 Create src/config/device.ts with DEVICE_ID, SERVER_URL, FLASK_BASE_URL constants and scope configuration (labels, icons, colors)
  - [ ] 2.3 Create src/utils/scopeConfig.ts with SCOPE_LABELS, SCOPE_ICONS, SCOPE_COLORS mappings

- [ ] 3. Redux Store Setup
  - [ ] 3.1 Create src/store/index.ts with configureStore including RTK Query middleware
  - [ ] 3.2 Create src/store/slices/uiSlice.ts with theme, sidebarOpen, activeScope, and lightbox state management
  - [ ] 3.3 Create src/store/slices/deviceSlice.ts with deviceId, serverUrl, connected, lastHealthCheck state
  - [ ] 3.4 Create src/store/slices/uploadSlice.ts with queue, activeUploads, history state and reducers for addToQueue, updateStatus, removeItem, retryFailed
  - [ ] 3.5 Create src/store/slices/reportSlice.ts with selectedImages, patientInfo, generating state
  - [ ] 3.6 Create typed hooks (useAppDispatch, useAppSelector) in src/store/hooks.ts

- [ ] 4. RTK Query API Service
  - [ ] 4.1 Create src/services/api.ts with createApi and fetchBaseQuery configured to Flask server base URL
  - [ ] 4.2 Implement getAllImages endpoint: GET /api/images returning ImageMeta[]
  - [ ] 4.3 Implement getAllVideos endpoint: GET /api/videos returning VideoMeta[]
  - [ ] 4.4 Implement getScopeImages endpoint: GET /scope/{scope}/images returning { images: ImageMeta[] }
  - [ ] 4.5 Implement getScopeVideos endpoint: GET /scope/{scope}/videos returning { videos: VideoMeta[] }
  - [ ] 4.6 Implement getScopeStats endpoint: GET /scope/{scope}/stats returning ScopeStats
  - [ ] 4.7 Implement getHealth endpoint: GET /health with polling configuration (30s default)
  - [ ] 4.8 Implement deleteVideo mutation: DELETE /video/{filename} with cache invalidation on 'Videos' tag
  - [ ] 4.9 Export auto-generated hooks: useGetAllImagesQuery, useGetScopeImagesQuery, useGetHealthQuery, useDeleteVideoMutation, etc.

- [ ] 5. Utility Functions
  - [ ] 5.1 Create src/utils/formatters.ts with formatFileSize(bytes) and formatDate(isoString) functions
  - [ ] 5.2 Create src/utils/groupMedia.ts with groupMediaByDate(items) function returning Map<string, MediaItem[]>
  - [ ]* 5.3 Write unit tests for formatFileSize with edge cases (0, 1023, 1024, 1048576, large values)
  - [ ]* 5.4 Write unit tests for groupMediaByDate with empty array, single item, multiple dates
  - [ ]* 5.5 Write property-based tests using fast-check for formatFileSize (always returns valid string for non-negative integers)
  - [ ]* 5.6 Write property-based tests for groupMediaByDate (preserves total item count, no data loss)

- [ ] 6. Custom Hooks
  - [ ] 6.1 Create src/hooks/useTheme.ts with initializeTheme, toggleTheme, and localStorage persistence
  - [ ] 6.2 Create src/hooks/useDeviceConnection.ts polling /health endpoint and returning connection state
  - [ ] 6.3 Create src/hooks/useLightbox.ts with open, close, next, prev, keyboard navigation (Arrow keys, Escape)
  - [ ]* 6.4 Write unit tests for useLightbox navigation wrapping (next at end wraps to 0, prev at start wraps to end)

- [ ] 7. Layout Components
  - [ ] 7.1 Create src/components/layout/AppLayout.tsx with sidebar, header, and main content area using flex layout
  - [ ] 7.2 Create src/components/layout/Sidebar.tsx with navigation links: Dashboard, 4 scope categories (with icons), Live Feed, Uploads, Reports, Device Management
  - [ ] 7.3 Create src/components/layout/Header.tsx with page title, device status badge, and theme toggle button
  - [ ] 7.4 Implement responsive sidebar: collapsible on mobile (< 768px) with hamburger menu toggle
  - [ ] 7.5 Style sidebar with medical-grade design: clean borders, scope-specific accent colors, active state indicators

- [ ] 8. Shared UI Components
  - [ ] 8.1 Create src/components/ui/ScopeCard.tsx displaying scope label, icon (Lucide), image count, video count with scope-specific color accent
  - [ ] 8.2 Create src/components/ui/ImageGrid.tsx with responsive grid (1 col mobile, 2 cols tablet, 3-4 cols desktop), lazy-loaded thumbnails with object-fit: cover
  - [ ] 8.3 Create src/components/ui/Lightbox.tsx with full-screen overlay, image display, navigation arrows, close button, keyboard support, and image counter (X of Y)
  - [ ] 8.4 Create src/components/ui/VideoPlayer.tsx with native HTML5 video element, controls, and optional delete button with confirmation dialog
  - [ ] 8.5 Create src/components/ui/DeviceStatusBadge.tsx showing connection status (green dot / red dot) with last check timestamp
  - [ ] 8.6 Create src/components/ui/UploadDropzone.tsx with drag-and-drop zone, file picker button, scope category selector, and accepted file type validation (images: jpg,png,bmp; videos: mp4,avi,mov,webm)
  - [ ] 8.7 Create src/components/ui/UploadProgress.tsx with progress bar, filename, status indicator, and retry/cancel buttons
  - [ ] 8.8 Create src/components/ui/ThemeToggle.tsx with Sun/Moon icon toggle button
  - [ ] 8.9 Create src/components/ui/SkeletonGrid.tsx with animated placeholder cards for loading states

- [ ] 9. Dashboard Page
  - [ ] 9.1 Create src/pages/Dashboard.tsx with 4 ScopeCard components fetching stats via useGetScopeStatsQuery for each scope
  - [ ] 9.2 Add DeviceHealthCard section showing device status from useGetHealthQuery with auto-polling
  - [ ] 9.3 Add RecentCapturesCard section showing latest 8 images from useGetAllImagesQuery, sliced and displayed as small thumbnails
  - [ ] 9.4 Implement click navigation from ScopeCard to /scope/{scope} gallery route
  - [ ] 9.5 Style dashboard with responsive grid: 1 col mobile, 2 cols tablet, 4 cols desktop for scope cards

- [ ] 10. Scope Gallery Page
  - [ ] 10.1 Create src/pages/ScopeGallery.tsx that reads scope from URL params and fetches images/videos via RTK Query
  - [ ] 10.2 Implement tab switcher between "Images" and "Videos" views within the gallery
  - [ ] 10.3 Integrate ImageGrid component with lightbox: clicking thumbnail opens Lightbox at correct index
  - [ ] 10.4 Integrate VideoPlayer for video entries with delete functionality and confirmation
  - [ ] 10.5 Display scope header with label, icon, and total counts (X images, Y videos)
  - [ ] 10.6 Implement empty state for scopes with no captures
  - [ ] 10.7 Implement loading state with SkeletonGrid while API requests are in progress

- [ ] 11. Live Feed Page
  - [ ] 11.1 Create src/pages/LiveFeed.tsx with MJPEG stream rendered via <img src="/live_feed"> tag
  - [ ] 11.2 Add device status check: only show stream when device is connected and camera is available
  - [ ] 11.3 Show "Feed Unavailable" state with device status when stream is not accessible
  - [ ] 11.4 Implement cleanup on page navigation (remove img src to stop MJPEG connection)

- [ ] 12. Upload Management Page
  - [ ] 12.1 Create src/pages/Uploads.tsx with UploadDropzone and UploadQueueList sections
  - [ ] 12.2 Create src/services/uploadService.ts with processUploadQueue function: max 3 concurrent uploads, progress tracking via XHR
  - [ ] 12.3 Implement upload routing: images → upload.php?id=DEVICE_ID, videos → upload1.php?id=DEVICE_ID
  - [ ] 12.4 Display upload queue with status indicators: pending (gray), uploading (blue with progress), success (green checkmark), error (red with retry button)
  - [ ] 12.5 Implement "Retry All Failed" button that resets all error-state items to pending
  - [ ] 12.6 Add upload history section showing completed uploads with timestamp and file info

- [ ] 13. PDF Report Generation Page
  - [ ] 13.1 Create src/pages/Reports.tsx with image selection grid (checkboxes on each image) and patient info form
  - [ ] 13.2 Create src/services/pdfService.ts with generateMedicalReport function using jsPDF
  - [ ] 13.3 Implement PDF layout: header (IXOPE logo area, patient info, device ID, date), image grid (2 per row with captions), footer (page numbers, total images)
  - [ ] 13.4 Implement image selection UI: select/deselect all, selected count badge, "Generate Report" button (enabled only when >= 1 image selected and patient name filled)
  - [ ] 13.5 Implement patient info form with fields: name (required), ID (required), date of birth (optional), notes (optional)
  - [ ] 13.6 Handle image load failures during PDF generation: skip failed images, add placeholder text, show warning toast
  - [ ] 13.7 Provide download button and "Open in New Tab" option for generated PDF

- [ ] 14. Device Management Page
  - [ ] 14.1 Create src/pages/DeviceManagement.tsx showing device health details, camera status, and connection info
  - [ ] 14.2 Display device configuration: Device ID, Flask Base URL, Hub Server URL, polling interval
  - [ ] 14.3 Show connection timeline: last successful health check, current polling interval, connection uptime
  - [ ] 14.4 Implement "Test Connection" button that triggers immediate health check and displays result

- [ ] 15. Routing and App Shell
  - [ ] 15.1 Create src/App.tsx with BrowserRouter, AppLayout wrapper, and route definitions for all pages
  - [ ] 15.2 Configure routes: / (Dashboard), /scope/:scope (ScopeGallery), /live (LiveFeed), /uploads (Uploads), /reports (Reports), /device (DeviceManagement)
  - [ ] 15.3 Implement React.lazy() code splitting for each page component
  - [ ] 15.4 Create src/main.tsx with Redux Provider, Router, and app initialization (theme, device config)
  - [ ] 15.5 Add 404 fallback route with "Page Not Found" component and link back to dashboard

- [ ] 16. Error Handling and Offline Support
  - [ ] 16.1 Create global error boundary component wrapping the app for unhandled React errors
  - [ ] 16.2 Implement "Device Offline" banner in Header that appears when health check fails, showing last sync time
  - [ ] 16.3 Configure RTK Query retry logic: 3 retries with exponential backoff (1s, 2s, 4s) for failed requests
  - [ ] 16.4 Implement toast notifications for key events: device online/offline transitions, upload success/failure, PDF generation complete
  - [ ] 16.5 Add broken-image placeholder component for images that fail to load (shows scope icon with "File not found" message)

- [ ] 17. Testing Setup and Integration Tests
  - [ ] 17.1 Install and configure Vitest with React Testing Library and jsdom environment
  - [ ] 17.2 Install and configure fast-check for property-based testing
  - [ ] 17.3 Install and configure MSW (Mock Service Worker) for API mocking in tests
  - [ ]* 17.4 Write integration test: Dashboard loads and displays 4 scope cards with stats from mocked API
  - [ ]* 17.5 Write integration test: ScopeGallery loads images and opens lightbox on click
  - [ ]* 17.6 Write integration test: Upload flow from file selection through queue processing to completion

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific components and files for traceability
- The project uses Vite + React + TypeScript with Redux Toolkit and RTK Query
- Tailwind CSS is used for styling with a medical-grade dark/light theme
- The Flask server (on the IXOPE device) provides the backend API for images, videos, live feed, and health checks
- Upload endpoints target PHP scripts (upload.php, upload1.php) on the hub server
- Property tests validate universal correctness properties for utility functions
- Unit tests validate specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "1.5", "1.6", "1.7", "1.8"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9"] },
    { "id": 6, "tasks": ["5.1", "5.2", "6.1", "6.2", "6.3"] },
    { "id": 7, "tasks": ["5.3", "5.4", "5.5", "5.6", "6.4"] },
    { "id": 8, "tasks": ["7.1", "7.2", "7.3", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9"] },
    { "id": 9, "tasks": ["7.4", "7.5"] },
    { "id": 10, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "10.1", "11.1", "12.1", "13.1", "14.1", "15.1", "15.4"] },
    { "id": 11, "tasks": ["10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "11.2", "11.3", "11.4", "12.2", "12.3", "13.2", "13.3", "15.2", "15.3", "15.5"] },
    { "id": 12, "tasks": ["12.4", "12.5", "12.6", "13.4", "13.5", "13.6", "13.7", "14.2", "14.3", "14.4"] },
    { "id": 13, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5"] },
    { "id": 14, "tasks": ["17.1", "17.2", "17.3"] },
    { "id": 15, "tasks": ["17.4", "17.5", "17.6"] }
  ]
}
```
