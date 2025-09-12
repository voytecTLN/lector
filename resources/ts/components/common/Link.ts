// resources/ts/components/common/Link.ts
// Standardized link component for consistent navigation throughout the application

import { RouteUtils } from '@/config/routing'
import { navigate, urlBuilder, routeChecker } from '@/utils/navigation'

export interface LinkProps {
    to: string
    className?: string
    children: string
    external?: boolean
    newTab?: boolean
    download?: boolean
    title?: string
    ariaLabel?: string
    id?: string
    role?: string
    tabIndex?: number
    disabled?: boolean
    active?: boolean
    onClick?: (event: MouseEvent) => void | boolean
    dataAttributes?: Record<string, string>
}

export interface ButtonLinkProps extends Omit<LinkProps, 'to'> {
    type?: 'button' | 'submit' | 'reset'
    onClick: (event: MouseEvent) => void | boolean
}

/**
 * Link utility class for creating consistent navigation links
 */
export class Link {
    /**
     * Create a navigation link
     */
    static create(props: LinkProps): string {
        const {
            to,
            className = '',
            children,
            external = false,
            newTab = false,
            download = false,
            title,
            ariaLabel,
            id,
            role,
            tabIndex,
            disabled = false,
            active = false,
            dataAttributes = {}
        } = props

        // Determine if link is external
        const isExternal = external || RouteUtils.isExternal(to)
        
        // Build href
        let href: string
        if (isExternal) {
            href = to
        } else {
            href = urlBuilder.hash(to)
        }

        // Build classes
        const classes = [
            className,
            active || routeChecker.isCurrent(to) ? 'active' : '',
            disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ')

        // Build attributes
        const attrs = {
            href: disabled ? '#' : href,
            class: classes,
            title: title || ariaLabel,
            'aria-label': ariaLabel,
            id,
            role,
            tabindex: tabIndex?.toString(),
            target: (newTab || (isExternal && !download)) ? '_blank' : undefined,
            rel: (newTab || (isExternal && !download)) ? 'noopener noreferrer' : undefined,
            download: download ? 'true' : undefined,
            'data-navigation': !isExternal ? 'internal' : undefined,
            ...Object.fromEntries(
                Object.entries(dataAttributes).map(([key, value]) => [`data-${key}`, value])
            )
        }

        // Build attribute string
        const attrString = Object.entries(attrs)
            .filter(([_, value]) => value !== undefined && value !== '')
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ')

        return `<a ${attrString}>${children}</a>`
    }

    /**
     * Create a button that looks like a link but doesn't navigate
     */
    static createButton(props: ButtonLinkProps): string {
        const {
            className = '',
            children,
            type = 'button',
            title,
            ariaLabel,
            id,
            role,
            tabIndex,
            disabled = false,
            active = false,
            dataAttributes = {}
        } = props

        const classes = [
            className,
            'btn-link',
            active ? 'active' : '',
            disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ')

        const attrs = {
            type,
            class: classes,
            title: title || ariaLabel,
            'aria-label': ariaLabel,
            id,
            role,
            tabindex: tabIndex?.toString(),
            disabled: disabled ? 'true' : undefined,
            ...Object.fromEntries(
                Object.entries(dataAttributes).map(([key, value]) => [`data-${key}`, value])
            )
        }

        const attrString = Object.entries(attrs)
            .filter(([_, value]) => value !== undefined && value !== '')
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ')

        return `<button ${attrString}>${children}</button>`
    }

    /**
     * Create a navigation link with icon
     */
    static createWithIcon(props: LinkProps & { icon: string; iconPosition?: 'left' | 'right' }): string {
        const { icon, iconPosition = 'left', children, ...linkProps } = props
        
        const iconHtml = `<i class="${icon}" aria-hidden="true"></i>`
        const content = iconPosition === 'left' 
            ? `${iconHtml} ${children}`
            : `${children} ${iconHtml}`

        return Link.create({
            ...linkProps,
            children: content
        })
    }

    /**
     * Create a breadcrumb link
     */
    static createBreadcrumb(props: LinkProps): string {
        return Link.create({
            ...props,
            className: `breadcrumb-item ${props.className || ''}`,
            role: 'navigation'
        })
    }

    /**
     * Create a navigation menu link
     */
    static createNavLink(props: LinkProps): string {
        const isActive = routeChecker.isCurrent(props.to)
        
        return Link.create({
            ...props,
            className: `nav-link ${isActive ? 'active' : ''} ${props.className || ''}`,
            role: 'menuitem',
            ariaLabel: props.ariaLabel || props.children
        })
    }

    /**
     * Create a dropdown menu link
     */
    static createDropdownLink(props: LinkProps): string {
        return Link.create({
            ...props,
            className: `dropdown-item ${props.className || ''}`,
            role: 'menuitem'
        })
    }

    /**
     * Create a card link (entire card is clickable)
     */
    static createCardLink(props: LinkProps): string {
        return Link.create({
            ...props,
            className: `card-link ${props.className || ''}`,
            role: 'button'
        })
    }

    /**
     * Create a pagination link
     */
    static createPaginationLink(props: LinkProps & { page: number; current?: boolean }): string {
        const { page, current = false, ...linkProps } = props
        
        return Link.create({
            ...linkProps,
            className: `page-link ${current ? 'active' : ''} ${linkProps.className || ''}`,
            ariaLabel: `Go to page ${page}`,
            dataAttributes: {
                page: page.toString(),
                ...linkProps.dataAttributes
            }
        })
    }

    /**
     * Create a back link
     */
    static createBackLink(props: Omit<LinkProps, 'to' | 'onClick'> & { fallbackTo?: string }): string {
        const { fallbackTo = '/', ...linkProps } = props
        
        return Link.createButton({
            ...linkProps,
            className: `back-link ${linkProps.className || ''}`,
            onClick: (event) => {
                event.preventDefault()
                navigate.backOrFallback(fallbackTo)
            },
            children: linkProps.children || '← Back'
        })
    }

    /**
     * Create an external link with proper security attributes
     */
    static createExternal(props: LinkProps): string {
        return Link.create({
            ...props,
            external: true,
            newTab: true,
            className: `external-link ${props.className || ''}`,
            title: props.title || `${props.children} (opens in new tab)`
        })
    }

    /**
     * Create a download link
     */
    static createDownload(props: LinkProps & { filename?: string }): string {
        const { filename, ...linkProps } = props
        
        return Link.create({
            ...linkProps,
            download: true,
            className: `download-link ${linkProps.className || ''}`,
            title: props.title || `Download ${filename || 'file'}`,
            dataAttributes: {
                filename: filename || 'file',
                ...linkProps.dataAttributes
            }
        })
    }
}

/**
 * Template literals for common link patterns
 */
export const LinkTemplates = {
    /**
     * Admin dashboard navigation
     */
    adminNav: (section: string, label: string, icon?: string) => Link.createNavLink({
        to: urlBuilder.dashboard('admin', section),
        children: icon ? `<span class="nav-icon">${icon}</span> ${label}` : label,
        className: 'admin-nav-link',
        dataAttributes: { section }
    }),

    /**
     * Student dashboard navigation
     */
    studentNav: (section: string, label: string, icon?: string) => Link.createNavLink({
        to: urlBuilder.dashboard('student', section),
        children: icon ? `<span class="nav-icon">${icon}</span> ${label}` : label,
        className: 'student-nav-link',
        dataAttributes: { section }
    }),

    /**
     * Action button link
     */
    actionButton: (to: string, label: string, variant: 'primary' | 'secondary' | 'danger' = 'primary') => Link.create({
        to,
        children: label,
        className: `btn btn-${variant} action-btn`,
        role: 'button'
    }),

    /**
     * Student management links
     */
    studentAction: {
        list: () => Link.create({
            to: urlBuilder.adminStudent.list(),
            children: 'Lista studentów',
            className: 'btn btn-outline-primary'
        }),
        
        add: () => Link.create({
            to: urlBuilder.adminStudent.add(),
            children: '<i class="bi bi-plus-circle me-1"></i> Dodaj studenta',
            className: 'btn btn-primary'
        }),

        show: (id: string | number, name?: string) => Link.create({
            to: urlBuilder.adminStudent.show(id),
            children: name ? `Profil: ${name}` : 'Zobacz profil',
            className: 'btn btn-outline-secondary'
        }),

        edit: (id: string | number, name?: string) => Link.create({
            to: urlBuilder.adminStudent.edit(id),
            children: '<i class="bi bi-pencil me-1"></i> Edytuj',
            className: 'btn btn-primary'
        })
    },

    /**
     * Breadcrumb navigation
     */
    breadcrumb: (items: Array<{ to?: string; label: string }>) => {
        return items.map((item, index) => {
            const isLast = index === items.length - 1
            
            if (isLast || !item.to) {
                return `<li class="breadcrumb-item active" aria-current="page">${item.label}</li>`
            }
            
            return `<li class="breadcrumb-item">${Link.create({
                to: item.to,
                children: item.label
            })}</li>`
        }).join('')
    }
}

/**
 * Link event handler utilities
 */
export const LinkHandlers = {
    /**
     * Handle navigation with confirmation
     */
    withConfirmation: (to: string, message: string) => (event: MouseEvent) => {
        event.preventDefault()
        if (confirm(message)) {
            navigate.to(to)
        }
    },

    /**
     * Handle navigation with loading state
     */
    withLoading: (to: string, loadingText: string = 'Loading...') => (event: MouseEvent) => {
        event.preventDefault()
        const target = event.target as HTMLElement
        const originalText = target.textContent
        
        target.textContent = loadingText
        target.classList.add('loading')
        
        navigate.to(to).finally(() => {
            target.textContent = originalText
            target.classList.remove('loading')
        })
    },

    /**
     * Handle external navigation with tracking
     */
    withTracking: (url: string, eventName: string) => (event: MouseEvent) => {
        // Add your analytics tracking here
        navigate.external(url, true)
    }
}

// Export convenience functions
export const link = Link.create
export const navLink = Link.createNavLink
export const backLink = Link.createBackLink
export const externalLink = Link.createExternal