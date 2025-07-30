class UrlApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.endpoints = {
            urls: '/api/urls',
            visit: '/api/updateVisit',
            settings: '/api/settings'
        };
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    async fetchUrls() {
        try {
            console.log('API Service: Fetching URLs');
            const data = await this.sendRequest(this.endpoints.urls);
            
            // Ensure we have an array response, even if empty
            if (Array.isArray(data)) {
                console.log(`API Service: Successfully fetched ${data.length} URLs`);
                return data;
            } else {
                console.error('API Service: Unexpected response format:', data);
                return [];
            }
        } catch (error) {
            console.error('API Service: Error fetching URLs:', error);
            throw new Error(`Failed to fetch URLs: ${error.message}`);
        }
    }
    
    async deleteUrl(id) {
        return this.sendRequest(
            this.endpoints.urls,
            'DELETE',
            { id }
        );
    }
    
    async updateUrl(id, title, thumbnail) {
        return this.sendRequest(
            this.endpoints.urls,
            'PUT',
            { id, title, thumbnail }
        );
    }
    
    async trackUrlVisit(id) {
        return this.sendRequest(
            this.endpoints.visit,
            'POST',
            { id }
        );
    }
    
    async fetchSettings() {
        return this.sendRequest(this.endpoints.settings);
    }
    
    async updateSettings(settings) {
        return this.sendRequest(
            this.endpoints.settings,
            'PUT',
            settings
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
            console.log(`API ${method} request to ${endpoint}`, data);
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
