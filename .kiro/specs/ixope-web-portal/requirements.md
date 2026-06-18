# Requirements Document

## Introduction

The IXOPE Web Portal is a web-based application for medical professionals to manage, browse, and upload media captured by the IXOPE medical device. It provides a dashboard with scope category overviews (Ophthalmoscope, Otoscope, Dermatoscope, Microscope), image and video galleries with lightbox viewing, live camera feed, upload management with progress tracking, PDF report generation, device health monitoring, and a medical-grade dark/light themed UI. The portal communicates with the device's Flask REST server via RTK Query and is built with Vite, TypeScript, Tailwind CSS, and Redux Toolkit.

## Glossary

- **IXOPE_Device**: The physical medical device that captures images and video through attached scopes and exposes a Flask REST API for data access.
- **Scope**: One of four medical instrument categories: Ophthalmoscope (opth), Otoscope (oto), Dermatoscope (derm), or Microscope (micro).
- **Flask_Server**: The REST API server running on the IXOPE device that serves captured media and device status information.
- **Hub_Server**: The central IXOPE Hub server where captures are uploaded for backup and long-term storage.
- **Portal**: The IXOPE Web Portal front-end application that medical professionals interact with.
- **RTK_Query**: The Redux Toolkit Query data-fetching and caching layer used for API communication.
- **Lightbox**: A full-screen overlay component for viewing images at full resolution.
- **MJPEG**: Motion JPEG streaming format used for the live camera feed.

## Requirements

### Requirement 1: Dashboard with Scope Category Overview

**User Story:** As a medical professional, I want to see a dashboard with an overview of all four scope categories (Ophthalmoscope, Otoscope, Dermatoscope, Microscope) so that I can quickly assess the status of captured media and navigate to specific categories.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE Portal SHALL display four scope category cards showing the label, icon, and image/video count for each scope (opth, oto, derm, micro).
2. WHEN the user clicks on a scope card, THE Portal SHALL navigate to the corresponding scope gallery page.
3. WHEN the device is connected, THE Portal SHALL display a device health status badge showing "Online" with green indicator and camera availability.
4. WHEN the device is unreachable, THE Portal SHALL display a device health status badge showing "Offline" with red indicator and last known timestamp.
5. WHEN recent captures exist, THE Portal SHALL display a "Recent Captures" section with the latest 8 images across all scopes sorted by creation date descending.

### Requirement 2: Category-Wise Image Gallery with Lightbox

**User Story:** As a medical professional, I want to browse captured images for each scope category in a grid layout and view them full-screen in a lightbox so that I can examine medical images in detail.

#### Acceptance Criteria

1. WHEN the user navigates to a scope gallery, THE Portal SHALL display a responsive grid of image thumbnails sorted by creation date (newest first).
2. WHEN the user clicks an image thumbnail, THE Portal SHALL open a full-screen Lightbox overlay showing the full-resolution image.
3. WHILE the Lightbox is open, WHEN the user presses the right arrow key or clicks next, THE Portal SHALL navigate to the next image (wrapping to first image at the end).
4. WHILE the Lightbox is open, WHEN the user presses the left arrow key or clicks previous, THE Portal SHALL navigate to the previous image (wrapping to last image at the start).
5. WHILE the Lightbox is open, WHEN the user presses Escape or clicks the close button, THE Portal SHALL close the Lightbox and return to the gallery view.
6. WHEN the user navigates to a scope gallery with no images, THE Portal SHALL display an empty state with the scope icon and a message indicating no captures are available.
7. WHILE images are loading from the API, THE Portal SHALL display skeleton placeholder cards in the grid layout.

### Requirement 3: Video Gallery and Playback

**User Story:** As a medical professional, I want to browse and play recorded videos per scope category and delete videos I no longer need so that I can manage my video recordings efficiently.

#### Acceptance Criteria

1. WHEN the user views a scope gallery with videos, THE Portal SHALL display video entries with filename, size, and creation date.
2. WHEN the user clicks to play a video, THE Portal SHALL render the video in a player component with standard controls (play, pause, seek, volume).
3. WHEN the user seeks to a specific position in a video, THE Portal SHALL use range requests to jump to that position without reloading the entire file.
4. WHEN the user clicks delete on a video entry and confirms, THE Portal SHALL send a DELETE request to /video/{filename} and remove the video from the list.
5. WHEN a video is deleted successfully, THE Portal SHALL invalidate the RTK_Query cache so the video list refreshes automatically without manual page reload.

### Requirement 4: Upload Management and Tracking

**User Story:** As a medical professional, I want to manually upload images and videos to the IXOPE Hub server with progress tracking so that I can ensure my captures are backed up to the central server.

#### Acceptance Criteria

1. WHEN the user selects files via a dropzone or file picker, THE Portal SHALL add files to the upload queue with status 'pending' and assign them to the selected scope category.
2. WHILE upload processing is active, THE Portal SHALL maintain a maximum of 3 concurrent uploads at any time.
3. WHILE an upload is in progress, THE Portal SHALL display a progress indicator showing the current upload percentage (0-100%).
4. WHEN an upload completes with HTTP 200, THE Portal SHALL change the item status to 'success' and show progress at 100%.
5. IF an upload fails due to a network error or non-200 response, THEN THE Portal SHALL change the item status to 'error' with a descriptive error message and display a retry button.
6. WHEN the user clicks "Retry All Failed", THE Portal SHALL reset all error-state items to 'pending' and reprocess them.
7. WHEN uploading a video file, THE Portal SHALL send it to upload1.php?id=DEVICE_ID; WHEN uploading an image file, THE Portal SHALL send it to upload.php?id=DEVICE_ID.

### Requirement 5: Device Management and Health Monitoring

**User Story:** As a medical professional, I want to monitor the connection status of my IXOPE device and configure connection settings so that I can ensure reliable data access.

#### Acceptance Criteria

1. WHEN the device management page loads and the Flask_Server is reachable, THE Portal SHALL display device health information including status, camera availability, and timestamp.
2. THE Portal SHALL poll the health endpoint at the configured interval (default 30 seconds) and update the device connection status accordingly.
3. WHEN the device transitions from offline to online, THE Portal SHALL change the status to "Online" and display a toast notification informing the user.
4. WHEN the user views connection settings, THE Portal SHALL display the current device ID, Flask base URL, and Hub_Server URL.
5. WHILE the device is offline and cached data exists, THE Portal SHALL display cached data with a "Last synced: X minutes ago" indicator.

### Requirement 6: PDF Report Generation

**User Story:** As a medical professional, I want to select captured images and generate a PDF report with patient information so that I can create documentation for medical records.

#### Acceptance Criteria

1. WHEN the reports page is displayed, THE Portal SHALL show images from all scopes available for selection with checkboxes.
2. WHEN the user selects one or more images, THE Portal SHALL display the selected count and enable a "Generate Report" button.
3. WHEN the user submits patient information, THE Portal SHALL validate that name and ID are required fields (date of birth and notes are optional).
4. WHEN the user clicks "Generate Report" with valid patient info and selected images, THE Portal SHALL generate a PDF containing a header with device ID, patient info, date, and all selected images in a 2-per-row grid layout.
5. WHEN PDF generation completes, THE Portal SHALL allow the user to download the PDF or open it in a new browser tab.
6. IF an image fails to load during PDF generation, THEN THE Portal SHALL add a placeholder "Image unavailable" text in its place and display a warning toast listing the skipped images.

### Requirement 7: Medical-Grade UI with Dark/Light Theme

**User Story:** As a medical professional, I want a clean, clinical user interface with dark and light theme options so that I can work comfortably in different lighting environments (dim examination rooms vs. bright offices).

#### Acceptance Criteria

1. WHEN the application loads for the first time with no stored theme preference, THE Portal SHALL use the system preference (prefers-color-scheme); if unavailable, dark theme is the default.
2. WHEN the user clicks the theme toggle, THE Portal SHALL switch between dark and light mode immediately.
3. WHEN the user changes the theme, THE Portal SHALL persist the preference in localStorage and restore it on next visit.
4. WHILE the dark theme is active, THE Portal SHALL apply the 'dark' class to the document root element (Tailwind dark mode class strategy).
5. THE Portal SHALL ensure all text has sufficient contrast ratio (WCAG AA minimum 4.5:1 for normal text) in both themes.
6. WHEN viewed on different screen sizes, THE Portal SHALL provide a responsive layout with a collapsible sidebar navigation on mobile.
7. THE Portal SHALL display sidebar navigation items for: Dashboard, each scope category, Live Feed, Uploads, Reports, and Device Management.

### Requirement 8: Live Camera Feed

**User Story:** As a medical professional, I want to view the live camera feed from my IXOPE device in the web portal so that I can monitor what the device is capturing in real-time.

#### Acceptance Criteria

1. WHEN the device is connected and the camera is available, THE Portal SHALL render an MJPEG stream from the /live_feed endpoint on the live feed page.
2. IF the device goes offline or the camera becomes unavailable while the live feed is active, THEN THE Portal SHALL stop the stream and display a "Feed Unavailable" message with the device status.
3. WHEN the user navigates away from the live feed page, THE Portal SHALL cleanly terminate the MJPEG connection (no resource leak).

### Requirement 9: API Layer and Data Fetching

**User Story:** As a developer, I want a centralized API layer using RTK_Query that communicates with the Flask_Server and provides type-safe, cached data access so that the UI always shows fresh data efficiently.

#### Acceptance Criteria

1. WHEN any RTK_Query endpoint is called, THE Portal SHALL make the request to the Flask_Server base URL with the correct path (e.g., /api/images, /scope/{scope}/images).
2. WHEN a successful API response is cached, THE Portal SHALL serve subsequent requests for the same data within the stale time (30 seconds) from cache without a network request.
3. WHEN a mutation succeeds and cache tags are invalidated, THE Portal SHALL automatically refetch related queries with fresh data.
4. IF an API request fails due to a network error, THEN THE Portal SHALL retry up to 3 times with exponential backoff before reporting an error state.
5. THE Portal SHALL poll the health endpoint at the configured interval (default 30s) to detect device connectivity changes.

### Requirement 10: Project Setup and Build Configuration

**User Story:** As a developer, I want the project properly configured with Vite, TypeScript, Tailwind CSS, and Redux Toolkit so that development and production builds work correctly.

#### Acceptance Criteria

1. WHEN `npm run dev` is executed, THE Portal SHALL start a Vite development server with hot module replacement.
2. WHEN `npm run build` is executed, THE Portal SHALL generate a production-optimized bundle with route-based code splitting.
3. THE Portal SHALL pass TypeScript type checking without type errors across all source files.
4. WHEN the 'dark' class is added or removed from the HTML root element, THE Portal SHALL toggle all Tailwind dark: variants accordingly.
5. THE Portal SHALL configure the Redux store with the RTK_Query API middleware and all feature slices (ui, device, upload, report).
