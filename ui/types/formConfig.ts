// Form configuration types for dynamic layout generation

export type FieldType = 'text' | 'email' | 'number' | 'image' | 'video' | 'file' | 'dropdown' | 'multiselect' | 'tag' | 'moretext' | 'fulltext' | 'date' | 'datetime' | 'switch' | 'radio' | 'checkbox' | 'color' | 'child' | 'gallery'

export type ChildFieldType = Exclude<FieldType, 'child' | 'gallery'>

export type GalleryMediaMode = 'image' | 'video' | 'mixed'

export type GalleryMode = {
  mode: GalleryMediaMode
  type?: 'crop' | 'scaledown'
  width?: number
  height?: number
}

export interface ChildColumnConfig {
  key: string
  label: string
  type?: 'text' | 'date' | 'datetime'
  width?: number | string
}

export interface ChildEditorFieldConfig {
  field: string
  name?: string
  width?: number
  type?: ChildFieldType
  required?: boolean
  options?: Array<{ label: string; value: string }>
  support?: string
  mode?: ImageMode
  maxSize?: number
  defaultValue?: any
}

export interface ChildFieldConfig {
  title?: string
  columns?: ChildColumnConfig[]
  fields?: ChildEditorFieldConfig[]
}

export interface LookupSource {
  endpoint?: string
  module?: string
  field?: string
  lang?: string
  valueField?: string
  labelField?: string
  search?: string
  limit?: number
  activeOnly?: boolean
  payload?: Record<string, any>
}

interface BaseFormField {
  name?: string // Display name for the field
  width: number // 0-100 (percentage within row)
  required?: boolean // Mark field as required
  options?: Array<{ label: string; value: string }> // For dropdown, radio, checkbox types
  search?: boolean // For dropdown type - enable suggest search input
  lookup?: LookupSource // Dynamic options from lookup API
  support?: string // For image, video, file types - e.g., 'jpeg,jpg,png,gif'
  mode?: ImageMode | GalleryMode // For image/gallery type
  maxSize?: number // MB per file (e.g. 1024 = 1GB)
  defaultValue?: any // Default value for field
}

export type ImageMode =
  | { type: 'crop'; width: number; height: number }
  | { type: 'scaledown' }

export type FormField =
  | (BaseFormField & {
      type: ChildFieldType
      field: string
      childConfig?: never
    })
  | (BaseFormField & {
      type: 'child'
      field?: string
      childConfig?: ChildFieldConfig // For child type - embedded list + overlay editor
    })
  | (BaseFormField & {
      type: 'gallery'
      field?: string
      childConfig?: never
    })

export interface StandardFormBox {
  label: string
  width: number // 0-100 (percentage of container)
  fields: FormField[]
}

export interface GalleryFormBox {
  label: string
  width: number
  type: 'gallery'
  field?: string
  name?: string
  support?: string
  mode?: GalleryMode
  maxSize?: number
}

export type FormBox = StandardFormBox | GalleryFormBox

export interface FormConfig {
  width: number // Usually 100
  master_field?: string // Field key used as primary display label in detail/breadcrumb
  box: FormBox[]
}

// Helper to calculate grid layout
export function calculateGridLayout(fields: FormField[]): FormField[][] {
  const rows: FormField[][] = []
  let currentRow: FormField[] = []
  let currentWidth = 0

  for (const field of fields) {
    if (currentWidth + field.width > 100) {
      // Start new row
      if (currentRow.length > 0) {
        rows.push(currentRow)
      }
      currentRow = [field]
      currentWidth = field.width
    } else {
      // Add to current row
      currentRow.push(field)
      currentWidth += field.width
    }
  }

  // Push remaining row
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  return rows
}

// Get Tailwind class name for width percentage
export function getWidthClass(width: number): string {
  const widthMap: Record<number, string> = {
    100: 'w-full',
    80: 'w-4/5',
    75: 'w-3/4',
    50: 'w-1/2',
    33: 'w-1/3',
    25: 'w-1/4',
  }
  return widthMap[width] || `w-[${width}%]`
}

// Convert support string to accept mime types
export function supportToAccept(type: FieldType, support?: string): string {
  if (!support) {
    // Default mimes if no support specified
    const defaultMimes: Record<FieldType, string> = {
      image: 'image/*',
      video: 'video/*',
      file: '*',
      child: '',
      gallery: '',
      text: 'text/plain',
      email: 'text/plain',
      number: 'text/plain',
      dropdown: '',
      multiselect: '',
      tag: '',
      moretext: '',
      fulltext: '',
      date: '',
      datetime: '',
      switch: '',
      radio: '',
      checkbox: '',
      color: '',
    }
    return defaultMimes[type] || ''
  }

  // Map extension to mime type
  const extensionMap: Record<string, string> = {
    // Images
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    txt: 'text/plain',
    csv: 'text/csv',
  }

  // Convert support string to mime types
  return support
    .split(',')
    .map((ext) => extensionMap[ext.trim().toLowerCase()] || `*.${ext.trim()}`)
    .join(',')
}

// Validate required fields in form
export function validateFormFields(
  formConfig: FormConfig,
  formData: Record<string, any>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  const toCamelCase = (input: string) =>
    String(input || '')
      .replace(/[-_]+([a-zA-Z0-9])/g, (_, char: string) => String(char).toUpperCase())
      .replace(/^([A-Z])/, (char: string) => char.toLowerCase())

  const toSnakeCase = (input: string) =>
    String(input || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[-\s]+/g, '_')
      .toLowerCase()

  const getValueByAliases = (fieldKey: string): any => {
    const aliases = Array.from(
      new Set([
        fieldKey,
        toCamelCase(fieldKey),
        toSnakeCase(fieldKey),
      ]),
    )

    for (const key of aliases) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        return formData[key]
      }
    }

    return undefined
  }

  const isEmptyRequiredValue = (value: any): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      return normalized === '' || normalized === 'null' || normalized === 'undefined'
    }
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') {
      if ('value' in value) return isEmptyRequiredValue((value as any).value)
      return Object.keys(value).length === 0
    }
    return false
  }

  for (const box of formConfig.box) {
    if (!('fields' in box)) continue
    for (const field of box.fields) {
      const fieldKey = field.field
      if (!fieldKey) continue

      const value = getValueByAliases(fieldKey)
      const fieldName = field.name || fieldKey

      if (field.required) {
        if (isEmptyRequiredValue(value)) {
          errors[fieldKey] = `${fieldName} is required`
        }
      }

      if (field.type === 'email' && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(String(value)) && !errors[fieldKey]) {
          errors[fieldKey] = `${fieldName} is not a valid email`
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
