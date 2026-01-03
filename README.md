# Fetchify - A Lightweight HTTP Client Library

[![npm version](https://img.shields.io/npm/v/@rutansh0101/fetchify.svg)](https://www.npmjs.com/package/@rutansh0101/fetchify)
[![npm downloads](https://img.shields.io/npm/dm/@rutansh0101/fetchify.svg)](https://www.npmjs.com/package/@rutansh0101/fetchify)
[![license](https://img.shields.io/npm/l/@rutansh0101/fetchify.svg)](https://github.com/Rutansh0101/Fetchify-Rutansh-Chawla/blob/master/LICENSE)

A modern, lightweight HTTP client library built on top of the native Fetch API. It provides a clean, axios-like interface with support for interceptors, request/response transformation, and timeout handling.

---

## Installation

```bash
npm install @rutansh0101/fetchify
```

## Quick Start

```javascript
import fetchify from '@rutansh0101/fetchify';

// Create an instance
const api = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Make requests
const response = await api.get('/users');
const users = await response.json();
```

---

## Features

✅ **Axios-like API** - Familiar and easy to use  
✅ **Request/Response Interceptors** - Transform requests and responses  
✅ **Timeout Support** - Abort requests after specified duration  
✅ **Configuration Merging** - Instance, request-level, and default configs  
✅ **All HTTP Methods** - GET, POST, PUT, PATCH, DELETE  
✅ **Lightweight** - ~5KB with zero dependencies  

---

## Basic Usage

### Making Requests

```javascript
// GET request
const response = await api.get('/users');
const data = await response.json();

// POST request
await api.post('/users', {
    body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// PUT request
await api.put('/users/1', {
    body: JSON.stringify({ name: 'Jane Doe' })
});

// PATCH request
await api.patch('/users/1', {
    body: JSON.stringify({ email: 'jane@example.com' })
});

// DELETE request
await api.delete('/users/1');
```

### Request Configuration

Override default settings per request:

```javascript
const response = await api.get('/users', {
    timeout: 10000,
    headers: {
        'Authorization': 'Bearer token123'
    }
});
```

---

## Interceptors

### Request Interceptors

Modify requests before they are sent:

```javascript
api.addRequestInterceptor(
    (config) => {
        // Add authentication token
        const token = localStorage.getItem('authToken');
        config.config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
```

### Response Interceptors

Handle responses globally:

```javascript
api.addResponseInterceptor(
    (response) => {
        // Handle unauthorized responses
        if (response.status === 401) {
            window.location.href = '/login';
        }
        return response;
    },
    (error) => {
        console.error('Request failed:', error);
        return Promise.reject(error);
    }
);
```

---

## Advanced Examples

### Complete Setup with Authentication

```javascript
import fetchify from '@rutansh0101/fetchify';

const api = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to all requests
api.addRequestInterceptor((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Handle errors globally
api.addResponseInterceptor(
    (response) => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
    },
    (error) => {
        if (error.message.includes('timeout')) {
            alert('Request timed out. Please try again.');
        }
        return Promise.reject(error);
    }
);

// Use the API
async function fetchUsers() {
    try {
        const response = await api.get('/users');
        const users = await response.json();
        console.log(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
}
```

### Multiple API Instances

```javascript
const mainAPI = fetchify.create({
    baseURL: 'https://api.example.com',
    timeout: 5000
});

const authAPI = fetchify.create({
    baseURL: 'https://auth.example.com',
    timeout: 10000
});

// Use independently
await mainAPI.get('/users');
await authAPI.post('/login', { body: credentials });
```

---

## Error Handling

```javascript
try {
    const response = await api.get('/users', { timeout: 3000 });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
} catch (error) {
    if (error.message.includes('timeout')) {
        console.error('Request timed out');
    } else {
        console.error('Request failed:', error);
    }
}
```

---

## API Reference

### `fetchify.create(config)`

Creates a new Fetchify instance.

**Config Options:**
- `baseURL` (String) - Base URL for all requests
- `timeout` (Number) - Default timeout in milliseconds (default: 1000)
- `headers` (Object) - Default headers

### HTTP Methods

All methods return a Promise that resolves to the fetch Response object.

- `instance.get(endpoint, config)` - GET request
- `instance.post(endpoint, config)` - POST request
- `instance.put(endpoint, config)` - PUT request
- `instance.patch(endpoint, config)` - PATCH request
- `instance.delete(endpoint, config)` - DELETE request

### Interceptors

- `instance.addRequestInterceptor(successHandler, errorHandler)` - Intercept requests
- `instance.addResponseInterceptor(successHandler, errorHandler)` - Intercept responses

---

## Quick Reference

```javascript
// Create
const api = fetchify.create({ baseURL: '...', timeout: 5000 });

// Requests
await api.get('/path');
await api.post('/path', { body: JSON.stringify(data) });
await api.put('/path', { body: JSON.stringify(data) });
await api.patch('/path', { body: JSON.stringify(data) });
await api.delete('/path');

// Interceptors
api.addRequestInterceptor((config) => { return config; });
api.addResponseInterceptor((response) => { return response; });
```

---

## License

MIT License - Free to use and modify

## Author

Rutansh Chawla

---

**Version:** 1.0.0  
