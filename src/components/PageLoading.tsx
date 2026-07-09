function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: 'var(--primary-600)' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading...</p>
      </div>
    </div>
  )
}

export default PageLoading
