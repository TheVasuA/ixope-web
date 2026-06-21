import { SERVER_URL } from '../config/device'

/**
 * Generate medical PDF report via server-side endpoint.
 * Server reads images from disk directly — no CORS issues.
 *
 * Flow:
 *  1. POST /reports/prepare — sends image IDs, server caches them in Redis
 *  2. POST /reports/generate — server builds PDF with images from disk/cache
 */
export async function generateMedicalReport(selectedImages, patientInfo) {
  const imageIds = selectedImages.map((img) => img.id).filter(Boolean)

  if (!imageIds.length) {
    throw new Error('No images selected')
  }

  // Step 1: Prepare (cache images in Redis for fast PDF)
  const prepareRes = await fetch(`${SERVER_URL}/reports/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: patientInfo.id || 'default',
      image_ids: imageIds,
    }),
  })

  if (!prepareRes.ok) {
    const err = await prepareRes.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to prepare report')
  }

  // Step 2: Generate PDF
  const generateRes = await fetch(`${SERVER_URL}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: patientInfo.id || 'default',
      patient_name: patientInfo.name,
      patient_id: patientInfo.id,
      date_of_birth: patientInfo.dateOfBirth || '',
      notes: patientInfo.notes || '',
    }),
  })

  if (!generateRes.ok) {
    const err = await generateRes.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to generate PDF')
  }

  // Return the PDF blob
  return await generateRes.blob()
}
