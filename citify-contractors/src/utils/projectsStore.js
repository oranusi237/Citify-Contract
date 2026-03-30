import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { supabase, supabaseBucket } from '../supabase'
import { normalizeListingType } from './listingTypes'
import { formatNaira, parseNairaAmount } from './price'

const PROJECTS_COLLECTION = 'projects'
const projectsRef = collection(db, PROJECTS_COLLECTION)

const normalizeImages = (project) => {
  if (Array.isArray(project.images) && project.images.length > 0) {
    return project.images.filter(Boolean)
  }
  return project.image ? [project.image] : []
}

const normalizePlotOptions = (project) => {
  if (!Array.isArray(project.plotOptions)) {
    return []
  }

  return project.plotOptions
    .map((option) => ({
      size: String(option?.size || '').trim(),
      price: formatNaira(option?.price),
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
    landPlotMode,
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
    projectsRef,
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

export const uploadProjectImage = async (file) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `projects/images/${Date.now()}_${safeName}`

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
