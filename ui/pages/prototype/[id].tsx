import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import DynamicFormBox from '../../components/forms/DynamicFormBox'
import { prototypeFormConfig } from '../../config/forms/prototypeFormConfig'
import { validateFormFields } from '../../types/formConfig'

const initialFormData: Record<string, any> = {
  title: 'Prototype Title',
  email: 'prototype@example.com',
  age: 25,
  brandColor: '#2563eb',
  category: 'news',
  status: 'draft',
  flags: ['featured'],
  isActive: true,
  publishedDate: '',
  publishedAt: '',
  summary: '',
  content: '',
  thumbnail: null,
  introVideo: null,
  attachment: null,
}

export default function PrototypeDetailPage() {
  const router = useRouter()
  const modeParam = typeof router.query.mode === 'string' ? router.query.mode : 'edit'
  const readOnly = modeParam === 'view'

  const [formData, setFormData] = useState<Record<string, any>>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  const handleChange = (fieldName: string, value: any) => {
    if (readOnly) return
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleValidate = () => {
    const result = validateFormFields(prototypeFormConfig, formData)
    setValidationErrors(result.errors)
    if (!result.valid) {
      setMessage('Error: Please fill all required fields and fix invalid values')
      return
    }
    setMessage('Validated successfully! Dynamic fields are working.')
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setValidationErrors({})
    setMessage('Form reset to default values')
  }

  const title = useMemo(() => {
    if (readOnly) return 'Prototype (Read Only)'
    return 'Prototype (Editable)'
  }, [readOnly])

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            Renders all supported dynamic field types in one module.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/prototype/new?mode=edit" className="btn btn-secondary">Edit Mode</Link>
          <Link href="/prototype/new?mode=view" className="btn btn-secondary">View Mode</Link>
          <Link href="/prototype" className="btn btn-secondary">Back</Link>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
        {prototypeFormConfig.box.map((box) => (
          <div key={box.label} style={{ width: `${box.width}%`, padding: '0.5rem' }}>
            <div style={{ height: '100%' }}>
              <DynamicFormBox
                box={box}
                formData={formData}
                onChange={handleChange}
                validationErrors={validationErrors}
                readOnly={readOnly}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Current FormData</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
      </div>

      {!readOnly && (
        <div className="sticky bottom-0 z-30 px-4 sm:px-6 border-t border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur" style={{ height: 'var(--nav-height)' }}>
          <div className="flex h-full w-full flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[color:var(--text-muted)] hidden sm:inline">Prototype actions</span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end sm:justify-start">
              <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
              <button type="button" className="btn btn-primary" onClick={handleValidate}>Validate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
