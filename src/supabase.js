import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const getMissingSupabaseKeys = () => [
	['VITE_SUPABASE_URL', supabaseUrl],
	['VITE_SUPABASE_ANON_KEY', supabaseAnonKey],
].filter(([, value]) => !String(value || '').trim())

export const hasSupabaseConfig = getMissingSupabaseKeys().length === 0

export const assertSupabaseConfig = () => {
	const missingSupabaseKeys = getMissingSupabaseKeys()
	if (missingSupabaseKeys.length === 0) return

	const keys = missingSupabaseKeys.map(([key]) => key).join(', ')
	throw new Error(`Missing Supabase configuration: ${keys}`)
}

const clientUrl = hasSupabaseConfig ? supabaseUrl : 'https://placeholder.supabase.co'
const clientKey = hasSupabaseConfig ? supabaseAnonKey : 'placeholder-anon-key'

export const supabase = createClient(clientUrl, clientKey)
export const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'project-images'