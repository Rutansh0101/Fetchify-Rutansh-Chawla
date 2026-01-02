# Fetchify - A Lightweight HTTP Client Library

[![npm version](https://img.shields.io/npm/v/@rutansh0101/fetchify.svg)](https://www.npmjs.com/package/@rutansh0101/fetchify)
[![npm downloads](https://img.shields.io/npm/dm/@rutansh0101/fetchify.svg)](https://www.npmjs.com/package/@rutansh0101/fetchify)
[![license](https://img.shields.io/npm/l/@rutansh0101/fetchify.svg)](https://github.com/Rutansh0101/Fetchify-Rutansh-Chawla/blob/master/LICENSE)

Fetchify is a modern, lightweight HTTP client library built on top of the native Fetch API. It provides a clean, axios-like interface with support for interceptors, request/response transformation, timeout handling, and more.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Basic Usage](#basic-usage)
3. [Features Overview](#features-overview)
4. [Detailed Feature Explanation](#detailed-feature-explanation)
   - [Instance Creation](#1-instance-creation)
   - [HTTP Methods](#2-http-methods)
   - [Configuration Management](#3-configuration-management)
   - [Timeout Handling](#4-timeout-handling)
   - [Request Interceptors](#5-request-interceptors)
   - [Response Interceptors](#6-response-interceptors)
   - [Interceptor Chain Execution](#7-interceptor-chain-execution)
5. [Architecture & Design Decisions](#architecture--design-decisions)
6. [Code Examples](#code-examples)
7. [Error Handling](#error-handling)
8. [API Reference](#api-reference)

---

## Installation & Setup

### Installation

```bash
npm install @rutansh0101/fetchify
```

### Prerequisites
- Node.js 14+ or modern browser with Fetch API support
- ES6+ module support

### Import

```javascript
import fetchify from '@rutansh0101/fetchify';
```

---

## Basic Usage

### Creating an Instance

```javascript
import fetchify from '@rutansh0101/fetchify';

// Create an instance with base configuration
const api = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN'
    }
});
```

### Making Requests

```javascript
// GET request
const response = await api.get('/users');
const users = await response.json();

// POST request
const newUser = await api.post('/users', {
    body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// PUT request
const updated = await api.put('/users/1', {
    body: JSON.stringify({ name: 'John Updated' })
});

// PATCH request
const patched = await api.patch('/users/1', {
    body: JSON.stringify({ email: 'newemail@example.com' })
});

// DELETE request
await api.delete('/users/1');
```

---

## Features Overview

✅ **Axios-like API** - Familiar interface for developers coming from Axios  
✅ **Request/Response Interceptors** - Transform requests and responses globally  
✅ **Timeout Support** - Abort requests after specified duration  
✅ **Configuration Merging** - Instance, request-level, and default configs  
✅ **All HTTP Methods** - GET, POST, PUT, PATCH, DELETE support  
✅ **AbortController Integration** - Native request cancellation  
✅ **Promise Chain Architecture** - Clean async operation handling  
✅ **Error Transformation** - Custom error messages for timeouts and failures  

---

## Detailed Feature Explanation

### 1. Instance Creation

**What it does:**  
Creates a reusable HTTP client instance with shared configuration.

**Why it's needed:**  
- Avoid repeating baseURL, headers, and timeout in every request
- Create multiple instances for different APIs (e.g., one for auth, one for data)
- Centralize common configuration

**How it works:**

```javascript
const create = (config) => {
    return new Fetchify(config);
}
```

The `create` method:
1. Accepts a configuration object
2. Instantiates the Fetchify class
3. Merges user config with default config
4. Returns the configured instance

**Implementation Details:**

```javascript
constructor(newConfig) {
    this.config = this.#mergeConfig(newConfig);
}
```

The constructor:
- Calls `#mergeConfig` to combine default config with user-provided config
- Stores the merged config in `this.config`
- This config becomes the base for all future requests

**Default Configuration:**

```javascript
config = {
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 1000  // 1 second default timeout
};
```

---

### 2. HTTP Methods

**What it does:**  
Provides convenient methods for different HTTP verbs (GET, POST, PUT, PATCH, DELETE).

**Why it's needed:**  
- Simplifies request syntax
- Makes code more readable (`api.get()` vs `api.request({ method: 'GET' })`)
- Follows REST conventions

**How it works:**

```javascript
async get(endPoint, tempConfig = {}) {
    return this.#request({ 
        endPoint, 
        config: { ...tempConfig, method: 'GET' } 
    });
}
```

Each method:
1. Takes an endpoint and optional temporary config
2. Merges the HTTP method into the config
3. Calls the private `#request` method
4. Returns a Promise that resolves to the fetch Response object

**All Methods:**

- **GET**: Retrieve data (no body allowed by HTTP spec)
- **POST**: Create new resources (requires body)
- **PUT**: Update entire resources (requires body)
- **PATCH**: Partially update resources (requires body)
- **DELETE**: Remove resources (usually no body)

**Example with Body:**

```javascript
await api.post('/users', {
    body: JSON.stringify({ name: 'John' }),
    headers: { 'Custom-Header': 'value' }
});
```

---

### 3. Configuration Management

**What it does:**  
Handles merging of configurations at three levels: default, instance, and request.

**Why it's needed:**  
- Allow global defaults that can be overridden
- Support instance-specific configs (different baseURLs)
- Enable request-specific overrides (custom timeout for one request)

**Configuration Priority (highest to lowest):**
1. Request-level config (passed to `get()`, `post()`, etc.)
2. Instance-level config (passed to `create()`)
3. Default config (hardcoded in the class)

**How it works:**

```javascript
#mergeConfig(newConfig) {
    return {
        ...this.config,      // Existing config
        ...newConfig,         // New config (overrides existing)
        headers: {            // Deep merge for headers
            ...this.config.headers,
            ...newConfig?.headers
        }
    };
}
```

**Why Deep Merge for Headers?**

Without deep merge:
```javascript
// Instance config
headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' }

// Request config
headers: { 'X-Custom': 'value' }

// Result WITHOUT deep merge (WRONG):
headers: { 'X-Custom': 'value' }  // Lost Authorization!

// Result WITH deep merge (CORRECT):
headers: { 
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json',
    'X-Custom': 'value'
}
```

**Two Merge Methods:**

1. `#mergeConfig(newConfig)` - Merges with instance config (`this.config`)
2. `#mergeConfigs(config1, config2)` - Merges two arbitrary configs

---

### 4. Timeout Handling

**What it does:**  
Automatically aborts requests that take longer than specified duration.

**Why it's needed:**  
- Prevent requests from hanging indefinitely
- Improve user experience with faster feedback
- Handle slow/unresponsive servers gracefully
- Free up resources from stalled connections

**How it works:**

```javascript
// 1. Create AbortController
const abortController = new AbortController();
const timeout = config.timeout || this.config.timeout || 0;

// 2. Set timer to abort
let timeOutId;
if (timeout) {
    timeOutId = setTimeout(() => {
        abortController.abort();  // Trigger abort after timeout
    }, timeout);
}

// 3. Link signal to fetch
config.signal = abortController.signal;

// 4. Execute fetch
const response = await fetch(url, config);

// 5. Clear timer in finally block
finally {
    if (timeOutId) {
        clearTimeout(timeOutId);  // Prevent memory leak
    }
}
```

**Why Use AbortController?**

- Native browser API for cancelling fetch requests
- Cleaner than old XMLHttpRequest cancellation
- Works across all modern browsers
- Can abort multiple operations with one controller

**Timeout Flow:**

```
Request Start
    ↓
Set Timeout Timer (e.g., 5000ms)
    ↓
Start Fetch Request
    ↓
    ├─→ Response arrives in 2000ms → Clear Timer → Return Response ✓
    │
    └─→ 5000ms passes → Timer fires → Abort Signal → Fetch throws AbortError ✗
```

**Why Clear Timeout?**

```javascript
// Without clearing:
setTimeout(() => abortController.abort(), 5000);
// If request finishes in 2s, timer still exists in memory until 5s
// With 1000 requests, you have 1000 timers lingering!

// With clearing:
finally {
    clearTimeout(timeOutId);  // Immediately free memory when done
}
```

**Error Handling:**

```javascript
catch (error) {
    if (error.name === 'AbortError') {
        throw new Error(`Request to ${endPoint} aborted due to timeout after ${timeout} ms`);
    } else {
        throw error;
    }
}
```

The code checks `error.name === 'AbortError'` to distinguish timeout aborts from other errors.

---

### 5. Request Interceptors

**What it does:**  
Intercepts and modifies requests before they are sent to the server.

**Why it's needed:**  
- Add authentication tokens to all requests
- Log outgoing requests for debugging
- Modify request data (transform, encrypt, compress)
- Add timestamps or request IDs
- Implement retry logic

**How it works:**

```javascript
// Adding an interceptor
api.addRequestInterceptor(
    (config) => {
        // Success handler: runs for every request
        console.log('Sending request to:', config.endPoint);
        config.config.headers['X-Request-Time'] = Date.now();
        return config;  // Must return config
    },
    (error) => {
        // Error handler: runs if previous interceptor failed
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);
```

**Storage:**

```javascript
requestInterceptors = []; // Array of { successHandler, errorHandler }

addRequestInterceptor(successHandler, errorHandler) {
    this.requestInterceptors.push({ successHandler, errorHandler });
}
```

**Execution in Chain:**

```javascript
const chain = [
    ...this.requestInterceptors,  // All request interceptors
    { successHandler: this.#dispatchRequest.bind(this) },  // Actual fetch
    ...this.responseInterceptors  // All response interceptors
];
```

Request interceptors run **before** the actual fetch call.

**Input/Output Format:**

- **Input**: `{ endPoint: '/users', config: { method: 'GET', ... } }`
- **Output**: Must return same format (modified or not)

**Common Use Cases:**

```javascript
// 1. Add authentication
api.addRequestInterceptor((config) => {
    const token = localStorage.getItem('token');
    config.config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

// 2. Log requests
api.addRequestInterceptor((config) => {
    console.log(`[${config.config.method}] ${config.endPoint}`);
    return config;
});

// 3. Transform request body
api.addRequestInterceptor((config) => {
    if (config.config.body) {
        // Add timestamp to all POST requests
        const body = JSON.parse(config.config.body);
        body.timestamp = Date.now();
        config.config.body = JSON.stringify(body);
    }
    return config;
});
```

---

### 6. Response Interceptors

**What it does:**  
Intercepts and modifies responses before they reach your application code.

**Why it's needed:**  
- Transform response data globally
- Handle errors consistently (e.g., redirect on 401)
- Log responses for debugging
- Extract data from nested response structures
- Implement global retry logic

**How it works:**

```javascript
// Adding an interceptor
api.addResponseInterceptor(
    (response) => {
        // Success handler: runs for successful responses
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;  // Must return response
    },
    (error) => {
        // Error handler: runs on fetch errors or if previous interceptor threw
        console.error('Response error:', error);
        
        if (error.message.includes('timeout')) {
            alert('Request timed out. Please try again.');
        }
        
        return Promise.reject(error);
    }
);
```

**Storage:**

```javascript
responseInterceptors = []; // Array of { successHandler, errorHandler }

addResponseInterceptor(successHandler, errorHandler) {
    this.responseInterceptors.push({ successHandler, errorHandler });
}
```

**Execution in Chain:**

Response interceptors run **after** the fetch completes.

**Input/Output Format:**

- **Input**: Native fetch `Response` object
- **Output**: Must return `Response` object (or modified version)

**Common Use Cases:**

```javascript
// 1. Auto-logout on 401
api.addResponseInterceptor(
    (response) => {
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return response;
    }
);

// 2. Parse all responses as JSON
api.addResponseInterceptor(
    async (response) => {
        const data = await response.json();
        // Return modified response with parsed data
        response.data = data;
        return response;
    }
);

// 3. Handle rate limiting
api.addResponseInterceptor(
    (response) => {
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
        }
        return response;
    }
);

// 4. Log all responses
api.addResponseInterceptor(
    (response) => {
        console.log(`[${response.status}] Response received`);
        return response;
    }
);
```

---

### 7. Interceptor Chain Execution

**What it does:**  
Executes all interceptors and the fetch request in a sequential promise chain.

**Why it's needed:**  
- Ensure interceptors run in order (request → fetch → response)
- Handle errors at any stage
- Allow each interceptor to modify data for the next
- Maintain clean async flow

**The Chain Structure:**

```javascript
const chain = [
    ...this.requestInterceptors,      // [interceptor1, interceptor2, ...]
    { successHandler: this.#dispatchRequest.bind(this) },  // The actual fetch
    ...this.responseInterceptors      // [interceptor3, interceptor4, ...]
];
```

**Visual Representation:**

```
Initial Promise.resolve({ endPoint, config })
    ↓
Request Interceptor 1 (success/error)
    ↓
Request Interceptor 2 (success/error)
    ↓
#dispatchRequest (actual fetch)
    ↓
Response Interceptor 1 (success/error)
    ↓
Response Interceptor 2 (success/error)
    ↓
Final Result returned to user
```

**Chain Building Code:**

```javascript
let promise = Promise.resolve({ endPoint, config: finalConfig });

for (const { successHandler, errorHandler } of chain) {
    promise = promise.then(
        (responseOfPrevPromise) => {
            try {
                return successHandler(responseOfPrevPromise);
            } catch (error) {
                if (errorHandler) {
                    return errorHandler(error);
                } else {
                    return Promise.reject(error);
                }
            }
        },
        (error) => {
            if (errorHandler) {
                return errorHandler(error);
            } else {
                return Promise.reject(error);
            }
        }
    );
}

return promise;
```

**How It Works Step-by-Step:**

1. **Initial Promise**: Starts with `{ endPoint, config }`

2. **Iteration**: For each interceptor in the chain:
   - Attach `.then()` to the promise
   - Pass output of previous step as input to next

3. **Success Path**: `then(successHandler, errorHandler)`
   - If previous promise resolved → `successHandler` runs
   - Output becomes input for next interceptor

4. **Error Path**: Second parameter of `.then()`
   - If previous promise rejected → `errorHandler` runs
   - Can recover (return value) or propagate (reject)

5. **Try-Catch in Success Handler**:
   - If `successHandler` throws synchronous error
   - Catch it and pass to `errorHandler`
   - This handles errors that don't return rejected promises

**Example Flow:**

```javascript
// User code
const response = await api.get('/users');

// What happens:

// Step 1: Initial promise
Promise.resolve({ endPoint: '/users', config: { method: 'GET' } })

// Step 2: Request Interceptor 1
.then(config => {
    config.config.headers['Auth'] = 'token';
    return config;  // { endPoint: '/users', config: { method: 'GET', headers: {...} } }
})

// Step 3: Request Interceptor 2
.then(config => {
    console.log('Logging request');
    return config;  // Same object passed through
})

// Step 4: Dispatch Request (actual fetch)
.then(async config => {
    const response = await fetch(config.config.baseURL + config.endPoint, config.config);
    return response;  // Native Response object
})

// Step 5: Response Interceptor 1
.then(response => {
    if (!response.ok) throw new Error('Bad response');
    return response;  // Response object passed through
})

// Step 6: Response Interceptor 2
.then(response => {
    console.log('Response received:', response.status);
    return response;  // Final Response object
})

// Result: User gets the Response object
```

**Error Handling Example:**

```javascript
// If Request Interceptor throws:
.then(config => {
    throw new Error('Invalid token');  // Sync error
})

// Caught by try-catch, passed to errorHandler:
catch (error) {
    if (errorHandler) {
        return errorHandler(error);  // Can recover
    } else {
        return Promise.reject(error);  // Propagate
    }
}

// If fetch fails (network error, timeout):
.then(async config => {
    const response = await fetch(...);  // Throws on timeout
    return response;
})

// Second parameter of .then() catches it:
.then(successHandler, (error) => {
    if (errorHandler) {
        return errorHandler(error);
    } else {
        return Promise.reject(error);
    }
})
```

**Why Use This Pattern?**

1. **Sequential Execution**: Each interceptor waits for previous one
2. **Error Recovery**: Interceptors can catch and fix errors
3. **Immutable Chain**: Original promise isn't modified
4. **Type Safety**: Each step expects specific input/output format
5. **Debugging**: Easy to add console.logs at each step

**Key Points:**

- Interceptors must return a value (config or response)
- Errors can be caught and handled at any point
- The chain is built once per request
- All interceptors share the same promise chain
- `bind(this)` ensures `#dispatchRequest` maintains class context

---

## Architecture & Design Decisions

### Why Classes?

- Encapsulation of state (config, interceptors)
- Private methods (#) for internal logic
- Instance creation for multiple API clients
- Clear separation of concerns

### Why Private Methods (#)?

```javascript
#request()
#dispatchRequest()
#mergeConfig()
#mergeConfigs()
```

- Hide implementation details
- Prevent external modification
- Clear API surface (only public methods exposed)
- Follows encapsulation principles

### Why Async/Await in #dispatchRequest?

```javascript
// Way 1: Promise chain
return fetch(url, config).finally(() => clearTimeout(timeOutId));

// Way 2: Async/Await (chosen)
try {
    const response = await fetch(url, config);
    return response;
} finally {
    clearTimeout(timeOutId);
}
```

**Chosen Way 2 because:**
- More readable for error handling
- Finally block guaranteed to run
- Easier to debug with stack traces
- Synchronous-looking async code

### Why Bind Context?

```javascript
successHandler: this.#dispatchRequest.bind(this)
```

Without `bind(this)`:
```javascript
// Inside interceptor chain loop
successHandler(config);  // 'this' is undefined in #dispatchRequest!
```

With `bind(this)`:
```javascript
// 'this' correctly refers to Fetchify instance
this.config, this.requestInterceptors, etc. are accessible
```

### Why Two Merge Methods?

1. **#mergeConfig(newConfig)**: Merges with `this.config`
   - Used in constructor and #request
   - Instance-specific merging

2. **#mergeConfigs(config1, config2)**: Merges two arbitrary configs
   - Used in #dispatchRequest
   - Doesn't depend on instance state

Separation provides flexibility and reusability.

---

## Code Examples

### Complete Example with All Features

```javascript
import fetchify from "./fetchify.js";

// 1. Create instance with base config
const api = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1'
    }
});

// 2. Add request interceptor for auth
api.addRequestInterceptor(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.config.headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('→ Request:', config.config.method, config.endPoint);
        return config;
    },
    (error) => {
        console.error('Request interceptor failed:', error);
        return Promise.reject(error);
    }
);

// 3. Add response interceptor for error handling
api.addResponseInterceptor(
    (response) => {
        console.log('← Response:', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    },
    (error) => {
        if (error.message.includes('timeout')) {
            alert('Request timed out. Please check your connection.');
        }
        return Promise.reject(error);
    }
);

// 4. Make requests
async function example() {
    try {
        // GET request
        const usersResponse = await api.get('/users');
        const users = await usersResponse.json();
        console.log('Users:', users);

        // POST request with custom timeout
        const newUser = await api.post('/users', {
            body: JSON.stringify({ 
                name: 'John Doe',
                email: 'john@example.com' 
            }),
            timeout: 10000  // Override default timeout
        });
        const created = await newUser.json();
        console.log('Created user:', created);

        // PUT request
        const updateResponse = await api.put('/users/1', {
            body: JSON.stringify({ name: 'Jane Doe' })
        });

        // PATCH request
        const patchResponse = await api.patch('/users/1', {
            body: JSON.stringify({ email: 'jane@example.com' })
        });

        // DELETE request
        await api.delete('/users/1');

    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

example();
```

### Multiple API Instances

```javascript
// Different APIs with different configs
const mainAPI = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000
});

const authAPI = fetchify.create({
    baseURL: 'https://auth.example.com',
    timeout: 10000
});

const analyticsAPI = fetchify.create({
    baseURL: 'https://analytics.example.com',
    timeout: 3000,
    headers: {
        'X-Analytics-Key': 'secret123'
    }
});

// Use them independently
await mainAPI.get('/users');
await authAPI.post('/login', { body: credentials });
await analyticsAPI.post('/track', { body: event });
```

---

## Error Handling

### Types of Errors

1. **Network Errors**: No internet, DNS failure, etc.
2. **Timeout Errors**: Request exceeded timeout duration
3. **HTTP Errors**: 4xx, 5xx status codes
4. **Interceptor Errors**: Thrown by custom interceptor logic

### Error Handling Pattern

```javascript
async function safeRequest() {
    try {
        const response = await api.get('/users', { timeout: 2000 });
        
        // Check HTTP status
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        // Timeout error
        if (error.message.includes('timeout')) {
            console.error('Request timed out');
            return null;
        }
        
        // Network error
        if (error.message.includes('fetch')) {
            console.error('Network error');
            return null;
        }
        
        // Other errors
        console.error('Unknown error:', error);
        throw error;
    }
}
```

### Global Error Handling with Interceptors

```javascript
api.addResponseInterceptor(
    (response) => {
        // Handle specific status codes globally
        switch(response.status) {
            case 401:
                console.error('Unauthorized - redirecting to login');
                window.location.href = '/login';
                break;
            case 403:
                console.error('Forbidden - insufficient permissions');
                break;
            case 404:
                console.error('Resource not found');
                break;
            case 500:
                console.error('Server error');
                break;
        }
        return response;
    },
    (error) => {
        // Log all errors globally
        console.error('[Global Error Handler]', error);
        
        // Send error to monitoring service
        // sendToSentry(error);
        
        return Promise.reject(error);
    }
);
```

---

## API Reference

### fetchify.create(config)

Creates a new Fetchify instance.

**Parameters:**
- `config` (Object): Configuration object
  - `baseURL` (String): Base URL for all requests
  - `timeout` (Number): Default timeout in milliseconds
  - `headers` (Object): Default headers for all requests

**Returns:** Fetchify instance

**Example:**
```javascript
const api = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: { 'Authorization': 'Bearer token' }
});
```

---

### instance.get(endpoint, config)

Performs a GET request.

**Parameters:**
- `endpoint` (String): API endpoint (appended to baseURL)
- `config` (Object, optional): Request-specific config
  - `timeout` (Number): Override default timeout
  - `headers` (Object): Additional headers
  - Any other fetch options

**Returns:** Promise<Response>

**Example:**
```javascript
const response = await api.get('/users', { timeout: 3000 });
const users = await response.json();
```

---

### instance.post(endpoint, config)

Performs a POST request.

**Parameters:**
- `endpoint` (String): API endpoint
- `config` (Object, optional): Request-specific config
  - `body` (String): Request body (usually JSON.stringify)
  - `timeout` (Number): Override default timeout
  - `headers` (Object): Additional headers

**Returns:** Promise<Response>

**Example:**
```javascript
const response = await api.post('/users', {
    body: JSON.stringify({ name: 'John' }),
    timeout: 10000
});
```

---

### instance.put(endpoint, config)

Performs a PUT request (full update).

**Parameters:** Same as POST

**Example:**
```javascript
await api.put('/users/1', {
    body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
```

---

### instance.patch(endpoint, config)

Performs a PATCH request (partial update).

**Parameters:** Same as POST

**Example:**
```javascript
await api.patch('/users/1', {
    body: JSON.stringify({ email: 'newemail@example.com' })
});
```

---

### instance.delete(endpoint, config)

Performs a DELETE request.

**Parameters:**
- `endpoint` (String): API endpoint
- `config` (Object, optional): Request-specific config

**Returns:** Promise<Response>

**Example:**
```javascript
await api.delete('/users/1');
```

---

### instance.addRequestInterceptor(successHandler, errorHandler)

Adds a request interceptor.

**Parameters:**
- `successHandler` (Function): Called before request
  - Receives: `{ endPoint, config }`
  - Must return: Modified `{ endPoint, config }`
- `errorHandler` (Function, optional): Called if previous interceptor failed
  - Receives: Error object
  - Must return: Rejected promise or recovery value

**Example:**
```javascript
api.addRequestInterceptor(
    (config) => {
        config.config.headers['X-Timestamp'] = Date.now();
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);
```

---

### instance.addResponseInterceptor(successHandler, errorHandler)

Adds a response interceptor.

**Parameters:**
- `successHandler` (Function): Called after response received
  - Receives: Response object
  - Must return: Response object (modified or not)
- `errorHandler` (Function, optional): Called on request failure
  - Receives: Error object
  - Must return: Rejected promise or recovery value

**Example:**
```javascript
api.addResponseInterceptor(
    (response) => {
        console.log('Status:', response.status);
        return response;
    },
    (error) => {
        if (error.message.includes('timeout')) {
            alert('Request timed out');
        }
        return Promise.reject(error);
    }
);
```

---

## Comparison with Axios

| Feature | Fetchify | Axios |
|---------|----------|-------|
| Size | ~5KB | ~20KB |
| Dependencies | None (native fetch) | Standalone library |
| Browser Support | Modern browsers | All browsers (polyfills) |
| Interceptors | ✅ | ✅ |
| Timeout | ✅ | ✅ |
| Request Cancellation | ✅ (AbortController) | ✅ (CancelToken) |
| Automatic JSON Transform | ❌ (manual) | ✅ |
| Progress Events | ❌ | ✅ |
| TypeScript | ❌ | ✅ |

---

## Future Enhancements

Potential features to add:
- Retry logic with exponential backoff
- Request caching
- Automatic JSON parsing
- Progress events for uploads
- TypeScript definitions
- Request/response transformation helpers
- CSRF token handling
- File upload helpers

---

## License

MIT License - Free to use and modify

---

## Contributing

Feel free to submit issues and pull requests for improvements!

---

**Last Updated:** January 2026  
**Version:** 1.0.0  
**Author:** Rutansh Chawla

---

## Quick Reference Card

```javascript
// Create instance
const api = fetchify.create({ baseURL: '...', timeout: 5000 });

// Requests
await api.get('/path', { timeout: 3000 });
await api.post('/path', { body: JSON.stringify(data) });
await api.put('/path', { body: JSON.stringify(data) });
await api.patch('/path', { body: JSON.stringify(data) });
await api.delete('/path');

// Interceptors
api.addRequestInterceptor((config) => { /* modify */ return config; });
api.addResponseInterceptor((response) => { /* handle */ return response; });

// Error handling
try {
    const res = await api.get('/path');
    const data = await res.json();
} catch (error) {
    console.error(error.message);
}
```

---