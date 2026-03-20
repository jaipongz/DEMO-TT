import Link from 'next/link'

export default function PrototypeIndexPage() {
  return (
    <div className="p-6">
      <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-6 max-w-3xl">
        <h1 className="text-2xl font-bold">Prototype Form Module</h1>
        <p className="text-sm text-[color:var(--text-muted)] mt-2">
          Playground for testing every dynamic form field type before refactor.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/prototype/new?mode=edit" className="btn btn-primary">
            Open Prototype (Edit)
          </Link>
          <Link href="/prototype/new?mode=view" className="btn btn-secondary">
            Open Prototype (Read Only)
          </Link>
        </div>
      </div>
    </div>
  )
}
