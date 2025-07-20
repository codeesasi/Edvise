class UrlManager {
    constructor() {
        this.refreshInterval = 30000;
        this.urls = [];
        this.editModal = null;
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
        this.startPolling();
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
                    ${url.thumbnail ? `<img src="${url.thumbnail}" alt="${url.title}">` : '<i class="bi bi-link-45deg"></i>'}
                </td>
                <td>${url.title}</td>
                <td>
                    <div class="btn-group">
                        <a href="${url.url}" target="_blank" class="btn btn-sm btn-primary">Visit</a>
                        <button class="btn btn-sm btn-warning" onclick="urlManager.editUrl('${url.url}', '${url.title}', '${url.thumbnail || ''}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="urlManager.deleteUrl('${url.url}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    editUrl(url, title, thumbnail) {
        document.getElementById('editUrl').value = url;
        document.getElementById('editTitle').value = title;
        document.getElementById('editThumbnail').value = thumbnail;
        this.editModal.show();
    }

    async saveEdit() {
        const url = document.getElementById('editUrl').value;
        const title = document.getElementById('editTitle').value;
        const thumbnail = document.getElementById('editThumbnail').value;

        try {
            const response = await fetch('/api/urls', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ url, title, thumbnail })
            });

            if (response.ok) {
                this.editModal.hide();
                await this.fetchUrls();
                this.showToast('URL updated successfully');
            } else {
                this.showToast('Failed to update URL', 'error');
            }
        } catch (error) {
            console.error('Error updating URL:', error);
            this.showToast('Failed to update URL', 'error');
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
        if (urls.length === 0) {
            this.container.innerHTML = '';
            this.noData.style.display = 'block';
        } else {
            this.noData.style.display = 'none';
            this.container.innerHTML = urls.map(url => this.createUrlCard(url)).join('');
        }
    }

    async deleteUrl(url) {
        if (confirm('Are you sure you want to delete this URL?')) {
            try {
                await fetch('/api/urls', {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({url})
                });
                await this.fetchUrls();
                this.showToast('URL deleted successfully');
            } catch (error) {
                this.showToast('Failed to delete URL', 'error');
            }
        }
    }

    startPolling() {
        this.fetchUrls();
        setInterval(() => this.fetchUrls(), this.refreshInterval);
    }
}

const urlManager = new UrlManager();
document.addEventListener('DOMContentLoaded', () => {
    urlManager.initialize();
});
