class UrlApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.endpoints = {
            urls: '/api/urls'
        };
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    async fetchUrls() {
        return this.sendRequest(this.endpoints.urls);
    }
    
    async deleteUrl(url) {
        return this.sendRequest(
            this.endpoints.urls,
            'DELETE',
            { url }
        );
    }
    
    async updateUrl(url, title, thumbnail) {
        return this.sendRequest(
            this.endpoints.urls,
            'PUT',
            { url, title, thumbnail }
        );
    }
    
    /**
     * Generic method to send API requests
     * @param {string} endpoint - The API endpoint
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {Object} data - Request body data
     * @returns {Promise<any>} Response data
     * @throws {Error} Request error
     */
    async sendRequest(endpoint, method = 'GET', data = null) {
        const url = this.baseUrl + endpoint;
        const options = {
            method,
            headers: this.defaultHeaders
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }
            
            // For HEAD requests or empty responses
            if (method === 'HEAD' || response.headers.get('Content-Length') === '0') {
                return null;
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            // Return text response
            return await response.text();
        } catch (error) {
            console.error(`API error (${method} ${endpoint}):`, error);
            throw error;
        }
    }
}

// Export the class
window.UrlApiService = UrlApiService;
