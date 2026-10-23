// Wraps the pages of a module. Switched off: customers see "coming soon";
// admins see the page with a note that customers can't.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import { Layout } from './Layout'
import { useModules } from '../contexts/ModulesContext'

export default function ModuleGate({ name, children }: { name: 'marketplace'; children: ReactNode }) {
  const { modules, loaded, isAdmin } = useModules()
  if (!loaded) return null
  if (modules[name]) return <>{children}</>
  if (isAdmin) {
    return (
      <>
        <div className="po-module-off-note" role="status">The marketplace is switched off for customers. You can see it because you're an admin. <Link to="/admin/modules">Modules & payments</Link></div>
        {children}
      </>
    )
  }
  return (
    <Layout>
      <div className="po-page po-single" style={{ maxWidth: 560 }}>
        <section className="po-card po-center-card" data-testid="module-off">
          <Store size={44} className="po-text-success" aria-hidden="true" />
          <h1 className="po-card-title">The marketplace is coming soon</h1>
          <p className="po-card-text">We're getting buying and selling of verified items ready. In the meantime you can register your items, prove you own them and check items before you buy.</p>
          <Link to="/" className="po-btn po-btn-primary">Go home</Link>
        </section>
      </div>
    </Layout>
  )
}
