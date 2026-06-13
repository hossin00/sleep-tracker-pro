import { useState, useEffect } from 'react'
import { Plus, Moon, Sun, TrendingUp, Star, X, ChevronLeft, ChevronRight } from 'lucide-react'

const ACCENT = '#6366F1'

interface SleepEntry {
  id: string
  date: string
  bedtime: string
  waketime: string
  duration: number
  quality: number
  notes: string
  tags: string[]
}

const QUALITY_LABELS = ['', 'Terrible', 'Poor', 'Fair', 'Good', 'Excellent']
const QUALITY_COLORS = ['', '#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E']
const SLEEP_TAGS = ['No caffeine', 'Exercise', 'Late meal', 'Stress', 'Nap', 'Alcohol', 'Screen time', 'Meditation']

function parseTime(date: string, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date + 'T00:00:00')
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

function calcDuration(date: string, bedtime: string, waketime: string): number {
  let bed = parseTime(date, bedtime)
  let wake = parseTime(date, waketime)
  if (wake <= bed) wake += 86400000 // next day
  return (wake - bed) / 3600000
}

function formatDuration(h: number): string {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${hours}h ${mins}m`
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function App() {
  const [entries, setEntries] = useState<SleepEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('sleep_entries') || '[]') } catch { return [] }
  })
  const [tab, setTab] = useState<'log' | 'history' | 'insights'>('log')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: todayStr(), bedtime: '23:00', waketime: '07:00', quality: 3, notes: '', tags: [] as string[] })
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    localStorage.setItem('sleep_entries', JSON.stringify(entries))
  }, [entries])

  function saveEntry() {
    const dur = calcDuration(form.date, form.bedtime, form.waketime)
    const entry: SleepEntry = {
      id: Date.now().toString(),
      date: form.date,
      bedtime: form.bedtime,
      waketime: form.waketime,
      duration: dur,
      quality: form.quality,
      notes: form.notes.trim(),
      tags: form.tags,
    }
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== form.date)
      return [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))
    })
    setShowAdd(false)
    setForm({ date: todayStr(), bedtime: '23:00', waketime: '07:00', quality: 3, notes: '', tags: [] })
  }

  function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  // Week data
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  // Stats
  const last14 = entries.filter(e => {
    const d = new Date(todayStr())
    d.setDate(d.getDate() - 14)
    return e.date >= d.toISOString().slice(0, 10)
  })
  const avgDur = last14.length ? last14.reduce((s, e) => s + e.duration, 0) / last14.length : 0
  const avgQuality = last14.length ? last14.reduce((s, e) => s + e.quality, 0) / last14.length : 0

  const todayEntry = entries.find(e => e.date === todayStr())

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#08080F', minHeight: '100vh', color: '#F5F5F5' }}>
      {/* Header */}
      <div style={{ background: '#0D0D1A', padding: '20px 20px 0', borderBottom: '1px solid #1A1A2E' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Moon size={22} color={ACCENT} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Sleep Tracker</div>
              <div style={{ fontSize: 11, color: '#555' }}>Pro</div>
            </div>
          </div>
          {!showAdd && (
            <button onClick={() => setShowAdd(true)}
              style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Plus size={15} /> Log
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['log', 'history', 'insights'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', color: tab === t ? ACCENT : '#555', fontWeight: tab === t ? 600 : 400, fontSize: 14, borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}` }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
        {tab === 'log' && (
          <>
            {/* Today card */}
            {todayEntry && !showAdd && (
              <div style={{ background: '#0D0D1A', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center', border: '1px solid #1A1A2E' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>LAST NIGHT</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: ACCENT }}>{formatDuration(todayEntry.duration)}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} fill={todayEntry.quality >= s ? QUALITY_COLORS[todayEntry.quality] : 'none'} color={todayEntry.quality >= s ? QUALITY_COLORS[todayEntry.quality] : '#333'} />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                  {todayEntry.bedtime} → {todayEntry.waketime} · {QUALITY_LABELS[todayEntry.quality]}
                </div>
              </div>
            )}

            {!todayEntry && !showAdd && (
              <div style={{ background: '#0D0D1A', borderRadius: 16, padding: 28, marginBottom: 16, textAlign: 'center', border: '1px solid #1A1A2E' }}>
                <Moon size={48} color="#1A1A2E" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#555', fontSize: 14, marginBottom: 16 }}>No sleep logged yet today</div>
                <button onClick={() => setShowAdd(true)}
                  style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '12px 24px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Log Sleep
                </button>
              </div>
            )}

            {/* Add form */}
            {showAdd && (
              <div style={{ background: '#0D0D1A', borderRadius: 16, padding: 22, border: '1px solid #1A1A2E' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>Log Sleep</span>
                  <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}><X size={18} /></button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Date</div>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    style={{ width: '100%', background: '#1A1A2E', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Moon size={12} color={ACCENT} /> Bedtime
                    </div>
                    <input type="time" value={form.bedtime} onChange={e => setForm(p => ({ ...p, bedtime: e.target.value }))}
                      style={{ width: '100%', background: '#1A1A2E', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 16, fontWeight: 600, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sun size={12} color="#FBBF24" /> Wake Time
                    </div>
                    <input type="time" value={form.waketime} onChange={e => setForm(p => ({ ...p, waketime: e.target.value }))}
                      style={{ width: '100%', background: '#1A1A2E', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 16, fontWeight: 600, boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ background: '#1A1A2E', borderRadius: 10, padding: '10px 14px', marginBottom: 14, textAlign: 'center', fontSize: 13, color: '#ccc' }}>
                  Duration: <strong style={{ color: ACCENT }}>{formatDuration(calcDuration(form.date, form.bedtime, form.waketime))}</strong>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Sleep Quality</div>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setForm(p => ({ ...p, quality: s }))}
                        style={{ background: form.quality === s ? QUALITY_COLORS[s] + '33' : '#1A1A2E', border: form.quality === s ? `2px solid ${QUALITY_COLORS[s]}` : '2px solid transparent', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .2s' }}>
                        <Star size={18} fill={form.quality >= s ? QUALITY_COLORS[s] : 'none'} color={QUALITY_COLORS[s]} />
                        <span style={{ fontSize: 9, color: form.quality === s ? QUALITY_COLORS[s] : '#555' }}>{QUALITY_LABELS[s]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SLEEP_TAGS.map(tag => (
                      <button key={tag} onClick={() => setForm(p => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag] }))}
                        style={{ background: form.tags.includes(tag) ? ACCENT + '33' : '#1A1A2E', border: form.tags.includes(tag) ? `1px solid ${ACCENT}` : '1px solid transparent', borderRadius: 8, padding: '4px 10px', color: form.tags.includes(tag) ? ACCENT : '#888', fontSize: 12, cursor: 'pointer' }}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} style={{ width: '100%', background: '#1A1A2E', border: 'none', borderRadius: 10, padding: '11px 12px', color: '#F5F5F5', fontSize: 14, resize: 'none', marginBottom: 14, boxSizing: 'border-box', lineHeight: 1.5 }} />

                <button onClick={saveEntry}
                  style={{ width: '100%', background: ACCENT, border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                  Save Sleep Log
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <>
            {/* Week navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => setWeekOffset(p => p - 1)}
                style={{ background: '#0D0D1A', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#888' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: 14, color: '#ccc' }}>
                {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ago`}
              </span>
              <button onClick={() => setWeekOffset(p => p + 1)} disabled={weekOffset >= 0}
                style={{ background: '#0D0D1A', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: weekOffset >= 0 ? '#333' : '#888' }}><ChevronRight size={18} /></button>
            </div>

            {/* Week bars */}
            <div style={{ background: '#0D0D1A', borderRadius: 16, padding: 18, marginBottom: 16, border: '1px solid #1A1A2E' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100, justifyContent: 'space-between' }}>
                {weekDays.map(day => {
                  const entry = entries.find(e => e.date === day)
                  const h = entry ? Math.min(100, (entry.duration / 10) * 100) : 0
                  const d = new Date(day + 'T00:00:00')
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {entry && <div style={{ fontSize: 9, color: '#888' }}>{Math.floor(entry.duration)}h</div>}
                      <div style={{ width: '100%', height: h || 4, background: entry ? (entry.duration >= 7 ? ACCENT : '#F59E0B') : '#1A1A2E', borderRadius: 4, minHeight: 4, opacity: day > todayStr() ? 0.3 : 1 }} />
                      <div style={{ fontSize: 10, color: day === todayStr() ? ACCENT : '#555' }}>
                        {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 8 }}>7h = healthy sleep threshold</div>
            </div>

            {/* Entries list */}
            {entries.length === 0 && <div style={{ textAlign: 'center', color: '#444', padding: '30px 0', fontSize: 14 }}>No sleep logs yet</div>}
            {entries.slice(0, 30).map(entry => (
              <div key={entry.id} style={{ background: '#0D0D1A', borderRadius: 12, padding: '14px 16px', marginBottom: 8, border: '1px solid #1A1A2E', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: ACCENT + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Moon size={20} color={ACCENT} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#888' }}>{entry.date === todayStr() ? 'Today' : entry.date}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: entry.duration >= 7 ? ACCENT : '#F59E0B' }}>{formatDuration(entry.duration)}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{entry.bedtime} → {entry.waketime}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'flex-end', marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={entry.quality >= s ? QUALITY_COLORS[entry.quality] : 'none'} color={entry.quality >= s ? QUALITY_COLORS[entry.quality] : '#333'} />)}
                  </div>
                  <button onClick={() => deleteEntry(entry.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}><X size={14} /></button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'insights' && (
          <>
            {entries.length < 3 ? (
              <div style={{ textAlign: 'center', color: '#444', padding: '60px 20px', fontSize: 14 }}>Log at least 3 nights to see insights</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    ['Avg Duration', formatDuration(avgDur), avgDur >= 7 ? '#22C55E' : '#F59E0B'],
                    ['Avg Quality', avgQuality > 0 ? avgQuality.toFixed(1) + '/5' : '—', QUALITY_COLORS[Math.round(avgQuality)] || ACCENT],
                    ['Nights Logged', entries.length, ACCENT],
                    ['Best Sleep', formatDuration(Math.max(...entries.map(e => e.duration))), '#22C55E'],
                  ].map(([label, val, color]) => (
                    <div key={label as string} style={{ background: '#0D0D1A', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px solid #1A1A2E' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: color as string }}>{val}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#0D0D1A', borderRadius: 16, padding: 18, marginBottom: 16, border: '1px solid #1A1A2E' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sleep Quality Distribution</div>
                  {[5, 4, 3, 2, 1].map(q => {
                    const count = entries.filter(e => e.quality === q).length
                    const pct = entries.length ? Math.round((count / entries.length) * 100) : 0
                    return (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: QUALITY_COLORS[q], width: 60 }}>{QUALITY_LABELS[q]}</span>
                        <div style={{ flex: 1, height: 8, background: '#1A1A2E', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: QUALITY_COLORS[q], borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#555', width: 30, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>

                <div style={{ background: '#0D0D1A', borderRadius: 16, padding: 18, border: '1px solid #1A1A2E' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Duration Trend (last 14 nights)</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                    {last14.slice(-14).map((e, i) => {
                      const h = Math.min(80, (e.duration / 10) * 80)
                      return (
                        <div key={i} style={{ flex: 1, height: h, background: e.duration >= 7 ? ACCENT : '#F59E0B', borderRadius: 3, minHeight: 4 }} />
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
