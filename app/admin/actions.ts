'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ==================== DISTRICTS ====================

export async function createDistrict(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) return { error: 'Not authorised' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'District name is required' }

  const { error } = await supabase
    .from('districts')
    .insert({ name })

  if (error) {
    if (error.code === '23505') return { error: 'A district with that name already exists' }
    return { error: error.message }
  }

  revalidatePath('/admin/districts')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteDistrict(districtId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) return { error: 'Not authorised' }

  const { error } = await supabase
    .from('districts')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', districtId)

  if (error) return { error: error.message }

  revalidatePath('/admin/districts')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function reactivateDistrict(districtId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) return { error: 'Not authorised' }

  const { error } = await supabase
    .from('districts')
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq('id', districtId)

  if (error) return { error: error.message }

  revalidatePath('/admin/districts')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ==================== USERS ====================

export async function createUser(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) return { error: 'Not authorised' }

  const email = (formData.get('email') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const password = formData.get('password') as string
  const rolesArr = formData.getAll('roles') as string[]

  if (!email || !name || !password) {
    return { error: 'Email, name, and password are required' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  // Sign up user (triggers handle_new_user to create profile)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (signUpError) return { error: signUpError.message }

  // Update roles if specified (after the trigger creates the profile)
  if (rolesArr.length > 0 && signUpData?.user?.id) {
    // Small delay to allow trigger to complete
    await new Promise(r => setTimeout(r, 500))
    await supabase
      .from('profiles')
      .update({ roles: rolesArr })
      .eq('id', signUpData.user.id)
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateUserRoles(userId: string, roles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) return { error: 'Not authorised' }

  const { error } = await supabase
    .from('profiles')
    .update({ roles })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function assignUserToDistrict(userId: string, districtId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_districts')
    .insert({ user_id: userId, district_id: districtId })

  if (error) {
    if (error.code === '23505') return { error: 'User is already assigned to this district' }
    return { error: error.message }
  }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function removeUserFromDistrict(userId: string, districtId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_districts')
    .delete()
    .eq('user_id', userId)
    .eq('district_id', districtId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deactivateUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('ADMIN')) return { error: 'Not authorised' }

  if (userId === user.id) return { error: 'Cannot deactivate yourself' }

  const { error } = await supabase
    .from('profiles')
    .update({ active: false })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

// ==================== PLEDGE CAMPAIGNS ====================

export async function createPledgeCampaign(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string

  const { error } = await supabase
    .from('pledge_campaigns')
    .insert({
      name,
      description: description || null,
      start_date: startDate,
      end_date: endDate || null,
    })

  if (error) return { error: error.message }
  revalidatePath('/admin/offerings')
  return { success: true }
}

// ==================== ELECTRONIC OFFERINGS ====================

export async function saveElectronicOffering(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const districtId = formData.get('district_id') as string
  const weekDate = formData.get('week_date') as string
  const category = formData.get('category') as string
  const amount = parseFloat(formData.get('amount') as string)
  const reference = formData.get('reference') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('electronic_offerings')
    .insert({
      district_id: districtId,
      week_date: weekDate,
      category,
      amount,
      reference: reference || null,
      entered_by: user.id,
      notes: notes || null,
    })

  if (error) return { error: error.message }
  revalidatePath('/accounting')
  return { success: true }
}
