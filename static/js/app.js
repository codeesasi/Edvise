class UrlManager {
    constructor() {
        // Default settings
        this.defaultSettings = {
            refreshInterval: 30000,
            itemsPerPage: 5
        };
        
        // Initialize with default settings, will be overridden if stored settings exist
        this.refreshInterval = this.defaultSettings.refreshInterval;
        this.itemsPerPage = this.defaultSettings.itemsPerPage;
        
        this.urls = [];
        this.editModal = null;
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalUrls = [];
        
        // Load settings from localStorage when object is created
        this.loadSettings();
    }
    
    // Save settings to localStorage
    saveSettings() {
        const settings = {
            refreshInterval: this.refreshInterval,
            itemsPerPage: this.itemsPerPage
        };
        localStorage.setItem('edvise_settings', JSON.stringify(settings));
    }
    
    // Load settings from localStorage
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('edvise_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                // Apply saved settings
                this.refreshInterval = settings.refreshInterval || this.defaultSettings.refreshInterval;
                this.itemsPerPage = settings.itemsPerPage || this.defaultSettings.itemsPerPage;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
            // If there's an error, use default settings
            this.refreshInterval = this.defaultSettings.refreshInterval;
            this.itemsPerPage = this.defaultSettings.itemsPerPage;
        }
    }

    initialize() {
        // Initialize DOM elements after document is ready
        this.loader = document.getElementById('loader');
        this.container = document.getElementById('url-container');
        this.noData = document.getElementById('no-data');
        this.searchInput = document.getElementById('searchInput');
        this.dateFilter = document.getElementById('dateFilter');
        this.dateFrom = document.getElementById('dateFrom');
        this.dateTo = document.getElementById('dateTo');
        this.customDateRange = document.getElementById('customDateRange');
        this.toggleFiltersBtn = document.getElementById('toggleFilters');
        this.quickSearch = document.getElementById('quickSearch');
        this.sortFilter = document.getElementById('sortFilter');
        this.filterModal = new bootstrap.Modal(document.getElementById('filterModal'));
        this.applyFiltersBtn = document.getElementById('applyFilters');
        this.editModal = new bootstrap.Modal(document.getElementById('editModal'));

        this.currentFilters = {
            search: '',
            dateRange: { from: null, to: null },
            sort: 'date_desc'
        };

        this.setupEventListeners();
        
        // Start fetching data
        this.fetchUrls();
        setInterval(() => this.fetchUrls(), this.refreshInterval);
    }

    setupEventListeners() {
        if (this.quickSearch) {
            this.quickSearch.addEventListener('input', (e) => {
                if (this.searchInput) this.searchInput.value = e.target.value;
                this.filterUrls();
            });
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.quickSearch.value = e.target.value;
                this.filterUrls();
            });
        }
        if (this.sortFilter) {
            this.sortFilter.addEventListener('change', () => this.filterUrls());
        }
        document.querySelectorAll('[data-sort]').forEach(button => {
            button.addEventListener('click', (e) => this.sortUrls(e.target.dataset.sort));
        });
        if (this.dateFilter) {
            this.dateFilter.addEventListener('change', () => this.handleDateFilterChange());
        }
        if (this.dateFrom) {
            this.dateFrom.addEventListener('change', () => this.filterUrls());
        }
        if (this.dateTo) {
            this.dateTo.addEventListener('change', () => this.filterUrls());
        }
        if (this.toggleFiltersBtn) {
            this.toggleFiltersBtn.addEventListener('click', () => {
                const filterPanel = document.getElementById('filterPanel');
                if (filterPanel.style.display === 'none' || !filterPanel.style.display) {
                    filterPanel.style.display = 'block';
                } else {
                    filterPanel.style.display = 'none';
                }
            });
        }
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => {
                this.filterUrls();
                this.filterModal.hide();
            });
        }
        
        // Add event listener for edit form submission to prevent default form behavior
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEdit();
            });
        }
        
        // Add input validation for the edit form fields
        const editTitle = document.getElementById('editTitle');
        if (editTitle) {
            editTitle.addEventListener('input', () => {
                this.validateEditForm();
            });
        }
        
        // Add settings button event listener
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }
    
    // Helper method to validate the edit form
    validateEditForm() {
        const title = document.getElementById('editTitle').value.trim();
        const saveButton = document.querySelector('#editModal .btn-primary');
        
        if (saveButton) {
            saveButton.disabled = title.length === 0;
        }
        
        return title.length > 0;
    }
    
    // Helper method to reset the edit form
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

    async fetchUrls() {
        this.showLoader();
        try {
            const response = await fetch('/api/urls');
            this.urls = await response.json();
            this.renderUrls(this.urls);
        } catch (error) {
            console.error('Error loading URLs:', error);
            this.showToast('Failed to load URLs', 'error');
        } finally {
            this.hideLoader();
        }
    }

    renderUrls(urls) {
        this.totalUrls = urls;
        this.totalPages = Math.ceil(urls.length / this.itemsPerPage);
        
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
        
        if (urls.length === 0) {
            this.container.innerHTML = '';
            this.noData.style.display = 'block';
            this.renderPagination(0);
        } else {
            this.noData.style.display = 'none';
            
            // Get current page items
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = Math.min(startIndex + this.itemsPerPage, urls.length);
            const currentPageItems = urls.slice(startIndex, endIndex);
            
            this.container.innerHTML = currentPageItems.map(url => this.createUrlCard(url)).join('');
            this.renderPagination(urls.length);
        }
    }
    
    renderPagination(totalItems) {
        const paginationElement = document.getElementById('pagination');
        if (!paginationElement) return;
        
        if (totalItems === 0 || this.totalPages <= 1) {
            paginationElement.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${this.currentPage - 1}">Previous</a>
                    </li>
        `;
        
        // Show up to 5 page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(startPage + maxPagesToShow - 1, this.totalPages);
        
        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        // First page link if not in range
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Last page link if not in range
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${this.totalPages}">${this.totalPages}</a>
                </li>
            `;
        }
        
        paginationHTML += `
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${this.currentPage + 1}">Next</a>
                    </li>
                </ul>
            </nav>
        `;
        
        paginationElement.innerHTML = paginationHTML;
        
        // Add click event listeners to pagination links
        document.querySelectorAll('#pagination .page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (!isNaN(page)) {
                    this.goToPage(page);
                }
            });
        });
    }
    
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderUrls(this.totalUrls);
        window.scrollTo(0, 0); // Scroll to top when changing pages
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

    showSettings() {
        // Initialize settings modal if it exists
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        if (settingsModal) {
            // Fill the settings form with current values before showing it
            const itemsPerPageSelect = document.getElementById('itemsPerPage');
            const refreshIntervalInput = document.getElementById('refreshInterval');
            
            if (itemsPerPageSelect) {
                // Set the selected value for items per page
                for (const option of itemsPerPageSelect.options) {
                    if (parseInt(option.value) === this.itemsPerPage) {
                        option.selected = true;
                        break;
                    }
                }
            }
            
            if (refreshIntervalInput) {
                // Convert ms to seconds for the form
                refreshIntervalInput.value = this.refreshInterval / 1000;
            }
            
            // Add event listener for save settings button
            const saveSettingsBtn = document.getElementById('saveSettings');
            if (saveSettingsBtn) {
                // Remove any existing event listeners to avoid duplicates
                const newSaveBtn = saveSettingsBtn.cloneNode(true);
                saveSettingsBtn.parentNode.replaceChild(newSaveBtn, saveSettingsBtn);
                
                newSaveBtn.addEventListener('click', () => this.applySettings());
            }
            
            settingsModal.show();
        } else {
            this.showToast('Settings feature coming soon!', 'info');
        }
    }
    
    applySettings() {
        try {
            // Get values from form
            const itemsPerPageSelect = document.getElementById('itemsPerPage');
            const refreshIntervalInput = document.getElementById('refreshInterval');
            
            let newItemsPerPage = this.itemsPerPage;
            let newRefreshInterval = this.refreshInterval;
            
            // Update items per page if valid
            if (itemsPerPageSelect) {
                newItemsPerPage = parseInt(itemsPerPageSelect.value);
                if (isNaN(newItemsPerPage) || newItemsPerPage < 1) {
                    newItemsPerPage = this.defaultSettings.itemsPerPage;
                }
            }
            
            // Update refresh interval if valid (convert from seconds to ms)
            if (refreshIntervalInput) {
                const intervalSeconds = parseInt(refreshIntervalInput.value);
                if (!isNaN(intervalSeconds) && intervalSeconds >= 10) {
                    newRefreshInterval = intervalSeconds * 1000;
                }
            }
            
            // Apply the new settings
            const settingsChanged = this.itemsPerPage !== newItemsPerPage || 
                                   this.refreshInterval !== newRefreshInterval;
            
            if (settingsChanged) {
                // Stop the existing polling interval
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                }
                
                // Apply new settings
                this.itemsPerPage = newItemsPerPage;
                this.refreshInterval = newRefreshInterval;
                
                // Save settings to localStorage
                this.saveSettings();
                
                // Restart polling with new interval
                this.startPolling();
                
                // Re-render URLs with new items per page
                if (this.totalUrls && this.totalUrls.length) {
                    this.renderUrls(this.totalUrls);
                }
                
                this.showToast('Settings saved successfully', 'success');
            }
            
            // Hide the modal
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (settingsModal) {
                settingsModal.hide();
            }
        } catch (error) {
            console.error('Error applying settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }
}

const urlManager = new UrlManager();
document.addEventListener('DOMContentLoaded', () => {
    urlManager.initialize();
});