import { jsPDF } from 'jspdf'
import { DEVICE_ID, DEVICE_URL } from '../config/device'
import { formatDate } from '../utils/formatters'

/**
 * Fetch image and convert to base64 data URL
 */
async function fetchImageAsBase64(path) {
  const response = await fetch(`${DEVICE_URL}${path}`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Generate medical PDF report
 */
export async function generateMedicalReport(selectedImages, patientInfo) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const MARGIN = 15
  const IMG_WIDTH = 80
  const IMG_HEIGHT = 60
  const IMAGES_PER_PAGE = 4

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('IXOPE Medical Report', MARGIN, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Device ID: ${DEVICE_ID}`, MARGIN, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, MARGIN, 33)

  // Patient info
  doc.setDrawColor(200)
  doc.line(MARGIN, 38, pageWidth - MARGIN, 38)

  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Information', MARGIN, 46)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let y = 53
  doc.text(`Name: ${patientInfo.name}`, MARGIN, y)
  y += 6
  doc.text(`ID: ${patientInfo.id}`, MARGIN, y)
  if (patientInfo.dateOfBirth) {
    y += 6
    doc.text(`DOB: ${patientInfo.dateOfBirth}`, MARGIN, y)
  }
  if (patientInfo.notes) {
    y += 6
    doc.text(`Notes: ${patientInfo.notes}`, MARGIN, y)
  }

  y += 10
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 8

  // Images
  const skippedImages = []

  for (let i = 0; i < selectedImages.length; i++) {
    if (i > 0 && i % IMAGES_PER_PAGE === 0) {
      doc.addPage()
      y = 20
    }

    const img = selectedImages[i]
    const position = i % IMAGES_PER_PAGE
    const row = Math.floor(position / 2)
    const col = position % 2

    const x = MARGIN + col * (IMG_WIDTH + 10)
    const imgY = y + row * (IMG_HEIGHT + 20)

    try {
      const imageData = await fetchImageAsBase64(img.path)
      doc.addImage(imageData, 'JPEG', x, imgY, IMG_WIDTH, IMG_HEIGHT)
    } catch (err) {
      skippedImages.push(img.filename)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Image unavailable', x + IMG_WIDTH / 2, imgY + IMG_HEIGHT / 2, { align: 'center' })
      doc.setTextColor(0)
    }

    // Caption
    doc.setFontSize(7)
    doc.setTextColor(100)
    doc.text(`${img.scope?.toUpperCase() || ''} - ${formatDate(img.created)}`, x, imgY + IMG_HEIGHT + 4)
    doc.setTextColor(0)
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${p} of ${totalPages} | ${selectedImages.length} images | IXOPE Medical`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc.output('blob')
}

