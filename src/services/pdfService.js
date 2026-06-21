import { jsPDF } from 'jspdf'
import { DEVICE_ID, SERVER_URL } from '../config/device'
import { formatDate } from '../utils/formatters'

/**
 * Preload all images using hidden <img> elements (no CORS needed for img tags),
 * then draw each to a canvas to get base64 data.
 * Returns array of {dataUrl, width, height} or null for failed images.
 */
async function preloadImages(images) {
  const results = []

  for (const img of images) {
    let path = (img.url || '').replace(/^\/api/, '')
    if (!path.startsWith('/captures')) {
      path = `/captures${path}`
    }
    const src = `${SERVER_URL}${path}`

    try {
      const result = await loadSingleImage(src)
      results.push(result)
    } catch (e) {
      console.warn(`Failed to load image for PDF: ${img.filename}`, e)
      results.push(null)
    }
  }

  return results
}

function loadSingleImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const timeout = setTimeout(() => {
      reject(new Error('Image load timeout'))
    }, 15000)

    img.onload = () => {
      clearTimeout(timeout)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight })
      } catch (e) {
        // Canvas tainted — CORS not set on server
        // Fallback: try without crossOrigin (won't get data but let's try a proxy)
        reject(e)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      // Try again without crossOrigin attribute — some servers reject anonymous requests
      const img2 = new Image()
      const timeout2 = setTimeout(() => reject(new Error('Fallback timeout')), 15000)

      img2.onload = () => {
        clearTimeout(timeout2)
        // Can't use canvas without crossOrigin, so try to fetch via a different method
        fetchAsBlob(src).then(blob => {
          const reader = new FileReader()
          reader.onload = () => {
            const tempImg = new Image()
            tempImg.onload = () => {
              resolve({ dataUrl: reader.result, width: tempImg.naturalWidth, height: tempImg.naturalHeight })
            }
            tempImg.onerror = () => resolve({ dataUrl: reader.result, width: 640, height: 480 })
            tempImg.src = reader.result
          }
          reader.onerror = () => reject(new Error('FileReader failed'))
          reader.readAsDataURL(blob)
        }).catch(reject)
      }

      img2.onerror = () => {
        clearTimeout(timeout2)
        reject(new Error('Image load failed'))
      }

      img2.src = src
    }

    img.src = src
  })
}

async function fetchAsBlob(url) {
  // Try fetch with no-cors mode — gets opaque response but we can't read it
  // So try normal fetch first
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return await resp.blob()
}

/**
 * Generate medical PDF report — one image per page, full size
 */
export async function generateMedicalReport(selectedImages, patientInfo) {
  // Preload all images first (shows progress)
  const loadedImages = await preloadImages(selectedImages)

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const MARGIN = 15
  const contentWidth = pageWidth - MARGIN * 2

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
  }

  // ─── One image per page ──────────────────────────────────────────────
  for (let i = 0; i < selectedImages.length; i++) {
    doc.addPage()
    const img = selectedImages[i]
    const loaded = loadedImages[i]

    // Title
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(`Image ${i + 1} of ${selectedImages.length}`, MARGIN, 15)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80)
    const caption = `${(img.scope || '').toUpperCase()} \u00B7 ${img.original_filename || img.filename} \u00B7 ${formatDate(img.captured_at || img.created)}`
    doc.text(caption, MARGIN, 22)

    doc.setDrawColor(220)
    doc.line(MARGIN, 25, pageWidth - MARGIN, 25)

    const imgAreaTop = 30
    const imgAreaHeight = pageHeight - 25 - imgAreaTop
    const imgAreaWidth = contentWidth

    if (loaded && loaded.dataUrl) {
      const aspectRatio = loaded.width / loaded.height

      let drawWidth, drawHeight
      if (aspectRatio > imgAreaWidth / imgAreaHeight) {
        drawWidth = imgAreaWidth
        drawHeight = imgAreaWidth / aspectRatio
      } else {
        drawHeight = imgAreaHeight
        drawWidth = imgAreaHeight * aspectRatio
      }

      const drawX = MARGIN + (imgAreaWidth - drawWidth) / 2
      const drawY = imgAreaTop + (imgAreaHeight - drawHeight) / 2

      doc.addImage(loaded.dataUrl, 'JPEG', drawX, drawY, drawWidth, drawHeight)
    } else {
      doc.setFontSize(12)
      doc.setTextColor(180)
      doc.text('Image could not be loaded', pageWidth / 2, imgAreaTop + imgAreaHeight / 2, { align: 'center' })
      doc.setFontSize(8)
      doc.text(img.original_filename || img.filename, pageWidth / 2, imgAreaTop + imgAreaHeight / 2 + 8, { align: 'center' })
      doc.setTextColor(0)
    }
  }

  // ─── Page numbers ────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${p} of ${totalPages} \u00B7 IXOPE Medical \u00B7 ${patientInfo.name} (${patientInfo.id})`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}
