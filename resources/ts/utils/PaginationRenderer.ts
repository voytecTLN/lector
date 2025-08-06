// resources/ts/utils/PaginationRenderer.ts

export interface PaginatedResponse<T> {
    data: T;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
}

export interface PaginationOptions {
    entityName: string; // e.g., "studentów", "lektorów", "administratorów"
    onPageChange?: (page: number) => void;
    showInfo?: boolean;
    showNumbers?: boolean;
    maxVisiblePages?: number;
}

export class PaginationRenderer {
    private options: Required<PaginationOptions>;

    constructor(options: PaginationOptions) {
        this.options = {
            onPageChange: () => {},
            showInfo: true,
            showNumbers: true,
            maxVisiblePages: 5,
            ...options
        };
    }

    /**
     * Render pagination info (e.g., "Wyświetlanie 1-10 z 50 studentów")
     */
    public renderInfo<T>(response: PaginatedResponse<T>): string {
        if (!this.options.showInfo) return '';

        const start = ((response.current_page - 1) * response.per_page) + 1;
        const end = Math.min(start + response.per_page - 1, response.total);

        return `Wyświetlanie ${start}-${end} z ${response.total} ${this.options.entityName}`;
    }

    /**
     * Render pagination controls
     */
    public renderControls<T>(response: PaginatedResponse<T>): string {
        if (!this.options.showNumbers || response.last_page <= 1) {
            return '';
        }

        const currentPage = response.current_page;
        const lastPage = response.last_page;
        const maxVisible = this.options.maxVisiblePages;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(lastPage, startPage + maxVisible - 1);

        // Adjust start if we're near the end
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        let html = '<ul class="pagination justify-content-center">';

        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                    <i class="bi bi-chevron-left"></i>
                </button>
            </li>
        `;

        // First page (if not in range)
        if (startPage > 1) {
            html += `
                <li class="page-item">
                    <button class="page-link" data-page="1">1</button>
                </li>
            `;
            if (startPage > 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" data-page="${i}">${i}</button>
                </li>
            `;
        }

        // Last page (if not in range)
        if (endPage < lastPage) {
            if (endPage < lastPage - 1) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            html += `
                <li class="page-item">
                    <button class="page-link" data-page="${lastPage}">${lastPage}</button>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="page-item ${currentPage === lastPage ? 'disabled' : ''}">
                <button class="page-link" ${currentPage === lastPage ? 'disabled' : ''} data-page="${currentPage + 1}">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </li>
        `;

        html += '</ul>';

        return html;
    }

    /**
     * Attach event listeners to pagination controls
     */
    public attachEventListeners(container: HTMLElement): void {
        const paginationButtons = container.querySelectorAll('.pagination .page-link[data-page]:not([disabled])');
        
        paginationButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt((e.target as HTMLElement).getAttribute('data-page') || '1');
                this.options.onPageChange(page);
            });
        });
    }

    /**
     * Complete pagination render with both info and controls
     */
    public render<T>(response: PaginatedResponse<T>): { info: string; controls: string } {
        return {
            info: this.renderInfo(response),
            controls: this.renderControls(response)
        };
    }

    /**
     * Render and inject into DOM elements
     */
    public renderToDom<T>(response: PaginatedResponse<T>, infoContainer?: HTMLElement | null, controlsContainer?: HTMLElement | null): void {
        if (infoContainer) {
            infoContainer.innerHTML = this.renderInfo(response);
        }

        if (controlsContainer) {
            controlsContainer.innerHTML = this.renderControls(response);
            this.attachEventListeners(controlsContainer);
        }
    }

    /**
     * Static method for quick pagination rendering
     */
    static renderQuick<T>(response: PaginatedResponse<T>, entityName: string, onPageChange: (page: number) => void): { info: string; controls: string } {
        const renderer = new PaginationRenderer({
            entityName,
            onPageChange
        });

        return renderer.render(response);
    }
}