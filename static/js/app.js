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

    initialize() {
        // Initialize UI manager
        this.ui.initialize();
        
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
        
        // Start fetching data
        this.startPolling();
    }

    setupEventListeners() {
        // Setup filter event listeners
        this.setupFilterListeners();
        this.setupFormListeners();
        this.setupButtonListeners();
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
        this.restartPolling();
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
            this.urls = await this.api.fetchUrls();
            this.renderUrls(this.urls);
        } catch (error) {
            console.error('Error fetching URLs:', error);
            this.ui.showToast('Failed to load URLs', 'error');
        } finally {
            this.ui.hideLoader();
        }
    }
    
    renderUrls(urls) {
        this.totalUrls = urls || [];
        const itemsPerPage = this.settings.getSetting('itemsPerPage');
        this.totalPages = Math.ceil(this.totalUrls.length / itemsPerPage);
        
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
        
        if (!this.totalUrls.length) {
            this.ui.container.innerHTML = '';
            this.ui.noData.style.display = 'block';
            this.ui.renderPagination(this.currentPage, this.totalPages, 0, this.goToPage.bind(this));
            return;
        }
        
        this.ui.noData.style.display = 'none';
        
        // Get current page items
        const startIndex = (this.currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, this.totalUrls.length);
        const currentPageItems = this.totalUrls.slice(startIndex, endIndex);
        
        const handlers = {
            edit: this.editUrl.bind(this),
            delete: this.deleteUrl.bind(this)
        };
        
        this.ui.container.innerHTML = currentPageItems
            .map(url => this.ui.createUrlCard(url, handlers))
            .join('');
            
        this.ui.renderPagination(
            this.currentPage, 
            this.totalPages, 
            this.totalUrls.length, 
            this.goToPage.bind(this)
        );
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
                        <a href="${url.url}" target="_blank" class="btn btn-sm btn-primary">Visit</a>
                        <button class="btn btn-sm btn-warning" onclick="urlManager.editUrl('${url.url}', '${url.title.replace(/'/g, "\\'")}', '${url.thumbnail || ''}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="urlManager.deleteUrl('${url.url}')">Delete</button>
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
        
        // Start a new interval with the current refresh interval
        this.pollingInterval = setInterval(() => this.fetchUrls(), this.refreshInterval);
        
        console.log(`Polling started with interval: ${this.refreshInterval}ms`);
    }

    editUrl(url, title, thumbnail) {
        try {
            // Clear any previous form data
            this.resetEditForm();
            
            // Safely set form values
            const urlField = document.getElementById('editUrl');
            const titleField = document.getElementById('editTitle');
            const thumbnailField = document.getElementById('editThumbnail');
            
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
        const urlField = document.getElementById('editUrl');
        const titleField = document.getElementById('editTitle');
        const thumbnailField = document.getElementById('editThumbnail');
        
        if (!urlField || !titleField) {
            this.showToast('Form fields not found', 'error');
            return;
        }
        
        const url = urlField.value.trim();
        const title = titleField.value.trim();
        const thumbnail = thumbnailField ? thumbnailField.value.trim() : '';
        
        if (!url) {
            this.showToast('URL cannot be empty', 'warning');
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
                    body: JSON.stringify({ url, title, thumbnail })
                });
                
                if (response.ok) {
                    this.showToast('URL updated successfully');
                    // Refresh the URL list
                    this.fetchUrls();
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
}

// Wait for scripts to load before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Initialize URL Manager
    window.urlManager = new UrlManager();
    window.urlManager.initialize();
});