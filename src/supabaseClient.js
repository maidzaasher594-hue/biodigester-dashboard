import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://edtuuopfpjmhockbueaw.supabase.co"
const supabaseKey = "sb_publishable_c53nVL2quncPUWpr3flVOQ_vfdL34tf"

export const supabase = createClient(supabaseUrl, supabaseKey)