import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
        <p className="text-[color:var(--text-muted)] mt-2">Manage your system from the sidebar</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Quick Info</h3>
          <div className="space-y-2 text-sm text-[color:var(--text-muted)]">
            <p><strong>Email:</strong> {user?.email}</p>
            {user?.roles && (
              <p><strong>Roles:</strong> {user.roles.map((r: any) => r.name || r).join(', ')}</p>
            )}
          </div>
        </div>

        <div className="card p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Getting Started</h3>
          <ul className="text-sm text-[color:var(--text-muted)] space-y-1">
            <li>• Navigate using the sidebar menu</li>
            <li>• Right-click on items for actions</li>
            <li>• Use search & filters to find items</li>
            <li>• Click theme toggle to switch modes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
