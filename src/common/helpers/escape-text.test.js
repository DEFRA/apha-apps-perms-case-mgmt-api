import { escapeHtml, escapeMarkdown, escapeJsonValues } from './escape-text.js'

describe('escapeHtml', () => {
  it('should return the same string if no special characters are present', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })

  it('should escape less-than signs', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
  })

  it('should escape greater-than signs', () => {
    expect(escapeHtml('1 > 0')).toBe('1 &gt; 0')
  })

  it('should escape ampersands', () => {
    expect(escapeHtml('Fish & Chips')).toBe('Fish &amp; Chips')
  })

  it('should escape double quotes', () => {
    expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;')
  })

  it('should escape single quotes', () => {
    expect(escapeHtml("It's a test")).toBe('It&#39;s a test')
  })

  it('should escape a combination of special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    )
  })

  it('should handle null or undefined input gracefully', () => {
    expect(escapeHtml(null)).toBeUndefined()
    expect(escapeHtml(undefined)).toBeUndefined()
  })
})

describe('escapeMarkdown', () => {
  it('should return the same string if no special characters are present', () => {
    expect(escapeMarkdown('Hello World')).toBe('Hello World')
  })

  it('should escape backslashes', () => {
    expect(escapeMarkdown('Path\\to\\file')).toBe('Path\\\\to\\\\file')
  })

  it('should escape backticks', () => {
    expect(escapeMarkdown('`code`')).toBe('\\`code\\`')
  })

  it('should escape asterisks', () => {
    expect(escapeMarkdown('bold *text*')).toBe('bold \\*text\\*')
  })

  it('should escape underscores', () => {
    expect(escapeMarkdown('italic _text_')).toBe('italic \\_text\\_')
  })

  it('should escape curly braces', () => {
    expect(escapeMarkdown('{object}')).toBe('\\{object\\}')
  })

  it('should escape square brackets', () => {
    expect(escapeMarkdown('[link]')).toBe('\\[link\\]')
  })

  it('should escape parentheses', () => {
    expect(escapeMarkdown('(function)')).toBe('\\(function\\)')
  })

  it('should escape a combination of special characters', () => {
    expect(escapeMarkdown('`Hello *world*_ {test}[link](url)')).toBe(
      '\\`Hello \\*world\\*\\_ \\{test\\}\\[link\\]\\(url\\)'
    )
  })

  it('should handle null or undefined input gracefully', () => {
    expect(escapeMarkdown(null)).toBeUndefined()
    expect(escapeMarkdown(undefined)).toBeUndefined()
  })
})

describe('escapeJsonValues', () => {
  it('should return a new object', () => {
    const original = {}
    const escaped = escapeJsonValues(original)
    expect(escaped).not.toBe(original)
  })

  it('should escape HTML in all string values of a flat object', () => {
    const input = {
      question: 'What is <b>your name</b>?',
      value: 'John & Jane',
      displayText: 'John & Jane'
    }
    const expected = {
      question: 'What is &lt;b&gt;your name&lt;/b&gt;?',
      value: 'John &amp; Jane',
      displayText: 'John &amp; Jane'
    }
    expect(escapeJsonValues({ ...input })).toEqual(expected)
  })

  it('should escape HTML in nested objects', () => {
    const input = {
      question: 'Where are the animals moving to?',
      answer: {
        type: 'name',
        value: {
          firstName: '<name>',
          lastName: '<surname>'
        },
        displayText: '<name> & <surname>'
      }
    }
    const expected = {
      question: 'Where are the animals moving to?',
      answer: {
        type: 'name',
        value: {
          firstName: '&lt;name&gt;',
          lastName: '&lt;surname&gt;'
        },
        displayText: '&lt;name&gt; &amp; &lt;surname&gt;'
      }
    }
    expect(escapeJsonValues(JSON.parse(JSON.stringify(input)))).toEqual(
      expected
    )
  })

  it('should not modify non-string values', () => {
    const input = {
      count: 3,
      valid: true,
      extra: null
    }
    const expected = { ...input }
    expect(escapeJsonValues({ ...input })).toEqual(expected)
  })

  it('should handle empty objects', () => {
    expect(escapeJsonValues({})).toEqual({})
  })

  it('should handle objects with undefined values', () => {
    const input = { answer: undefined }
    const expected = { answer: undefined }
    expect(escapeJsonValues({ ...input })).toEqual(expected)
  })
})
