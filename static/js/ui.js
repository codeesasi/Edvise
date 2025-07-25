class UIManager {
    constructor() {
        this.loader = null;
        this.container = null;
        this.noData = null;
    }

    initialize() {
        this.loader = document.getElementById('loader');
        this.container = document.getElementById('url-container');
        this.noData = document.getElementById('no-data');
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

    createUrlCard(url, handlers) {
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    extractDomain(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace(/^www\./, '');
        } catch (e) {
            return url;
        }
    }

    renderPagination(currentPage, totalPages, totalItems, goToPageCallback) {
        const paginationElement = document.getElementById('pagination');
        if (!paginationElement) return;
        
        if (totalItems === 0 || totalPages <= 1) {
            paginationElement.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
                    </li>
        `;
        
        // Show up to 5 page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);
        
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
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Last page link if not in range
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                </li>
            `;
        }
        
        paginationHTML += `
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
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
                    goToPageCallback(page);
                }
            });
        });
    }
}

// Export the class
window.UIManager = UIManager;
