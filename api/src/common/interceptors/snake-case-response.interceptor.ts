import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  if (value instanceof Date) return false
  return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null
}

const toSnakeCase = (key: string): string => {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

const transformKeysToSnake = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map((item) => transformKeysToSnake(item))
  }

  if (!isPlainObject(input)) {
    return input
  }

  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    const nextKey = toSnakeCase(key)
    output[nextKey] = transformKeysToSnake(value)
  }

  return output
}

@Injectable()
export class SnakeCaseResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ path?: string; originalUrl?: string; url?: string }>()
    const requestPath = String(request?.originalUrl || request?.url || request?.path || '')
    const bypassTransform =
      requestPath.includes('/api/uploads') ||
      requestPath.includes('/stock/') ||
      requestPath.includes('/api/site-settings')

    if (bypassTransform) {
      return next.handle()
    }

    return next.handle().pipe(map((data) => transformKeysToSnake(data)))
  }
}
