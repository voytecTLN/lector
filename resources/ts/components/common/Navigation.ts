export class Navigation {
    render(): HTMLElement {
        const header = document.createElement('header')
        header.innerHTML = `
            <nav class="navbar">
                <div class="logo">Platforma Lektorów</div>
                <ul class="nav-links">
                    <li><a href="/">Start</a></li>
                    <li><a href="/#lecturers">Lektorzy</a></li>
                    <li><a href="/#about">O nas</a></li>
                    <li><a href="/#contact">Kontakt</a></li>
                </ul>
                <a href="/login" class="login-btn">Zaloguj się</a>
            </nav>
        `
        return header
    }
}
