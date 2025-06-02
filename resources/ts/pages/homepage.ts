// Homepage specific functionality
export class Homepage {
    private mobileMenuBtn: HTMLElement | null = null;
    private mobileMenu: HTMLElement | null = null;
    private backToTopBtn: HTMLElement | null = null;
    private header: HTMLElement | null = null;
    private isMenuOpen = false;

    constructor() {
        this.init();
    }

    private init(): void {
        this.setupElements();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.setupSmoothScrolling();
        this.setupBackToTop();
        this.setupHeaderScroll();
    }

    private setupElements(): void {
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.backToTopBtn = document.querySelector('.back-to-top');
        this.header = document.querySelector('.header');
    }

    private setupEventListeners(): void {
        // Mobile menu toggle
        this.mobileMenuBtn?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen &&
                !this.mobileMenu?.contains(e.target as Node) &&
                !this.mobileMenuBtn?.contains(e.target as Node)) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu when clicking on links
        this.mobileMenu?.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Back to top button
        this.backToTopBtn?.addEventListener('click', () => {
            this.scrollToTop();
        });

        // Scroll events
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Resize event
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    private toggleMobileMenu(): void {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    private openMobileMenu(): void {
        this.mobileMenu?.classList.add('active');
        this.mobileMenuBtn?.querySelector('i')?.classList.replace('fa-bars', 'fa-times');
        this.isMenuOpen = true;
        document.body.style.overflow = 'hidden';
    }

    private closeMobileMenu(): void {
        this.mobileMenu?.classList.remove('active');
        this.mobileMenuBtn?.querySelector('i')?.classList.replace('fa-times', 'fa-bars');
        this.isMenuOpen = false;
        document.body.style.overflow = '';
    }

    private setupSmoothScrolling(): void {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = (anchor as HTMLAnchorElement).getAttribute('href')?.substring(1);
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        const headerHeight = this.header?.offsetHeight || 0;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    private setupBackToTop(): void {
        // Show/hide back to top button based on scroll position
        const toggleBackToTop = () => {
            if (window.scrollY > 300) {
                this.backToTopBtn?.classList.add('visible');
            } else {
                this.backToTopBtn?.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', toggleBackToTop);
        toggleBackToTop(); // Check initial state
    }

    private scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    private setupHeaderScroll(): void {
        let lastScrollY = window.scrollY;

        const handleHeaderScroll = () => {
            const currentScrollY = window.scrollY;

            // Add scrolled class for styling
            if (currentScrollY > 50) {
                this.header?.classList.add('scrolled');
            } else {
                this.header?.classList.remove('scrolled');
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleHeaderScroll);
        handleHeaderScroll(); // Check initial state
    }

    private setupScrollAnimations(): void {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, observerOptions);

        // Observe all elements with aos class
        document.querySelectorAll('.aos').forEach(el => {
            observer.observe(el);
        });

        // Observe feature cards and lecturer cards for staggered animation
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            card.classList.add('aos');
            (card as HTMLElement).style.animationDelay = `${(index + 1) * 0.1}s`;
            observer.observe(card);
        });

        document.querySelectorAll('.lecturer-card').forEach((card, index) => {
            card.classList.add('aos');
            (card as HTMLElement).style.animationDelay = `${(index + 1) * 0.1}s`;
            observer.observe(card);
        });
    }

    private handleScroll(): void {
        // Handle scroll-based animations and effects
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        // Parallax effect for hero background
        const hero = document.querySelector('.hero') as HTMLElement;
        if (hero) {
            const parallaxSpeed = 0.5;
            hero.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
        }

        // Update progress indicators if they exist
        this.updateScrollProgress();
    }

    private updateScrollProgress(): void {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        // Update any progress bars
        const progressBars = document.querySelectorAll('.scroll-progress');
        progressBars.forEach(bar => {
            (bar as HTMLElement).style.width = `${scrollPercent}%`;
        });
    }

    private handleResize(): void {
        // Close mobile menu on resize to larger screen
        if (window.innerWidth >= 768 && this.isMenuOpen) {
            this.closeMobileMenu();
        }

        // Recalculate positions for smooth scrolling
        this.setupSmoothScrolling();
    }

    // Public methods for external use
    public showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="ml-auto text-lg opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    private getNotificationIcon(type: string): string {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type as keyof typeof icons] || icons.info;
    }

    // Method to handle CTA button clicks
    public handleCTAClick(target: string): void {
        switch (target) {
            case 'lecturers':
                const lecturersSection = document.getElementById('lecturers');
                if (lecturersSection) {
                    const headerHeight = this.header?.offsetHeight || 0;
                    window.scrollTo({
                        top: lecturersSection.offsetTop - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
                break;
            case 'about':
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    const headerHeight = this.header?.offsetHeight || 0;
                    window.scrollTo({
                        top: aboutSection.offsetTop - headerHeight - 20,
                        behavior: 'smooth'
                    });
                }
                break;
            case 'login':
                // Handle login logic here
                this.showNotification('info', 'Funkcja logowania w budowie!');
                break;
            default:
                console.warn(`Unknown CTA target: ${target}`);
        }
    }
}