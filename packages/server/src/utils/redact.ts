// Recursively redact all string fields in an object or array
export function redactObject<T>(obj: T): T {
    if (Array.isArray(obj)) return obj.map(redactObject) as T
    if (obj && typeof obj === 'object') {
        const result: any = Array.isArray(obj) ? [] : {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = (obj as any)[key]
                if ((key === 'content' || key === 'question') && typeof value === 'string') {
                    result[key] = redactContent(value)
                } else if (key === 'executionData' && typeof value === 'string') {
                    // Parse, redact, and re-stringify executionData
                    try {
                        const parsed = JSON.parse(value)
                        result[key] = JSON.stringify(redactObject(parsed))
                    } catch (e) {
                        result[key] = value // If parsing fails, keep original
                    }
                } else if (typeof value === 'object' && value !== null) {
                    result[key] = redactObject(value)
                } else {
                    result[key] = value
                }
            }
        }
        return result
    }
    return obj
}
// Utility to redact a string for GDPR compliance
export const redactContent = (content: string): string => {
    if (!content || typeof content !== 'string') return content
    return content
        .split(/\s+/)
        .map((word) => {
            if (word === '') return word // Keep empty
            if (word.length <= 2) return '██'
            if (word.length <= 4) return '████'
            return '█'.repeat(Math.min(word.length, 8))
        })
        .join(' ')
}
