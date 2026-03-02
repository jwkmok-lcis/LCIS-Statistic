'use client'

import { useState, useTransition } from 'react'
import { getWeeklySummary } from './actions'

type District = { id: string; name: string }
type CellData = {
  lordsTable: number | null
  prophesying: number | null
  smallGroup: { adults: number; highschoolers: number; children: number } | null
  offerings: { envelopes: number; amount: number }
  electronicOfferings: number
  childrenAttendance: { present: number; total: number } | null
  youthAttendance: { present: number; total: number } | null
}

type ReportData = {
  districts: District[]
  weeks: string[]
  data: Record<string, CellData>
}

type ViewMode = 'lords-table' | 'prophesying' | 'small-group' | 'offerings' | 'children' | 'youth' | 'summary'

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'lords-table', label: "Lord's Table" },
  { key: 'prophesying', label: 'Prophesying' },
  { key: 'small-group', label: 'Small Group' },
  { key: 'offerings', label: 'Offerings' },
  { key: 'children', label: "Children's" },
  { key: 'youth', label: 'Youth' },
]

function getDefaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 28) // last 4 weeks
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReportsClient({ initial }: { initial: ReportData }) {
  const defaultRange = getDefaultRange()
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)
  const [report, setReport] = useState<ReportData>(initial)
  const [view, setView] = useState<ViewMode>('summary')
  const [isPending, startTransition] = useTransition()

  function handleLoad() {
    startTransition(async () => {
      const data = await getWeeklySummary(startDate, endDate)
      setReport(data)
    })
  }

  const { districts, weeks, data } = report

  // Compute district totals for summary
  function getDistrictTotals(districtId: string) {
    let ltTotal = 0, ltCount = 0
    let prTotal = 0, prCount = 0
    let sgTotal = 0, sgCount = 0
    let ofEnvelopes = 0, ofAmount = 0, eoAmount = 0
    let chPresent = 0, chTotal = 0
    let ytPresent = 0, ytTotal = 0

    for (const week of weeks) {
      const cell = data[`${districtId}:${week}`]
      if (!cell) continue
      if (cell.lordsTable !== null) { ltTotal += cell.lordsTable; ltCount++ }
      if (cell.prophesying !== null) { prTotal += cell.prophesying; prCount++ }
      if (cell.smallGroup) { sgTotal += cell.smallGroup.adults + cell.smallGroup.highschoolers + cell.smallGroup.children; sgCount++ }
      ofEnvelopes += cell.offerings.envelopes
      ofAmount += cell.offerings.amount
      eoAmount += cell.electronicOfferings
      if (cell.childrenAttendance) { chPresent += cell.childrenAttendance.present; chTotal += cell.childrenAttendance.total }
      if (cell.youthAttendance) { ytPresent += cell.youthAttendance.present; ytTotal += cell.youthAttendance.total }
    }

    return {
      ltAvg: ltCount ? Math.round(ltTotal / ltCount) : null,
      ltTotal,
      prAvg: prCount ? Math.round(prTotal / prCount) : null,
      prTotal,
      sgAvg: sgCount ? Math.round(sgTotal / sgCount) : null,
      ofEnvelopes,
      ofAmount,
      eoAmount,
      totalOffering: ofAmount + eoAmount,
      chRate: chTotal ? Math.round((chPresent / chTotal) * 100) : null,
      ytRate: ytTotal ? Math.round((ytPresent / ytTotal) * 100) : null,
    }
  }

  // Grand totals across all districts
  function getGrandTotals() {
    const all = districts.map(d => getDistrictTotals(d.id))
    return {
      ltAvg: all.some(a => a.ltAvg !== null) ? Math.round(all.reduce((s, a) => s + (a.ltTotal || 0), 0) / Math.max(weeks.length, 1)) : null,
      prTotal: all.reduce((s, a) => s + a.prTotal, 0),
      ofAmount: all.reduce((s, a) => s + a.ofAmount, 0),
      eoAmount: all.reduce((s, a) => s + a.eoAmount, 0),
      totalOffering: all.reduce((s, a) => s + a.totalOffering, 0),
    }
  }

  // Week column totals
  function getWeekTotals(week: string) {
    let lt = 0, pr = 0, sg = 0, ofAmt = 0, eo = 0
    for (const d of districts) {
      const cell = data[`${d.id}:${week}`]
      if (!cell) continue
      lt += cell.lordsTable ?? 0
      pr += cell.prophesying ?? 0
      if (cell.smallGroup) sg += cell.smallGroup.adults + cell.smallGroup.highschoolers + cell.smallGroup.children
      ofAmt += cell.offerings.amount
      eo += cell.electronicOfferings
    }
    return { lt, pr, sg, ofAmt, eo, total: ofAmt + eo }
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={handleLoad}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isPending ? 'Loading...' : 'Load'}
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              view === v.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {districts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No districts found. Create districts in Admin first.
        </div>
      ) : weeks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No weeks in selected range. Adjust the date range and click Load.
        </div>
      ) : (
        <>
          {/* Summary View */}
          {view === 'summary' && (
            <div className="space-y-4">
              {/* Grand totals */}
              {(() => {
                const grand = getGrandTotals()
                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
                      <p className="text-xs text-blue-600 font-medium">Avg Lord&apos;s Table</p>
                      <p className="text-2xl font-bold text-blue-900">{grand.ltAvg ?? '—'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 text-center">
                      <p className="text-xs text-purple-600 font-medium">Total Prophecies</p>
                      <p className="text-2xl font-bold text-purple-900">{grand.prTotal}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                      <p className="text-xs text-green-600 font-medium">Physical Offering</p>
                      <p className="text-2xl font-bold text-green-900">{fmtMoney(grand.ofAmount)}</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl border border-cyan-200 p-4 text-center">
                      <p className="text-xs text-cyan-600 font-medium">Electronic Offering</p>
                      <p className="text-2xl font-bold text-cyan-900">{fmtMoney(grand.eoAmount)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
                      <p className="text-xs text-amber-600 font-medium">Total Offering</p>
                      <p className="text-2xl font-bold text-amber-900">{fmtMoney(grand.totalOffering)}</p>
                    </div>
                  </div>
                )
              })()}

              {/* Per-district summary table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">District</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">LT Avg</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Prophecies</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">SG Avg</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Envelopes</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Physical $</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Electronic $</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Total $</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Children %</th>
                      <th className="text-right px-3 py-3 font-semibold text-gray-700">Youth %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {districts.map(d => {
                      const t = getDistrictTotals(d.id)
                      return (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.ltAvg ?? '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.prTotal || '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.sgAvg ?? '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.ofEnvelopes || '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.ofAmount ? fmtMoney(t.ofAmount) : '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.eoAmount ? fmtMoney(t.eoAmount) : '—'}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{t.totalOffering ? fmtMoney(t.totalOffering) : '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.chRate !== null ? `${t.chRate}%` : '—'}</td>
                          <td className="px-3 py-2.5 text-right text-gray-700">{t.ytRate !== null ? `${t.ytRate}%` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lord's Table View */}
          {view === 'lords-table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">District</th>
                    {weeks.map(w => (
                      <th key={w} className="text-right px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{fmtDate(w)}</th>
                    ))}
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 bg-gray-100">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {districts.map(d => {
                    const vals = weeks.map(w => data[`${d.id}:${w}`]?.lordsTable ?? null)
                    const filled = vals.filter(v => v !== null) as number[]
                    const avg = filled.length ? Math.round(filled.reduce((a, b) => a + b, 0) / filled.length) : null
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{d.name}</td>
                        {vals.map((v, i) => (
                          <td key={weeks[i]} className="px-3 py-2.5 text-right text-gray-700">{v ?? <span className="text-gray-300">—</span>}</td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 bg-gray-50">{avg ?? '—'}</td>
                      </tr>
                    )
                  })}
                  {/* Totals row */}
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-4 py-2.5 text-blue-900 sticky left-0 bg-blue-50">Total</td>
                    {weeks.map(w => {
                      const t = getWeekTotals(w)
                      return <td key={w} className="px-3 py-2.5 text-right text-blue-900">{t.lt || '—'}</td>
                    })}
                    <td className="px-3 py-2.5 text-right text-blue-900 bg-blue-100">
                      {(() => {
                        const totals = weeks.map(w => getWeekTotals(w).lt).filter(Boolean)
                        return totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : '—'
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Prophesying View */}
          {view === 'prophesying' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">District</th>
                    {weeks.map(w => (
                      <th key={w} className="text-right px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{fmtDate(w)}</th>
                    ))}
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 bg-gray-100">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {districts.map(d => {
                    const vals = weeks.map(w => data[`${d.id}:${w}`]?.prophesying ?? null)
                    const total = vals.filter(v => v !== null).reduce((a, b) => a! + b!, 0) as number
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{d.name}</td>
                        {vals.map((v, i) => (
                          <td key={weeks[i]} className="px-3 py-2.5 text-right text-gray-700">{v ?? <span className="text-gray-300">—</span>}</td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 bg-gray-50">{total || '—'}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-purple-50 font-semibold">
                    <td className="px-4 py-2.5 text-purple-900 sticky left-0 bg-purple-50">Total</td>
                    {weeks.map(w => {
                      const t = getWeekTotals(w)
                      return <td key={w} className="px-3 py-2.5 text-right text-purple-900">{t.pr || '—'}</td>
                    })}
                    <td className="px-3 py-2.5 text-right text-purple-900 bg-purple-100">
                      {weeks.reduce((s, w) => s + getWeekTotals(w).pr, 0) || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Small Group View */}
          {view === 'small-group' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">District</th>
                    {weeks.map(w => (
                      <th key={w} className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{fmtDate(w)}</th>
                    ))}
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 bg-gray-100">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {districts.map(d => {
                    const vals = weeks.map(w => data[`${d.id}:${w}`]?.smallGroup ?? null)
                    const filled = vals.filter(Boolean) as { adults: number; highschoolers: number; children: number }[]
                    const avg = filled.length ? Math.round(filled.reduce((s, v) => s + v.adults + v.highschoolers + v.children, 0) / filled.length) : null
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{d.name}</td>
                        {vals.map((v, i) => (
                          <td key={weeks[i]} className="px-3 py-2.5 text-center text-gray-700">
                            {v ? (
                              <span title={`A:${v.adults} H:${v.highschoolers} C:${v.children}`}>
                                {v.adults + v.highschoolers + v.children}
                                <span className="text-[10px] text-gray-400 ml-1">({v.adults}/{v.highschoolers}/{v.children})</span>
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 bg-gray-50">{avg ?? '—'}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-green-50 font-semibold">
                    <td className="px-4 py-2.5 text-green-900 sticky left-0 bg-green-50">Total</td>
                    {weeks.map(w => {
                      const t = getWeekTotals(w)
                      return <td key={w} className="px-3 py-2.5 text-center text-green-900">{t.sg || '—'}</td>
                    })}
                    <td className="px-3 py-2.5 text-right text-green-900 bg-green-100">
                      {(() => {
                        const totals = weeks.map(w => getWeekTotals(w).sg).filter(Boolean)
                        return totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : '—'
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                Numbers in parentheses: Adults / High Schoolers / Children
              </div>
            </div>
          )}

          {/* Offerings View */}
          {view === 'offerings' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">District</th>
                      {weeks.map(w => (
                        <th key={w} className="text-right px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{fmtDate(w)}</th>
                      ))}
                      <th className="text-right px-3 py-3 font-semibold text-gray-700 bg-gray-100">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {districts.map(d => {
                      const t = getDistrictTotals(d.id)
                      return (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{d.name}</td>
                          {weeks.map(w => {
                            const cell = data[`${d.id}:${w}`]
                            const physical = cell?.offerings.amount ?? 0
                            const electronic = cell?.electronicOfferings ?? 0
                            const total = physical + electronic
                            return (
                              <td key={w} className="px-3 py-2.5 text-right text-gray-700">
                                {total > 0 ? (
                                  <span title={`Physical: ${fmtMoney(physical)}, Electronic: ${fmtMoney(electronic)}`}>
                                    {fmtMoney(total)}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900 bg-gray-50">
                            {t.totalOffering ? fmtMoney(t.totalOffering) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-amber-50 font-semibold">
                      <td className="px-4 py-2.5 text-amber-900 sticky left-0 bg-amber-50">Total</td>
                      {weeks.map(w => {
                        const t = getWeekTotals(w)
                        return <td key={w} className="px-3 py-2.5 text-right text-amber-900">{t.total ? fmtMoney(t.total) : '—'}</td>
                      })}
                      <td className="px-3 py-2.5 text-right text-amber-900 bg-amber-100">
                        {fmtMoney(weeks.reduce((s, w) => s + getWeekTotals(w).total, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                  Hover amounts to see physical vs electronic breakdown
                </div>
              </div>
            </div>
          )}

          {/* Children View */}
          {view === 'children' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">District</th>
                    {weeks.map(w => (
                      <th key={w} className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{fmtDate(w)}</th>
                    ))}
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 bg-gray-100">Avg %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {districts.map(d => {
                    const vals = weeks.map(w => data[`${d.id}:${w}`]?.childrenAttendance ?? null)
                    const rates = vals.filter(Boolean).map(v => v!.total > 0 ? Math.round((v!.present / v!.total) * 100) : null).filter(v => v !== null) as number[]
                    const avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{d.name}</td>
                        {vals.map((v, i) => (
                          <td key={weeks[i]} className="px-3 py-2.5 text-center text-gray-700">
                            {v ? (
                              <span>{v.present}/{v.total}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 bg-gray-50">
                          {avg !== null ? `${avg}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                Showing present / total members per week
              </div>
            </div>
          )}

          {/* Youth View */}
          {view === 'youth' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">District</th>
                    {weeks.map(w => (
                      <th key={w} className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap">{fmtDate(w)}</th>
                    ))}
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 bg-gray-100">Avg %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {districts.map(d => {
                    const vals = weeks.map(w => data[`${d.id}:${w}`]?.youthAttendance ?? null)
                    const rates = vals.filter(Boolean).map(v => v!.total > 0 ? Math.round((v!.present / v!.total) * 100) : null).filter(v => v !== null) as number[]
                    const avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null
                    return (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{d.name}</td>
                        {vals.map((v, i) => (
                          <td key={weeks[i]} className="px-3 py-2.5 text-center text-gray-700">
                            {v ? (
                              <span>{v.present}/{v.total}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 bg-gray-50">
                          {avg !== null ? `${avg}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                Showing present / total members per week
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
