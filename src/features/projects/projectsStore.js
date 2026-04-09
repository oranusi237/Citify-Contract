import { collection, deleteDoc, doc, documentId, getDocs, limit, onSnapshot, orderBy, query, setDoc, startAfter } from 'firebase/firestore'
import { db } from '../../firebase'
import { assertSupabaseConfig, supabase, supabaseBucket } from '../../supabase'
import { normalizeListingType } from './listingTypes'
import { formatNaira, parseNairaAmount } from './price'
import { STORAGE_PATHS } from '../../utils/storagePaths'

const PROJECTS_COLLECTION = 'projects'
const projectsRef = collection(db, PROJECTS_COLLECTION)
export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PROJECT_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const normalizeImages = (project) => {
  if (Array.isArray(project.images) && project.images.length > 0) {
    return project.images.filter(Boolean)
  }
  return project.image ? [project.image] : []
}

const normalizePlotStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (['sold-out', 'sold', 'reserved'].includes(normalized)) return 'sold-out'
  return 'available'
}

const normalizePlotOptions = (project) => {
  if (!Array.isArray(project.plotOptions)) {
    return []
  }

  return project.plotOptions
    .map((option) => ({
      size: String(option?.size || '').trim(),
      price: formatNaira(option?.price),
      buildingType: String(option?.buildingType || '').trim(),
      status: normalizePlotStatus(option?.status),
      featured: Boolean(option?.featured),
    }))
    .filter((option) => option.size && option.price)
}

const resolveDisplayPrice = (listingType, landPlotMode, plotOptions, fallbackPrice) => {
  if (listingType === 'land' && landPlotMode === 'multiple' && plotOptions.length > 0) {
    const minAmount = plotOptions.reduce((min, option) => {
      const amount = parseNairaAmount(option.price)
      if (!amount) return min
      return min === 0 ? amount : Math.min(min, amount)
    }, 0)

    return formatNaira(minAmount)
  }

  return formatNaira(fallbackPrice)
}

const normalizeProject = (project) => {
  const listingType = normalizeListingType(project.listingType)
  const plotOptions = normalizePlotOptions(project)
  const isLand = listingType === 'land'
  const landPlotMode = isLand
    ? (project.landPlotMode === 'multiple' ? 'multiple' : (plotOptions.length > 0 ? 'multiple' : 'single'))
    : 'single'

  return {
    ...project,
    id: String(project.id),
    listingType,
    featured: Boolean(project.featured),
    landPlotMode,
    buildingType: isLand ? (project.buildingType || '') : '',
    landOptionStatus: isLand ? normalizePlotStatus(project.landOptionStatus) : 'available',
    landOptionFeatured: isLand ? Boolean(project.landOptionFeatured) : false,
    details: project.details || '',
    plotOptions: isLand ? plotOptions : [],
    price: resolveDisplayPrice(listingType, landPlotMode, plotOptions, project.price),
    paymentPlan: project.paymentPlan || '',
    images: normalizeImages(project),
    image: normalizeImages(project)[0] || '',
    features: Array.isArray(project.features) ? project.features : [],
    specifications: {
      area: project.specifications?.area || '',
      units: project.specifications?.units || '',
      floors: project.specifications?.floors || '',
      parking: project.specifications?.parking || '',
    },
  }
}

const sortProjects = (projects) =>
  [...projects].sort((a, b) => Number(a.id) - Number(b.id))

const readSnapshot = (snapshot) =>
  sortProjects(snapshot.docs.map((item) => normalizeProject(item.data())))

export const seedProjectsIfEmpty = async () => {
  const snapshot = await getDocs(projectsRef)
  return readSnapshot(snapshot)
}

export const subscribeToProjects = (onData, onError) =>
  onSnapshot(
    query(projectsRef, limit(300)),
    (snapshot) => {
      const projects = readSnapshot(snapshot)
      onData(projects)
    },
    (error) => {
      if (onError) {
        onError(error)
      }
    }
  )

export const subscribeToProjectById = (id, onData, onError) =>
  onSnapshot(
    doc(db, PROJECTS_COLLECTION, String(id)),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null)
        return
      }

      onData(normalizeProject(snapshot.data()))
    },
    (error) => {
      if (onError) {
        onError(error)
      }
    }
  )

export const fetchProjectsPage = async ({ pageSize = 50, cursor = null } = {}) => {
  const constraints = [orderBy(documentId()), limit(pageSize)]
  if (cursor) {
    constraints.push(startAfter(cursor))
  }

  const pageQuery = query(projectsRef, ...constraints)
  const snapshot = await getDocs(pageQuery)
  const projects = readSnapshot(snapshot)
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null

  return {
    projects,
    cursor: lastDoc,
    hasMore: snapshot.docs.length === pageSize,
  }
}

export const upsertProject = async (project) => {
  const normalized = normalizeProject(project)
  await setDoc(doc(db, PROJECTS_COLLECTION, String(normalized.id)), normalized)
}

export const deleteProject = async (id) => {
  await deleteDoc(doc(db, PROJECTS_COLLECTION, String(id)))
}

export const resetProjects = async () => {
  const snapshot = await getDocs(projectsRef)
  return readSnapshot(snapshot)
}

export const validateProjectImageFile = (file) => {
  if (!file || typeof file !== 'object') {
    throw new Error('Invalid file selected.')
  }

  const fileName = String(file.name || 'image')
  const fileType = String(file.type || '').toLowerCase()
  const fileSize = Number(file.size || 0)

  if (!PROJECT_IMAGE_ALLOWED_TYPES.includes(fileType)) {
    throw new Error('Only JPG, PNG, or WebP images are allowed.')
  }

  if (fileSize <= 0) {
    throw new Error(`Image ${fileName} is empty or invalid.`)
  }

  if (fileSize > PROJECT_IMAGE_MAX_BYTES) {
    throw new Error('Image exceeds the 5MB size limit.')
  }
}

export const uploadProjectImage = async (file) => {
  assertSupabaseConfig()
  validateProjectImageFile(file)

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${STORAGE_PATHS.projectsImages}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase
    .storage
    .from(supabaseBucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase
    .storage
    .from(supabaseBucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}
