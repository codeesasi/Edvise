class UrlManager {
    constructor() {
        // Initialize managers and services
        this.settings = new SettingsManager();
        this.ui = new UIManager();
        this.api = new UrlApiService();
        
        // Url data storage
        this.urls = [];
        this.totalUrls = [];
        
        // Pagination state
        this.currentPage = 1;
        this.totalPages = 1;
        
        // Modal references
        this.editModal = null;
        this.filterModal = null;
        
        // Polling
        this.pollingInterval = null;
    }

    async initialize() {
        // Initialize UI manager
        this.ui.initialize();
        
        try {
            // First load settings from server - await this to ensure settings are loaded
            await this.settings.loadSettings();
            
            // Initialize DOM elements for this class
            this.searchInput = document.getElementById('searchInput');
            this.dateFilter = document.getElementById('dateFilter');
            this.dateFrom = document.getElementById('dateFrom');
            this.dateTo = document.getElementById('dateTo');
            this.customDateRange = document.getElementById('customDateRange');
            this.toggleFiltersBtn = document.getElementById('toggleFilters');
            this.quickSearch = document.getElementById('quickSearch');
            this.sortFilter = document.getElementById('sortFilter');
            this.applyFiltersBtn = document.getElementById('applyFilters');
            
            // Initialize modals
            const filterModalElement = document.getElementById('filterModal');
            const editModalElement = document.getElementById('editModal');
            
            if (filterModalElement && window.bootstrap) {
                this.filterModal = new bootstrap.Modal(filterModalElement);
            }
            
            if (editModalElement && window.bootstrap) {
                this.editModal = new bootstrap.Modal(editModalElement);
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start fetching data - await to ensure data is loaded
            await this.fetchUrls();
            
            // Start polling for regular updates
            this.startPolling();
            
            // Dispatch event that app is initialized
            window.dispatchEvent(new Event('app-initialized'));
            
            console.log('Application successfully initialized');
        } catch (error) {
            console.error('Error during initialization:', error);
            this.ui.showToast('Error initializing application. Please try refreshing the page.', 'error');
            
            // Still dispatch event to hide loading overlay
            window.dispatchEvent(new Event('app-initialized'));
        }
    }

    setupEventListeners() {
        // Setup filter event listeners
        this.setupFilterListeners();
        this.setupFormListeners();
        this.setupButtonListeners();
        
        // Add delegation for URL visit tracking
        document.addEventListener('click', (e) => {
            // Check if clicked element or its parent is a visit button
            const visitButton = e.target.closest('.visit-url-btn');
            if (visitButton) {
                const urlId = visitButton.dataset.id;
                if (urlId) {
                    // Track the visit asynchronously (don't await to not block navigation)
                    this.trackUrlVisit(urlId);
                }
            }
        });
    }
    
    setupFilterListeners() {
        if (this.quickSearch) {
            this.quickSearch.addEventListener('input', (e) => {
                if (this.searchInput) this.searchInput.value = e.target.value;
                this.filterUrls();
            });
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                if (this.quickSearch) {
                    this.quickSearch.value = this.searchInput.value;
                }
                this.filterUrls();
            });
        }
        
        if (this.sortFilter) {
            this.sortFilter.addEventListener('change', () => this.filterUrls());
        }
        
        if (this.dateFilter) {
            this.dateFilter.addEventListener('change', () => this.handleDateFilterChange());
        }

        if (this.dateFrom) {
            this.dateFrom.addEventListener('change', () => this.filterUrls());
        }
        
        if (this.dateTo) {
            this.dateTo.addEventListener('change', () => this.filterUrls());
        }
        
        document.querySelectorAll('[data-sort]').forEach(button => {
            button.addEventListener('click', (e) => this.sortUrls(e.target.dataset.sort));
        });
    }
    
    setupFormListeners() {
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEdit();
            });
        }
        
        const editTitle = document.getElementById('editTitle');
        if (editTitle) {
            editTitle.addEventListener('input', () => {
                this.validateEditForm();
            });
        }
    }
    
    setupButtonListeners() {
        if (this.toggleFiltersBtn) {
            this.toggleFiltersBtn.addEventListener('click', () => {
                const filterPanel = document.getElementById('filterPanel');
                if (filterPanel) {
                    filterPanel.style.display = filterPanel.style.display === 'none' || !filterPanel.style.display ? 'block' : 'none';
                }
            });
        }
        
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => {
                this.filterUrls();
                if (this.filterModal) {
                    this.filterModal.hide();
                }
            });
        }
        
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }
    
    // Settings methods
    showSettings() {
        this.settings.showSettingsModal((newSettings) => {
            // Handle settings changes
            this.restartPolling();
            this.renderUrls(this.totalUrls);
            this.ui.showToast('Settings saved successfully', 'success');
        });
    }
    
    // Polling methods
    startPolling() {
        // Clear any existing interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Fetch URLs immediately
        this.fetchUrls();
        
        // Start a new interval with the current refresh interval from settings
        const refreshInterval = this.settings.getSetting('refreshInterval');
        console.log(`Starting polling with interval: ${refreshInterval}ms`);
        this.pollingInterval = setInterval(() => this.fetchUrls(), refreshInterval);
    }
    
    restartPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Fetch URLs immediately
        this.fetchUrls();
        
        // Start a new interval with the current refresh interval
        const refreshInterval = this.settings.getSetting('refreshInterval');
        this.pollingInterval = setInterval(() => this.fetchUrls(), refreshInterval);
    }
    
    // URL manipulation methods
    async fetchUrls() {
        this.ui.showLoader();
        try {
            console.log('Fetching URLs from server...');
            const urls = await this.api.fetchUrls();
            
            // Debug the response
            console.log('URLs fetched:', urls && urls.length ? urls.length : 0);
            
            // Ensure we have a valid array to work with
            this.urls = Array.isArray(urls) ? urls : [];
            this.renderUrls(this.urls);
            return this.urls;
        } catch (error) {
            console.error('Error fetching URLs:', error);
            this.ui.showToast('Failed to load URLs', 'error');
            this.urls = [];
            this.renderUrls([]);
            return [];
        } finally {
            this.ui.hideLoader();
        }
    }
    
    renderUrls(urls) {
        // Ensure we're working with an array
        this.totalUrls = Array.isArray(urls) ? urls : [];
        
        // Debug the rendering process
        console.log('Rendering URLs:', this.totalUrls.length);
        
        const itemsPerPage = this.settings.getSetting('itemsPerPage');
        this.totalPages = Math.ceil(this.totalUrls.length / itemsPerPage);
        
        // Reset to page 1 if we have no pages or are beyond the last page
        if (this.totalPages === 0 || this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
        
        if (this.totalUrls.length === 0) {
            if (this.ui.container) {
                this.ui.container.innerHTML = '';
            }
            if (this.ui.noData) {
                this.ui.noData.style.display = 'block';
            }
            
            // FIX: Use local function instead of bind which was causing errors
            const goToPageFunc = (page) => this.goToPage(page);
            
            // Only call renderPagination if it exists
            if (this.ui && typeof this.ui.renderPagination === 'function') {
                this.ui.renderPagination(this.currentPage, this.totalPages, 0, goToPageFunc);
            }
            return;
        }
        
        if (this.ui.noData) {
            this.ui.noData.style.display = 'none';
        }
        
        // Get current page items
        const startIndex = (this.currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, this.totalUrls.length);
        const currentPageItems = this.totalUrls.slice(startIndex, endIndex);
        
        // Ensure we have handlers
        const handlers = {
            edit: (url, title, thumbnail) => this.editUrl(url, title, thumbnail),
            delete: (url) => this.deleteUrl(url)
        };
        
        // Render the URLs if we have a container
        if (this.ui.container) {
            this.ui.container.innerHTML = currentPageItems
                .map(url => this.ui.createUrlCard(url, handlers))
                .join('');
        }
        
        // FIX: Use local function instead of bind which was causing errors
        const goToPageFunc = (page) => this.goToPage(page);
        
        // Only call renderPagination if it exists
        if (this.ui && typeof this.ui.renderPagination === 'function') {
            this.ui.renderPagination(
                this.currentPage, 
                this.totalPages, 
                this.totalUrls.length, 
                goToPageFunc
            );
        }
    }
    
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.renderUrls(this.totalUrls);
        window.scrollTo(0, 0); // Scroll to top when changing pages
    }

    // Form handling methods
    validateEditForm() {
        const title = document.getElementById('editTitle').value.trim();
        const saveButton = document.querySelector('#editModal .btn-primary');
        
        if (saveButton) {
            saveButton.disabled = !title.length;
        }
        
        return title.length > 0;
    }
    
    resetEditForm() {
        const form = document.getElementById('editForm');
        if (form) {
            form.reset();
        }
        
        const saveButton = document.querySelector('#editModal .btn-primary');
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
    
    handleDateFilterChange() {
        const value = this.dateFilter.value;
        this.customDateRange.style.display = value === 'custom' ? 'block' : 'none';
        if (value !== 'custom') {
            this.filterUrls();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    createUrlCard(url) {
        return `
            <tr>
                <td class="thumbnail-cell">
                    ${url.thumbnail ? `<img src="${url.thumbnail}" alt="${url.title}" class="img-fluid rounded">` : '<i class="bi bi-link-45deg fs-2 text-primary"></i>'}
                </td>
                <td>
                    <div>
                        <h5 class="mb-1 text-truncate" style="max-width: 300px;" title="${url.title}">${url.title}</h5>
                        <small class="text-muted d-block mb-1">${this.extractDomain(url.url)}</small>
                        <small class="text-muted">${this.formatDate(url.created_date)}</small>
                    </div>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <a href="${url.url}" target="_blank" class="btn btn-sm btn-primary visit-url-btn" data-id="${url.id}">Visit</a>
                        <button class="btn btn-sm btn-warning" onclick="urlManager.editUrl('${url.id}', '${url.url}', '${url.title.replace(/'/g, "\\'")}', '${url.thumbnail || ''}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="urlManager.deleteUrl('${url.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Helper function to extract domain from URL
    extractDomain(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace(/^www\./, '');
        } catch (e) {
            return url;
        }
    }

    showLoader() {
        if (this.loader) {
            this.loader.style.display = 'block';
            this.noData.style.display = 'none';
        }
    }

    hideLoader() {
        if (this.loader) {
            this.loader.classList.add('fade-out');
            setTimeout(() => {
                this.loader.style.display = 'none';
                this.loader.classList.remove('fade-out');
            }, 500);
        }
    }

    showToast(message, type = 'success') {
        toastr[type](message, '', {
            closeButton: true,
            progressBar: true,
            positionClass: 'toast-bottom-right'
        });
    }

    getDateRange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (this.dateFilter.value) {
            case 'today':
                return {
                    from: today,
                    to: new Date(today.getTime() + 86399999) // End of day
                };
            case 'week':
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                return {
                    from: weekStart,
                    to: new Date()
                };
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    from: monthStart,
                    to: new Date()
                };
            case 'custom':
                return {
                    from: this.dateFrom.value ? new Date(this.dateFrom.value) : null,
                    to: this.dateTo.value ? new Date(this.dateTo.value) : null
                };
            default:
                return { from: null, to: null };
        }
    }

    filterUrls() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const { from, to } = this.getDateRange();
        const sortBy = this.sortFilter.value;

        let filtered = this.urls.filter(url => {
            const matchesSearch = !searchTerm || 
                url.title.toLowerCase().includes(searchTerm) || 
                url.url.toLowerCase().includes(searchTerm);

            if (!matchesSearch) return false;

            if (from && to) {
                const urlDate = new Date(url.created_date);
                return urlDate >= from && urlDate <= to;
            }

            return true;
        });

        // Sort filtered results
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date_desc':
                    return new Date(b.created_date) - new Date(a.created_date);
                case 'date_asc':
                    return new Date(a.created_date) - new Date(b.created_date);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        this.renderUrls(filtered);
    }

    sortUrls(by) {
        const sorted = [...this.urls].sort((a, b) => {
            if (by === 'date') {
                return new Date(b.created_date) - new Date(a.created_date);
            }
            return a.title.localeCompare(b.title);
        });
        this.renderUrls(sorted);
    }

    // Make sure we have the startPolling method defined
    startPolling() {
        // Clear any existing interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Fetch URLs immediately
        this.fetchUrls();
        
        // Start a new interval with the current refresh interval from settings
        const refreshInterval = this.settings.getSetting('refreshInterval');
        console.log(`Starting polling with interval: ${refreshInterval}ms`);
        this.pollingInterval = setInterval(() => this.fetchUrls(), refreshInterval);
    }

    editUrl(id, url, title, thumbnail) {
        try {
            // Clear any previous form data
            this.resetEditForm();
            
            // Safely set form values
            const urlIdField = document.getElementById('editUrlId');
            const urlField = document.getElementById('editUrl');
            const titleField = document.getElementById('editTitle');
            const thumbnailField = document.getElementById('editThumbnail');
            
            if (urlIdField) urlIdField.value = id || '';
            if (urlField) urlField.value = url || '';
            if (titleField) titleField.value = title || '';
            if (thumbnailField) thumbnailField.value = thumbnail || '';
            
            // Show the modal
            if (this.editModal) {
                this.editModal.show();
                // Focus on title field
                setTimeout(() => {
                    if (titleField) titleField.focus();
                }, 500);
            }
            
            // Validate the form
            this.validateEditForm();
        } catch (error) {
            console.error('Error setting up edit modal:', error);
            this.showToast('Error preparing edit form', 'error');
        }
    }

    async saveEdit() {
        // Check if form is valid before proceeding
        if (!this.validateEditForm()) {
            this.showToast('Please provide a title', 'warning');
            return;
        }
        
        // Get form values
        const urlIdField = document.getElementById('editUrlId');
        const titleField = document.getElementById('editTitle');
        const thumbnailField = document.getElementById('editThumbnail');
        
        if (!urlIdField || !titleField) {
            this.showToast('Form fields not found', 'error');
            return;
        }
        
        const id = urlIdField.value.trim();
        const title = titleField.value.trim();
        const thumbnail = thumbnailField ? thumbnailField.value.trim() : '';
        
        if (!id) {
            this.showToast('URL ID cannot be empty', 'warning');
            return;
        }
        
        // Disable the save button to prevent multiple clicks
        const saveButton = document.querySelector('#editModal .btn-primary');
        if (saveButton) {
            saveButton.disabled = true;
            // Show a loading indicator or change button text
            const originalText = saveButton.innerHTML;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
            
            try {
                // Make the API request to update the URL
                const response = await fetch('/api/urls', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id, title, thumbnail })
                });

                if (response.ok) {
                    this.fetchUrls();
                    this.showToast('URL updated successfully');
                    
                    // Close the modal
                    if (this.editModal) {
                        this.editModal.hide();
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.message || 'Failed to update URL';
                    this.showToast(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error updating URL:', error);
                this.showToast('Failed to update URL', 'error');
            } finally {
                // Reset the save button
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalText;
                }
            }
        }
    }

    async deleteUrl(id) {
        if (confirm('Are you sure you want to delete this URL?')) {
            try {
                const response = await fetch('/api/urls', {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id })
                });
                
                if (response.ok) {
                    await this.fetchUrls();
                    this.showToast('URL deleted successfully');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.message || 'Failed to delete URL';
                    this.showToast(errorMessage, 'error');
                }
            } catch (error) {
                console.error('Error deleting URL:', error);
                this.showToast('Failed to delete URL', 'error');
            }
        }
    }

    // Add method to track URL visits
    async trackUrlVisit(id) {
        try {
            await this.api.trackUrlVisit(id);
            console.log(`Visit tracked for URL ID: ${id}`);
            
            // Update the visit count in the UI
            const visitButton = document.querySelector(`.visit-url-btn[data-id="${id}"]`);
            if (visitButton) {
                // Find or create the badge element
                let badge = visitButton.querySelector('.badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'position-absolute top-10 start-65 translate-middle badge rounded-pill bg-danger';
                    visitButton.classList.add('position-relative');
                    visitButton.appendChild(badge);
                }
                
                // Get the current visit count from the URL data
                const url = this.urls.find(u => u.id === id);
                if (url) {
                    // Increment the visit count and update the badge
                    url.visit = (parseInt(url.visit || 0) + 1).toString();
                    badge.innerHTML = url.visit > 99 ? '99+' : url.visit;
                    badge.innerHTML += '<span class="visually-hidden">visit count</span>';
                }
            }
        } catch (error) {
            console.error('Error tracking URL visit:', error);
        }
    }
}

// Wait for scripts to load before initializing
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM loaded, initializing application...');
        // Check if all required scripts are loaded
        if (!window.UrlApiService || !window.UIManager || !window.SettingsManager) {
            console.error('Required components not loaded');
            if (document.getElementById('loading-overlay')) {
                document.getElementById('loading-overlay').innerHTML = 
                    '<div class="text-center text-danger">' +
                    '<i class="bi bi-exclamation-triangle-fill fs-1"></i>' +
                    '<p class="mt-2">Failed to load application components</p>' +
                    '<button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>' +
                    '</div>';
            }
            return;
        }
        
        // Initialize URL Manager
        window.urlManager = new UrlManager();
        await window.urlManager.initialize();
    } catch (error) {
        console.error("Error initializing application:", error);
        if (document.getElementById('loading-overlay')) {
            document.getElementById('loading-overlay').innerHTML = 
                '<div class="text-center text-danger">' +
                '<i class="bi bi-exclamation-triangle-fill fs-1"></i>' +
                '<p class="mt-2">Application error: ' + error.message + '</p>' +
                '<button class="btn btn-primary mt-2" onclick="location.reload()">Retry</button>' +
                '</div>';
        }
    }
});