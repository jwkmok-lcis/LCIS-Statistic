import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OfferingForm from '@/components/forms/OfferingForm'

export default async function OfferingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; district?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const districtId = params.district
  const weekDate = params.week
  if (!districtId || !weekDate) redirect('/leader/dashboard')

  const { data: district } = await supabase
    .from('districts')
    .select('name')
    .eq('id', districtId)
    .single()

  if (!district) redirect('/leader/dashboard')

  let existingRecords: Array<{
    category: string
    envelope_count: number
    total_amount: number
    notes: string | null
  }> = []

  const { data: weeklyRecord } = await supabase
    .from('weekly_records')
    .select('id')
    .eq('district_id', districtId)
    .eq('week_date', weekDate)
    .single()

  if (weeklyRecord) {
    const { data: records } = await supabase
      .from('offering_records')
      .select('category, envelope_count, total_amount, notes')
      .eq('weekly_record_id', weeklyRecord.id)

    existingRecords = records || []
  }

  return (
    <div className="py-8 px-4">
      <OfferingForm
        districtId={districtId}
        districtName={district.name}
        weekDate={weekDate}
        existingRecords={existingRecords}
      />
    </div>
  )
}
