// Mock Next.js Web APIs globally
const { TextEncoder, TextDecoder } = require('util')

// Mock global Web APIs
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  Request: class MockRequest {
    constructor(url, init = {}) {
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
        configurable: true
      })
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this._body = init?.body
    }
    
    get body() {
      return this._body
    }
    
    async json() {
      return JSON.parse(this._body || '{}')
    }
    
    async text() {
      return this._body || ''
    }
    
    clone() {
      return new MockRequest(this.url, {
        method: this.method,
        headers: this.headers,
        body: this._body
      })
    }
  },
  
  Response: class MockResponse {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Map(Object.entries(init.headers || {}))
    }
    
    static json(data, init = {}) {
      return new MockResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers
        }
      })
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    
    async text() {
      return this.body || ''
    }
  },
  
  Headers: class MockHeaders extends Map {
    constructor(init) {
      super()
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value))
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value))
        }
      }
    }
    
    get(name) {
      return super.get(name.toLowerCase())
    }
    
    set(name, value) {
      return super.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return super.has(name.toLowerCase())
    }
    
    delete(name) {
      return super.delete(name.toLowerCase())
    }
  }
})

// Mock next-auth modules
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next-auth/providers/google', () => ({
  default: jest.fn((config) => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
    ...config,
  })),
}))

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}