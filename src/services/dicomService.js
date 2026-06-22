/**
 * DICOM Secondary Capture creation from JPEG images.
 * Uses dcmjs to create clinically valid .dcm files client-side.
 */
import dcmjs from 'dcmjs'

const { DicomMetaDictionary, DicomDict } = dcmjs.data

// Generate a unique DICOM UID
function generateUID() {
  const root = '1.2.826.0.1.3680043.8.1055' // Example registered root
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  return `${root}.${timestamp}.${random}`
}

// Map scope to DICOM modality
function getModality(scope) {
  switch (scope) {
    case 'derm': return 'XC' // External-camera Photography (dermatoscopy)
    case 'opth': return 'OP' // Ophthalmic Photography
    case 'oto': return 'XC'  // External-camera Photography
    case 'micro': return 'XC'
    default: return 'OT' // Other
  }
}

// Map body part to DICOM Body Part Examined tag
function getBodyPart(bodyPart) {
  const map = {
    arm: 'ARM',
    chest: 'CHEST',
    ears: 'EAR',
    hand: 'HAND',
    head: 'HEAD',
    foot: 'FOOT',
    leg: 'LEG',
  }
  return map[bodyPart] || ''
}

/**
 * Convert a JPEG image blob to a DICOM Secondary Capture .dcm ArrayBuffer.
 *
 * @param {Blob} jpegBlob - The JPEG image data
 * @param {Object} metadata - Patient and image metadata
 * @param {string} metadata.patientName - Patient name
 * @param {string} metadata.patientId - Patient ID
 * @param {string} metadata.dateOfBirth - DOB (YYYY-MM-DD)
 * @param {string} metadata.scope - Image scope (derm, opth, oto, micro)
 * @param {string} metadata.bodyPart - Body part (arm, chest, etc.)
 * @param {string} metadata.notes - Clinical notes
 * @param {string} metadata.filename - Original filename
 * @returns {Promise<ArrayBuffer>} - DICOM file as ArrayBuffer
 */
export async function jpegToDicom(jpegBlob, metadata = {}) {
  const jpegArrayBuffer = await jpegBlob.arrayBuffer()
  const jpegData = new Uint8Array(jpegArrayBuffer)

  // Decode JPEG to get dimensions
  const img = await createImageBitmap(jpegBlob)
  const width = img.width
  const height = img.height
  img.close()

  // Current date/time for DICOM tags
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '') // HHMMSS
  const dobStr = (metadata.dateOfBirth || '').replace(/-/g, '')

  // Study/Series/Instance UIDs
  const studyUID = generateUID()
  const seriesUID = generateUID()
  const instanceUID = generateUID()

  // Build DICOM dataset
  const dataset = {
    // ─── Patient Module ─────────────────────────────────────────
    PatientName: metadata.patientName || 'Anonymous',
    PatientID: metadata.patientId || '',
    PatientBirthDate: dobStr,
    PatientSex: '',

    // ─── General Study Module ───────────────────────────────────
    StudyInstanceUID: studyUID,
    StudyDate: dateStr,
    StudyTime: timeStr,
    StudyDescription: 'IXOPE Medical Examination',
    AccessionNumber: '',
    ReferringPhysicianName: '',

    // ─── General Series Module ──────────────────────────────────
    SeriesInstanceUID: seriesUID,
    SeriesNumber: '1',
    Modality: getModality(metadata.scope),
    SeriesDescription: `${(metadata.scope || '').toUpperCase()} - ${metadata.bodyPart || 'General'}`,
    BodyPartExamined: getBodyPart(metadata.bodyPart),

    // ─── General Equipment Module ───────────────────────────────
    Manufacturer: 'IXOPE Medical',
    ManufacturerModelName: 'IXOPE Device',
    SoftwareVersions: '1.0.0',

    // ─── SC Equipment Module ────────────────────────────────────
    ConversionType: 'DI', // Digitized Image

    // ─── General Image Module ───────────────────────────────────
    InstanceNumber: '1',
    ContentDate: dateStr,
    ContentTime: timeStr,
    ImageComments: metadata.notes || '',

    // ─── Image Pixel Module ─────────────────────────────────────
    SamplesPerPixel: 3,
    PhotometricInterpretation: 'YBR_FULL_422',
    Rows: height,
    Columns: width,
    BitsAllocated: 8,
    BitsStored: 8,
    HighBit: 7,
    PixelRepresentation: 0,
    PlanarConfiguration: 0,

    // ─── SOP Common Module ──────────────────────────────────────
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.7', // Secondary Capture Image Storage
    SOPInstanceUID: instanceUID,
    SpecificCharacterSet: 'ISO_IR 100',

    // ─── Encapsulated pixel data ────────────────────────────────
    _vrMap: {
      PixelData: 'OW',
    },
  }

  // Create DICOM dictionary from the dataset
  const dicomDict = new DicomDict({
    TransferSyntaxUID: '1.2.840.10008.1.2.4.50', // JPEG Baseline
  })

  // Set the dataset values
  const dicomMeta = DicomMetaDictionary.naturalizeDataset(dataset)
  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dicomMeta)

  // Set file meta information
  dicomDict.meta = DicomMetaDictionary.denaturalizeDataset({
    MediaStorageSOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
    MediaStorageSOPInstanceUID: instanceUID,
    TransferSyntaxUID: '1.2.840.10008.1.2.4.50',
    ImplementationClassUID: '1.2.826.0.1.3680043.8.1055.1',
    ImplementationVersionName: 'IXOPE_DCMJS',
  })

  // Add encapsulated JPEG pixel data
  // For JPEG transfer syntax, pixel data is encapsulated in fragments
  const pixelDataElement = {
    vr: 'OB',
    Value: undefined,
    InlineBinary: undefined,
  }

  // Create encapsulated frame with offset table
  const baseOffset = new Uint32Array([0])
  const baseOffsetBuffer = baseOffset.buffer

  // Build encapsulated pixel data (Item delimiter format)
  const itemTag = new Uint8Array([0xFE, 0xFF, 0x00, 0xE0]) // Item tag
  const delimiterTag = new Uint8Array([0xFE, 0xFF, 0xDD, 0xE0]) // Sequence Delimiter

  // Basic offset table item (empty or with offset)
  const offsetLength = new Uint32Array([4])
  const offsetItem = new Uint8Array([
    ...itemTag,
    ...new Uint8Array(offsetLength.buffer),
    ...new Uint8Array(baseOffsetBuffer),
  ])

  // JPEG data item
  const jpegLength = new Uint32Array([jpegData.length])
  const paddedLength = jpegData.length % 2 === 0 ? jpegData.length : jpegData.length + 1
  const jpegPaddedLength = new Uint32Array([paddedLength])
  const jpegItem = new Uint8Array(4 + 4 + paddedLength)
  jpegItem.set(itemTag, 0)
  jpegItem.set(new Uint8Array(jpegPaddedLength.buffer), 4)
  jpegItem.set(jpegData, 8)

  // Sequence delimiter
  const delimiterLength = new Uint32Array([0])
  const delimiter = new Uint8Array([
    ...delimiterTag,
    ...new Uint8Array(delimiterLength.buffer),
  ])

  // Combine: offset table + jpeg item + delimiter
  const encapsulatedData = new Uint8Array(offsetItem.length + jpegItem.length + delimiter.length)
  encapsulatedData.set(offsetItem, 0)
  encapsulatedData.set(jpegItem, offsetItem.length)
  encapsulatedData.set(delimiter, offsetItem.length + jpegItem.length)

  // Set pixel data in the DICOM dict
  const pixelDataTag = '7FE00010'
  dicomDict.dict[pixelDataTag] = {
    vr: 'OB',
    Value: [encapsulatedData.buffer],
  }

  // Write to ArrayBuffer
  const arrayBuffer = dicomDict.write()
  return arrayBuffer
}

/**
 * Convert multiple JPEG images to DICOM files.
 * Returns array of { filename, arrayBuffer } objects.
 */
export async function convertImagesToDicom(imageBlobs, patientInfo = {}) {
  const results = []

  for (let i = 0; i < imageBlobs.length; i++) {
    const { blob, metadata } = imageBlobs[i]
    try {
      const dcmBuffer = await jpegToDicom(blob, {
        patientName: patientInfo.name || 'Anonymous',
        patientId: patientInfo.id || '',
        dateOfBirth: patientInfo.dateOfBirth || '',
        scope: metadata.scope || '',
        bodyPart: metadata.bodyPart || '',
        notes: metadata.notes || '',
        filename: metadata.filename || `image_${i + 1}`,
      })

      const filename = (metadata.filename || `image_${i + 1}`).replace(/\.(jpg|jpeg|png)$/i, '.dcm')
      results.push({ filename, arrayBuffer: dcmBuffer })
    } catch (err) {
      console.error(`DICOM conversion failed for image ${i + 1}:`, err)
    }
  }

  return results
}
