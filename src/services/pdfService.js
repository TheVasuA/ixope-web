import { jsPDF } from 'jspdf'
import { DEVICE_ID, SERVER_URL } from '../config/device'
import { formatDate } from '../utils/formatters'

/**
 * Load image as base64 — tries canvas first (works if image already displayed),
 * then fetch same-origin, then fetch cross-origin
 */
async function fetchImageAsBase64(url) {
  // Normalize URL — ensure /captures prefix is present
  let path = (url || '').replace(/^\/api/, '')
  if (!path.startsWith('/captures')) {
    path = `/captures${path}`
  }

  const crossOriginUrl = `${SERVER_URL}${path}`

  // Attempt 1: load via Image element + canvas (avoids CORS fetch issues)
  try {
    const data = await loadImageViaCanvas(crossOriginUrl)
    if (data) return data
  } catch (e) {
    // Canvas tainted by CORS, try fetch
  }

  // Attempt 2: fetch cross-origin with credentials
  try {
    const response = await fetch(crossOriginUrl, { mode: 'cors', credentials: 'omit' })
    if (response.ok) {
      const blob = await response.blob()
      return await blobToDataUrl(blob)
    }
  } catch (e) {
    // fetch failed
  }

  // Attempt 3: try relative URL (same-origin, works if nginx proxies)
  try {
    const response = await fetch(path)
    if (response.ok) {
      const blob = await response.blob()
      return await blobToDataUrl(blob)
    }
  } catch (e) {
    // all failed
  }

  throw new Error('All image fetch methods failed')
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImageViaCanvas(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

/**
 * Generate medical PDF report — one image per page, full size
 */
export async function generateMedicalReport(selectedImages, patientInfo) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()   // 210
  const pageHeight = doc.internal.pageSize.getHeight() // 297
  const MARGIN = 15
  const contentWidth = pageWidth - MARGIN * 2  // 180

  // ─── Cover / Header page ─────────────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('IXOPE Medical Report', MARGIN, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Device ID: ${DEVICE_ID}`, MARGIN, 34)
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, MARGIN, 40)
  doc.text(`Total images: ${selectedImages.length}`, MARGIN, 46)

  // Patient info section
  doc.setDrawColor(200)
  doc.line(MARGIN, 52, pageWidth - MARGIN, 52)

  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Information', MARGIN, 62)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let y = 70
  doc.text(`Name: ${patientInfo.name}`, MARGIN, y); y += 7
  doc.text(`ID: ${patientInfo.id}`, MARGIN, y); y += 7
  if (patientInfo.dateOfBirth) {
    doc.text(`Date of Birth: ${patientInfo.dateOfBirth}`, MARGIN, y); y += 7
  }
  if (patientInfo.notes) {
    y += 3
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', MARGIN, y); y += 6
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(patientInfo.notes, contentWidth)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5
  }

  // ─── One image per page ──────────────────────────────────────────────
  for (let i = 0; i < selectedImages.length; i++) {
    doc.addPage()
    const img = selectedImages[i]

    // Image title bar
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(`Image ${i + 1} of ${selectedImages.length}`, MARGIN, 15)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80)
    const caption = `${(img.scope || '').toUpperCase()} · ${img.original_filename || img.filename} · ${formatDate(img.captured_at || img.created)}`
    doc.text(caption, MARGIN, 22)

    doc.setDrawColor(220)
    doc.line(MARGIN, 25, pageWidth - MARGIN, 25)

    // Image area: from y=30 to y=pageHeight-25
    const imgAreaTop = 30
    const imgAreaHeight = pageHeight - 25 - imgAreaTop
    const imgAreaWidth = contentWidth

    try {
      const imageData = await fetchImageAsBase64(img.url || '')

      // Get dimensions for aspect ratio
      const tempImg = await getImageDimensions(imageData)
      const aspectRatio = tempImg.width / tempImg.height

      let drawWidth, drawHeight
      if (aspectRatio > imgAreaWidth / imgAreaHeight) {
        drawWidth = imgAreaWidth
        drawHeight = imgAreaWidth / aspectRatio
      } else {
        drawHeight = imgAreaHeight
        drawWidth = imgAreaHeight * aspectRatio
      }

      // Center the image
      const drawX = MARGIN + (imgAreaWidth - drawWidth) / 2
      const drawY = imgAreaTop + (imgAreaHeight - drawHeight) / 2

      doc.addImage(imageData, 'JPEG', drawX, drawY, drawWidth, drawHeight)
    } catch (err) {
      console.error(`PDF image load failed for ${img.filename}:`, err)
      doc.setFontSize(12)
      doc.setTextColor(180)
      doc.text('Image could not be loaded', pageWidth / 2, imgAreaTop + imgAreaHeight / 2, { align: 'center' })
      doc.setFontSize(8)
      doc.text(img.original_filename || img.filename, pageWidth / 2, imgAreaTop + imgAreaHeight / 2 + 8, { align: 'center' })
      doc.setTextColor(0)
    }
  }

  // ─── Page numbers footer ─────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${p} of ${totalPages} · IXOPE Medical · ${patientInfo.name} (${patientInfo.id})`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}

/**
 * Get image dimensions from base64 data URL
 */
function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 4, height: 3 })
    img.src = dataUrl
  })
}
