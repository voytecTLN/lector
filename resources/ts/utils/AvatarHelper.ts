// resources/ts/utils/AvatarHelper.ts

export class AvatarHelper {
    /**
     * Generate avatar HTML with fallback to initials
     */
    static render(options: {
        name?: string
        avatar?: string
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
        className?: string
        userId?: number
    }): string {
        const { name = '', avatar, size = 'md', className = '', userId } = options
        
        const sizes = {
            xs: 24,  // For inline mentions
            sm: 32,  // For navigation bar
            md: 40,  // For lists
            lg: 80,  // For dashboard sidebar
            xl: 150  // For profile edit
        }
        
        const sizeInPx = sizes[size]
        const fontSize = Math.floor(sizeInPx * 0.4)
        
        // Generate color based on userId or name
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#6C5CE7', '#FD79A8', '#A29BFE', '#FF9FF3', '#54A0FF'
        ]
        
        const seed = userId || name.charCodeAt(0) || 0
        const backgroundColor = colors[seed % colors.length]
        
        const commonStyles = `
            width: ${sizeInPx}px; 
            height: ${sizeInPx}px; 
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `.trim()
        
        if (avatar) {
            return `
                <img 
                    src="/storage/avatars/${avatar}" 
                    alt="${name}" 
                    class="avatar avatar-${size} ${className}"
                    style="${commonStyles} object-fit: cover;"
                    onerror="this.onerror=null; this.outerHTML=AvatarHelper.renderInitials('${name}', '${size}', ${userId})"
                    loading="lazy"
                />
            `.trim()
        }
        
        return this.renderInitials(name, size, userId)
    }
    
    /**
     * Render initials avatar
     */
    static renderInitials(name: string, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md', userId?: number): string {
        const sizes = {
            xs: 24,
            sm: 32,
            md: 40,
            lg: 80,
            xl: 150
        }
        
        const sizeInPx = sizes[size]
        const fontSize = Math.floor(sizeInPx * 0.4)
        
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#6C5CE7', '#FD79A8', '#A29BFE', '#FF9FF3', '#54A0FF'
        ]
        
        const seed = userId || name.charCodeAt(0) || 0
        const backgroundColor = colors[seed % colors.length]
        
        const initials = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
        
        return `
            <div 
                class="avatar avatar-initials avatar-${size}"
                style="
                    width: ${sizeInPx}px; 
                    height: ${sizeInPx}px; 
                    background: ${backgroundColor};
                    color: white;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: ${fontSize}px;
                    flex-shrink: 0;
                "
            >${initials || '?'}</div>
        `.trim()
    }
    
    /**
     * Create avatar with wrapper for lists
     */
    static withWrapper(user: { name?: string, avatar?: string, id?: number }, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): string {
        return `
            <div class="avatar-wrapper d-inline-flex align-items-center">
                ${this.render({ 
                    name: user.name, 
                    avatar: user.avatar, 
                    size, 
                    userId: user.id 
                })}
            </div>
        `.trim()
    }
}

// Export to window for onerror fallback
if (typeof window !== 'undefined') {
    (window as any).AvatarHelper = AvatarHelper
}