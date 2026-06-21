import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { DEVICE_ID, SERVER_URL } from '../config/device'
import { formatDate } from '../utils/formatters'

/**
 * Load image as base64 using html2canvas as fallback.
 * html2canvas renders a DOM element to canvas — since <img> tags load
 * cross-origin images without CORS restrictions, we can capture them.
 */
async function getImageDataUrl(imgUrl) {
  let path = (imgUrl || '').replace(/^\/api/, '')
  if (!path.startsWith('/captures')) {
    path = `/captures${path}`
  }
  const src = `${SERVER_URL}${path}`

  // Create a temporary hidden container
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;'
  document.body.appendChild(container)

  try {
    // Load image in a real <img> tag (no CORS needed for display)
    const img = document.createElement('img')
    img.style.cssText = 'max-width:1200px;max-height:900px;display:block;'
    img.src = src

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 20000)
      img.onload = () => { clearTimeout(timeout); resolve() }
      img.onerror = () => { clearTimeout(timeout); reject(new Error('load failed')) }
    })

    container.appendChild(img)

    // Use html2canvas to capture the rendered image
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: 1,
      width: img.naturalWidth,
      height: img.naturalHeight,
    })

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    return { dataUrl, width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Generate medical PDF report — one image per page, full size
 */
export async function generateMedicalReport(selectedImages, patientInfo) {
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

    try {
      const loaded = await getImageDataUrl(img.url || '')
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
    } catch (err) {
      console.error(`PDF image failed: ${img.filename}`, err)
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
