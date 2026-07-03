// Task statuses in board order. Human labels come from i18n (t(`status.${s}`)).
export const STATUS_ORDER = ['todo', 'in_progress', 'review', 'done', 'blocked']

// Fixed status accent colors (same in light & dark; white text sits on them).
export const STATUS_COLOR = {
  todo: 'bg-slate-600',
  in_progress: 'bg-blue-600',
  review: 'bg-amber-600',
  done: 'bg-emerald-600',
  blocked: 'bg-rose-600',
}
