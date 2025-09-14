// resources/ts/utils/BadgeRenderer.ts

export interface BadgeConfig {
    [key: string]: {
        label: string;
        className: string;
        icon?: string;
    };
}

export class BadgeRenderer {
    private static readonly DEFAULT_STATUS_CONFIG: BadgeConfig = {
        active: {
            label: 'Aktywny',
            className: 'badge bg-success',
            icon: 'bi-check-circle'
        },
        inactive: {
            label: 'Nieaktywny',
            className: 'badge bg-warning',
            icon: 'bi-pause-circle'
        },
        blocked: {
            label: 'Zablokowany',
            className: 'badge bg-danger',
            icon: 'bi-x-circle'
        },
        pending: {
            label: 'Oczekuje',
            className: 'badge bg-info',
            icon: 'bi-clock'
        },
        suspended: {
            label: 'Zawieszony',
            className: 'badge bg-secondary',
            icon: 'bi-dash-circle'
        }
    };

    private static readonly DEFAULT_VERIFICATION_CONFIG: BadgeConfig = {
        verified: {
            label: 'Zweryfikowany',
            className: 'badge bg-success',
            icon: 'bi-patch-check'
        },
        unverified: {
            label: 'Niezweryfikowany',
            className: 'badge bg-warning',
            icon: 'bi-patch-question'
        },
        rejected: {
            label: 'Odrzucony',
            className: 'badge bg-danger',
            icon: 'bi-patch-exclamation'
        }
    };

    private static readonly DEFAULT_PAYMENT_CONFIG: BadgeConfig = {
        paid: {
            label: 'Opłacone',
            className: 'badge bg-success',
            icon: 'bi-check2-circle'
        },
        pending: {
            label: 'Oczekuje',
            className: 'badge bg-warning',
            icon: 'bi-hourglass-split'
        },
        failed: {
            label: 'Nieudane',
            className: 'badge bg-danger',
            icon: 'bi-x-circle'
        },
        refunded: {
            label: 'Zwrócone',
            className: 'badge bg-info',
            icon: 'bi-arrow-counterclockwise'
        }
    };

    /**
     * Render a badge with custom configuration
     */
    static render(value: string | undefined, config: BadgeConfig, fallbackLabel: string = 'Nieznany'): string {
        if (!value || !config[value]) {
            return `<span class="badge bg-secondary">${fallbackLabel}</span>`;
        }

        const badgeConfig = config[value];
        const icon = badgeConfig.icon ? `<i class="${badgeConfig.icon} me-1"></i>` : '';
        
        return `<span class="${badgeConfig.className}">${icon}${badgeConfig.label}</span>`;
    }

    /**
     * Render status badge (active, inactive, blocked, etc.)
     */
    static status(status: string | undefined): string {
        return this.render(status, this.DEFAULT_STATUS_CONFIG, 'Nieznany status');
    }

    /**
     * Render verification badge
     */
    static verification(status: string | undefined): string {
        return this.render(status, this.DEFAULT_VERIFICATION_CONFIG, 'Nieznany');
    }

    /**
     * Render payment status badge
     */
    static payment(status: string | undefined): string {
        return this.render(status, this.DEFAULT_PAYMENT_CONFIG, 'Nieznany');
    }

    /**
     * Render boolean as yes/no badge
     */
    static boolean(value: boolean | undefined | null, trueLabel: string = 'Tak', falseLabel: string = 'Nie'): string {
        if (value === true) {
            return `<span class="badge bg-success"><i class="bi-check-circle me-1"></i>${trueLabel}</span>`;
        } else {
            return `<span class="badge bg-secondary"><i class="bi-x-circle me-1"></i>${falseLabel}</span>`;
        }
    }

    /**
     * Render priority badge (high, medium, low)
     */
    static priority(priority: string | undefined): string {
        const config: BadgeConfig = {
            high: {
                label: 'Wysoki',
                className: 'badge bg-danger',
                icon: 'bi-exclamation-triangle'
            },
            medium: {
                label: 'Średni',
                className: 'badge bg-warning'
            },
            low: {
                label: 'Niski',
                className: 'badge bg-info'
            }
        };

        return this.render(priority, config, 'Normalny');
    }

    /**
     * Render count badge
     */
    static count(count: number, singularLabel: string, pluralLabel: string, threshold: number = 0): string {
        if (count <= threshold) {
            return `<span class="badge bg-secondary">0 ${pluralLabel}</span>`;
        }

        const label = count === 1 ? singularLabel : pluralLabel;
        const className = count > 10 ? 'bg-success' : count > 5 ? 'bg-info' : 'bg-primary';
        
        return `<span class="badge ${className}">${count} ${label}</span>`;
    }

    /**
     * Render role badge
     */
    static role(role: string | undefined): string {
        const config: BadgeConfig = {
            admin: {
                label: 'Administrator',
                className: 'badge bg-primary',
                icon: 'bi-key'
            },
            tutor: {
                label: 'Lektor',
                className: 'badge bg-success',
                icon: 'bi-mortarboard'
            },
            student: {
                label: 'Student',
                className: 'badge bg-info',
                icon: 'bi-person'
            },
            moderator: {
                label: 'Moderator',
                className: 'badge bg-warning',
                icon: 'bi-shield'
            }
        };

        return this.render(role, config, 'Nieznana rola');
    }

    /**
     * Render lesson status badge
     */
    static lessonStatus(status: string | undefined): string {
        const config: BadgeConfig = {
            scheduled: {
                label: 'Zaplanowana',
                className: 'badge bg-primary',
                icon: 'bi-calendar-event'
            },
            in_progress: {
                label: 'W trakcie',
                className: 'badge bg-info',
                icon: 'bi-play-circle'
            },
            completed: {
                label: 'Zakończona',
                className: 'badge bg-success',
                icon: 'bi-check-circle'
            },
            cancelled: {
                label: 'Anulowana',
                className: 'badge bg-danger',
                icon: 'bi-x-circle'
            },
            not_started: {
                label: 'Nie rozpoczęta',
                className: 'badge bg-dark',
                icon: 'bi-pause-circle'
            },
            no_show: {
                label: 'Nieobecność',
                className: 'badge bg-warning text-dark',
                icon: 'bi-exclamation-triangle'
            },
            no_show_student: {
                label: 'Student nieobecny',
                className: 'badge bg-warning text-dark',
                icon: 'bi-person-x'
            },
            no_show_tutor: {
                label: 'Lektor nieobecny',
                className: 'badge bg-warning text-dark',
                icon: 'bi-person-slash'
            },
            technical_issues: {
                label: 'Problemy techniczne',
                className: 'badge bg-secondary',
                icon: 'bi-exclamation-diamond'
            }
        };

        return this.render(status, config, 'Nieznany status');
    }
}