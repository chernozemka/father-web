import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from './analytics.js'

// Site content, hardcoded here (no backend).
const PROFILE = {
  name: 'Viacheslav Marchenko',
  role: 'Software Engineer',
}

const LINKS = [
  { label: 'Email', href: 'mailto:you@example.com' },
  { label: 'GitHub', href: 'https://github.com/yourname' },
  { label: 'GitLab', href: 'https://gitlab.com/yourname' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/yourname' },
  { label: 'Matrix', href: 'https://matrix.to/#/@you:matrix.org' },
]

// Each skill carries its own experience + completed-project count.
// `icon` is a Font Awesome brand class. Only Python/PHP/Java/JS have real brand
// glyphs; the rest have no dedicated icon, so they fall back to their text name.
const SKILLS = [
  { name: 'C#', icon: null, years: 5, projects: 14, note: 'Backend services and desktop apps.' },
  { name: 'C++', icon: null, years: 4, projects: 9, note: 'Performance-critical systems code.' },
  { name: 'Go', icon: null, years: 3, projects: 7, note: 'Microservices and CLI tooling.' },
  { name: 'Python', icon: 'fa-brands fa-python', years: 6, projects: 20, note: 'Automation, data, and web APIs.' },
  { name: 'PHP', icon: 'fa-brands fa-php', years: 4, projects: 11, note: 'Web applications and APIs.' },
  { name: '.NET', icon: null, years: 5, projects: 13, note: 'Enterprise web and services.' },
  { name: 'Java', icon: 'fa-brands fa-java', years: 4, projects: 10, note: 'Backend and Android work.' },
  { name: 'JavaScript', icon: 'fa-brands fa-square-js', years: 6, projects: 18, note: 'Frontend and Node.js.' },
  { name: 'SQL', icon: null, years: 6, projects: 22, note: 'Schema design and query tuning.' },
]

const CARD_HALF_WIDTH = 112 // half of w-56 (224px), used to clamp on-screen

// Pick a theme from the visitor's local hour: light 05:00–20:00, dark otherwise.
function themeForHour(hour) {
  return hour >= 5 && hour < 20 ? 'light' : 'dark'
}

// Mid-tone channel (90–199) stays legible on both light and dark backgrounds.
function randomChannel() {
  return 90 + Math.floor(Math.random() * 110)
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="block h-32 w-32 text-amber-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="1.5" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22.5" y2="12" />
      <line x1="4.2" y1="4.2" x2="6" y2="6" />
      <line x1="18" y1="18" x2="19.8" y2="19.8" />
      <line x1="19.8" y1="4.2" x2="18" y2="6" />
      <line x1="6" y1="18" x2="4.2" y2="19.8" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="block h-32 w-32 text-slate-200">
      <path
        fill="currentColor"
        d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"
      />
    </svg>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const datetime = now.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <footer className="text-sm text-gray-500" title={timeZone}>
      {datetime}
    </footer>
  )
}

function App() {
  // Default to the theme matching the visitor's local time of day; the sun/moon
  // button still lets them override it manually for the session.
  const [theme, setTheme] = useState(() => themeForHour(new Date().getHours()))
  const [rotation, setRotation] = useState(0)

  // Card content is hardcoded above.
  const profile = PROFILE
  const links = LINKS
  const skills = SKILLS

  // selected = { ...skill, rgb, x, y } where x/y anchor the info card.
  const [selected, setSelected] = useState(null)
  // While true, the card plays the pop-out animation before unmounting.
  const [closing, setClosing] = useState(false)
  // tilt = degrees the open card is rotated, driven by pointer position.
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const infoRef = useRef(null)
  const closeTimer = useRef(null)

  const CARD_ANIM_MS = 160 // keep in sync with the pop / pop-out CSS duration

  // Play the reverse animation, then actually remove the card.
  const closeCard = () => {
    if (!selected || closing) return
    setClosing(true)
    closeTimer.current = setTimeout(() => {
      setSelected(null)
      setClosing(false)
    }, CARD_ANIM_MS)
  }

  const MAX_TILT = 12 // degrees at the card's edges

  // Rotate the card toward the corner the pointer is nearest.
  const handleTilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width // 0 (left) ... 1 (right)
    const py = (e.clientY - r.top) / r.height // 0 (top) ... 1 (bottom)
    setTilt({
      rx: (0.5 - py) * 2 * MAX_TILT,
      ry: (px - 0.5) * 2 * MAX_TILT,
    })
  }

  const resetTilt = () => setTilt({ rx: 0, ry: 0 })

  // Reflect the theme onto <html> for the .dark class toggle + page background.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      track(`theme-${next}`, `Theme switched to ${next}`)
      return next
    })
    setRotation((r) => r + 360)
  }

  // Assign each skill a stable random color (recomputed only on reload).
  const coloredSkills = useMemo(
    () =>
      skills.map((skill) => ({
        ...skill,
        rgb: `${randomChannel()} ${randomChannel()} ${randomChannel()}`,
      })),
    [skills],
  )

  // Open the info card anchored just above the clicked skill.
  const openCard = (skill, e) => {
    clearTimeout(closeTimer.current) // cancel a pending close if mid-animation
    setClosing(false)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(
      Math.max(rect.left + rect.width / 2, CARD_HALF_WIDTH + 8),
      window.innerWidth - CARD_HALF_WIDTH - 8,
    )
    setSelected({ ...skill, x, y: rect.top - 12 })
    resetTilt() // start flat each time a card opens
    track(`skill-open-${skill.name}`, `Opened ${skill.name} card`)
  }

  // Dismiss on outside click or Escape.
  useEffect(() => {
    if (!selected) return
    const onDown = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        closeCard()
      }
    }
    const onKey = (e) => e.key === 'Escape' && closeCard()
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [selected])

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-12 px-6 py-16 text-center text-gray-900 dark:text-gray-100">
      <header className="flex flex-col items-center gap-5">
        <div className="flex flex-col items-center">
          {/* Sun/moon toggle: half-tucked behind the name, rotates on switch */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="relative z-0 cursor-pointer transition-transform duration-500 ease-in-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* Name + role share one opaque block so nothing peeks through the
              gap between them and occludes the icon's lower half. */}
          <div className="relative z-10 -mt-16 w-fit bg-[var(--page-bg)] px-4 pb-1">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              {profile.name}
            </h1>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
              {profile.role}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => track(`link-${link.label}`, `Clicked ${link.label}`)}
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-500 hover:text-black dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Skill cards looping infinitely in one row; pauses on hover (see index.css) */}
      <section className="w-full">
        <div className="marquee-mask w-full overflow-hidden">
          <div
            className="animate-marquee flex w-max gap-6 px-3 py-6"
            style={{ animationPlayState: selected ? 'paused' : '' }}
          >
            {/* Two copies so the loop is seamless */}
            {[...coloredSkills, ...coloredSkills].map((skill, i) => (
              <button
                key={`${skill.name}-${i}`}
                onClick={(e) => openCard(skill, e)}
                title={skill.name}
                aria-label={skill.name}
                className={`flex h-16 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition-transform hover:scale-105 ${
                  skill.icon ? 'w-16 text-2xl' : 'px-8 text-lg font-semibold'
                }`}
                style={{
                  borderColor: `rgb(${skill.rgb})`,
                  backgroundColor: `rgb(${skill.rgb} / 0.12)`,
                  color: `rgb(${skill.rgb})`,
                }}
              >
                {skill.icon ? (
                  <i className={skill.icon} aria-hidden="true" />
                ) : (
                  skill.name
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Clock />

      {/* Poker-card-style info that pops up at the clicked skill */}
      {selected && (
        <div
          ref={infoRef}
          className="fixed z-50"
          style={{
            left: selected.x,
            top: selected.y,
            transform: 'translate(-50%, -100%)',
            perspective: '700px',
          }}
        >
          {/* Tilt layer: rotates with the pointer; the card's pop-in lives one
              level deeper so the two transforms don't collide. */}
          <div
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: 'transform 120ms ease-out',
            }}
          >
            <div
              className={`${closing ? 'animate-pop-out' : 'animate-pop'} flex aspect-[5/7] w-56 flex-col rounded-xl border-2 bg-white p-4 text-left shadow-2xl dark:bg-[#15151b]`}
              style={{ borderColor: `rgb(${selected.rgb})` }}
            >
            {/* Top-left index, like a playing card */}
            <div
              className="flex items-center justify-between text-xs font-bold"
              style={{ color: `rgb(${selected.rgb})` }}
            >
              <span>{selected.name}</span>
              {selected.icon ? (
                <i className={selected.icon} aria-hidden="true" />
              ) : (
                <span>◆</span>
              )}
            </div>

            {/* Center face */}
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              {selected.icon ? (
                <div className="flex flex-col items-center gap-1">
                  <i
                    className={`${selected.icon} text-5xl`}
                    style={{ color: `rgb(${selected.rgb})` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: `rgb(${selected.rgb})` }}
                  >
                    {selected.name}
                  </span>
                </div>
              ) : (
                <div
                  className="text-3xl font-bold"
                  style={{ color: `rgb(${selected.rgb})` }}
                >
                  {selected.name}
                </div>
              )}
              <div className="space-y-1 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selected.years}+
                  </span>{' '}
                  yrs experience
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selected.projects}
                  </span>{' '}
                  projects done
                </div>
              </div>
              {selected.note && (
                <p className="px-1 text-center text-xs text-gray-500">
                  {selected.note}
                </p>
              )}
            </div>

            {/* Bottom-right index, mirrored */}
            <div
              className="flex rotate-180 items-center justify-between text-xs font-bold"
              style={{ color: `rgb(${selected.rgb})` }}
            >
              <span>{selected.name}</span>
              {selected.icon ? (
                <i className={selected.icon} aria-hidden="true" />
              ) : (
                <span>◆</span>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
