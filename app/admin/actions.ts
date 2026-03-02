'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDistrict(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('districts')
    .insert({ name, description: description || null })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/districts')
}

export async function updateUserRoles(userId: string, roles: string[]) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ roles })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function assignUserToDistrict(userId: string, districtId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_districts')
    .insert({ user_id: userId, district_id: districtId })

  if (error) {
    if (error.code === '23505') return { error: 'User is already assigned to this district' }
    return { error: error.message }
  }
  revalidatePath('/admin/users')
}

export async function removeUserFromDistrict(userId: string, districtId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('user_districts')
    .delete()
    .eq('user_id', userId)
    .eq('district_id', districtId)

  if (error) return { error: error.message }
  revalidatePath('/admin/users')
}

export async function createPledgeCampaign(formData: FormData) {
  const supabase = await createClient()
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
}

export async function saveElectronicOffering(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
}
