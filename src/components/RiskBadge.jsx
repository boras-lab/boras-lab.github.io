import { useTranslation } from 'react-i18next'

// Renders a deadline-risk pill from the task's server-computed `risk` field.
// risk: 'overdue' | 'due_soon' | null
export default function RiskBadge({ risk }) {
  const { t } = useTranslation()
  if (!risk) return null
  const styles =
    risk === 'overdue'
      ? 'bg-rose-600/15 text-rose-500 border-rose-600/30'
      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs border ${styles}`}>
      {risk === 'overdue' ? '⚠ ' : '⏳ '}
      {t(`risk.${risk}`)}
    </span>
  )
}
