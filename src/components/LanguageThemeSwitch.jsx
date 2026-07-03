import { usePreferences } from '../context/PreferencesContext'
import { LANGUAGES } from '../i18n'

// Compact controls for the header: a language segmented control + theme toggle.
export default function LanguageThemeSwitch() {
  const { language, setLanguage, theme, toggleTheme } = usePreferences()

  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-lg border border-border text-xs">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`px-2 py-1 ${
              language === l.code
                ? 'bg-primary text-primary-fg'
                : 'text-muted hover:bg-surface-2'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button
        onClick={toggleTheme}
        className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-2"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Dark' : 'Light'}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
  )
}
