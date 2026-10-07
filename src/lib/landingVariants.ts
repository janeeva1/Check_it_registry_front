/**
 * Landing page design variants (Classic / Modern / Minimal / Premium / Enterprise / Stories)
 * are a development preview only.
 *
 * - `npm run dev` (import.meta.env.DEV === true)  -> variants visible
 * - `npm run build` (production)                  -> only the main landing page is reachable
 *
 * Force them on in any build with VITE_SHOW_LANDING_VARIANTS=true in the env file.
 */
export const landingVariantsEnabled: boolean =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_LANDING_VARIANTS === 'true'

export const landingVersions = [
  { path: '/', label: 'Classic' },
  { path: '/landing/v1', label: 'Modern' },
  { path: '/landing/v2', label: 'Minimal' },
  { path: '/landing/v3', label: 'Premium' },
  { path: '/landing/v4', label: 'Enterprise' },
  { path: '/landing/v5', label: 'Stories' },
] as const
