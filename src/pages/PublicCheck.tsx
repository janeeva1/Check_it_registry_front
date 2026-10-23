import { Navigate } from 'react-router-dom'

// Anonymous device checks were removed: checks are for registered users only.
// Anything that still links here is sent to the logged-in check page.
export default function PublicCheck() {
  return <Navigate to="/device-check" replace />
}
