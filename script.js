class DevCarousel {
    constructor() {
        this.members = [];
        this.currentIndex = 0;
        this.carouselContainer = null;
        this.autoPlayInterval = null;
        this.isAnimating = false;
        this.init();
    }

    async init() {
        try {
            await this.loadMembers();
            this.setupCarousel();
            this.startAutoPlay();
        } catch (error) {
            console.error('Error initializing carousel:', error);
            this.showError();
        }
    }

    async loadMembers() {
        try {
            const response = await fetch('members.json');
            const members = await response.json();

            this.members = await Promise.all(
                members.map(async (profile, i) => {
                    let updatedProfile = { ...profile };
                    
                    if (profile.uid) {
                        try {
                            const apiResponse = await fetch(`https://avatar-cyan.vercel.app/api/${profile.uid}`);
                            const apiData = await apiResponse.json();

                            updatedProfile = {
                                name: apiData.display_name || apiData.username || profile.name,
                                description: profile.description || `Discord User • ${apiData.username}#${apiData.discriminator}`,
                                image: apiData.avatarUrl || profile.image,
                                socials: profile.socials || {},
                                isPlaceholder: false,
                                index: i
                            };
                        } catch (apiError) {
                            console.error(`Error fetching API data for UID ${profile.uid}:`, apiError);
                            updatedProfile.isPlaceholder = false;
                            updatedProfile.index = i;
                        }
                    } else {
                        updatedProfile.index = i;
                    }
                    
                    return updatedProfile;
                })
            );
        } catch (error) {
            console.error('Error loading members:', error);
            throw error;
        }
    }

    setupCarousel() {
        const carouselDiv = document.querySelector('.devCarousel');
        if (!carouselDiv) {
            console.error('Carousel container not found');
            return;
        }

        carouselDiv.innerHTML = '';

        this.carouselContainer = document.createElement('div');
        this.carouselContainer.className = 'carousel-container';

        this.members.forEach((member, index) => {
            const card = this.createCard(member, index);
            this.carouselContainer.appendChild(card);
        });

        this.createNavigation();
        
        carouselDiv.appendChild(this.carouselContainer);

        setTimeout(() => {
            this.showCard(0);
        }, 100);
    }

    createCard(member, index) {
        const card = document.createElement('div');
        card.className = 'dev-card';
        card.dataset.index = index;

        const socialsHtml = Object.entries(member.socials || {})
            .map(([platform, url]) => {
                const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
                return `<a href="${url}" class="social-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">${platformName}</a>`;
            }).join('');

        card.innerHTML = `
            <div class="dev-avatar">
                <img src="${member.image}" alt="${member.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f0f0f0%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2240%22>👤</text></svg>'">
            </div>
            <div class="dev-name">${member.name}</div>
            <div class="dev-description">${member.description}</div>
            <div class="dev-socials">${socialsHtml}</div>
        `;

        return card;
    }

    createNavigation() {
        const prevArrow = document.createElement('div');
        prevArrow.className = 'carousel-arrows prev-arrow';
        prevArrow.innerHTML = '‹';
        prevArrow.style.cssText = 'cursor: pointer; user-select: none; z-index: 1000;';
        
        const nextArrow = document.createElement('div');
        nextArrow.className = 'carousel-arrows next-arrow';
        nextArrow.innerHTML = '›';
        nextArrow.style.cssText = 'cursor: pointer; user-select: none; z-index: 1000;';

        const navContainer = document.createElement('div');
        navContainer.className = 'carousel-nav';
        navContainer.style.cssText = 'z-index: 1000;';

        this.members.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'nav-dot';
            if (index === 0) dot.classList.add('active');
            dot.style.cssText = 'cursor: pointer; user-select: none;';
            dot.dataset.index = index;
            navContainer.appendChild(dot);
        });

        const boundPrevSlide = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Previous clicked');
            this.prevSlide();
        };

        const boundNextSlide = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next clicked');
            this.nextSlide();
        };

        const boundDotClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            console.log('Dot clicked:', index);
            if (!isNaN(index)) {
                this.goToSlide(index);
            }
        };

        prevArrow.removeEventListener('click', boundPrevSlide);
        nextArrow.removeEventListener('click', boundNextSlide);
        
        prevArrow.addEventListener('click', boundPrevSlide);
        nextArrow.addEventListener('click', boundNextSlide);
        
        navContainer.addEventListener('click', boundDotClick);

        prevArrow.addEventListener('touchend', boundPrevSlide);
        nextArrow.addEventListener('touchend', boundNextSlide);
        navContainer.addEventListener('touchend', boundDotClick);

        this.carouselContainer.appendChild(prevArrow);
        this.carouselContainer.appendChild(nextArrow);
        this.carouselContainer.appendChild(navContainer);

        this.prevArrow = prevArrow;
        this.nextArrow = nextArrow;
        this.navContainer = navContainer;
    }

    showCard(index) {
        if (this.isAnimating || !this.carouselContainer) return;
        
        if (index < 0 || index >= this.members.length) return;
        
        this.isAnimating = true;
        console.log(`Showing card ${index}`);

        const cards = this.carouselContainer.querySelectorAll('.dev-card');
        const dots = this.carouselContainer.querySelectorAll('.nav-dot');

        cards.forEach((card, i) => {
            card.classList.remove('active');
            if (i !== index) {
                card.style.opacity = '0';
                card.style.transform = 'translateX(100px)';
            }
        });

        const targetCard = cards[index];
        if (targetCard) {
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(targetCard, 
                    { x: 100, opacity: 0 },
                    { 
                        x: 0, 
                        opacity: 1, 
                        duration: 0.6, 
                        ease: "power2.out",
                        onStart: () => {
                            targetCard.classList.add('active');
                        },
                        onComplete: () => {
                            this.isAnimating = false;
                        }
                    }
                );
            } else {
                targetCard.style.opacity = '0';
                targetCard.style.transform = 'translateX(100px)';
                targetCard.classList.add('active');
                
                targetCard.offsetHeight;
                
                targetCard.style.transition = 'all 0.6s ease';
                targetCard.style.opacity = '1';
                targetCard.style.transform = 'translateX(0)';
                
                setTimeout(() => {
                    this.isAnimating = false;
                }, 600);
            }
        } else {
            this.isAnimating = false;
        }

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        this.currentIndex = index;
    }

    nextSlide() {
        if (this.isAnimating || this.members.length === 0) return;
        
        const nextIndex = (this.currentIndex + 1) % this.members.length;
        console.log(`Next slide: ${this.currentIndex} -> ${nextIndex}`);
        this.goToSlide(nextIndex);
    }

    prevSlide() {
        if (this.isAnimating || this.members.length === 0) return;
        
        const prevIndex = (this.currentIndex - 1 + this.members.length) % this.members.length;
        console.log(`Prev slide: ${this.currentIndex} -> ${prevIndex}`);
        this.goToSlide(prevIndex);
    }

    goToSlide(index) {
        if (index === this.currentIndex || this.isAnimating) return;
        
        console.log(`Going to slide ${index}`);
        this.showCard(index);
        this.resetAutoPlay();
    }

    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            if (!this.isAnimating && this.members.length > 1) {
                this.nextSlide();
            }
        }, 4000);
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    showError() {
        const carouselDiv = document.querySelector('.devCarousel');
        if (carouselDiv) {
            carouselDiv.innerHTML = '<div class="loading">Error loading team members</div>';
        }
    }

    destroy() {
        this.stopAutoPlay();
        if (this.carouselContainer) {
            this.carouselContainer.innerHTML = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing carousel...');
    window.devCarousel = new DevCarousel();
});

document.addEventListener('keydown', (e) => {
    if (window.devCarousel && !window.devCarousel.isAnimating) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            window.devCarousel.prevSlide();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            window.devCarousel.nextSlide();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const carouselDiv = document.querySelector('.devCarousel');
        if (carouselDiv && window.devCarousel) {
            carouselDiv.addEventListener('mouseenter', () => {
                console.log('Mouse enter - stopping autoplay');
                window.devCarousel.stopAutoPlay();
            });
            
            carouselDiv.addEventListener('mouseleave', () => {
                console.log('Mouse leave - starting autoplay');
                window.devCarousel.startAutoPlay();
            });
        }
    }, 500);
});



// Dynamic stylesheet switcher with transitions and flickering effects
class GameStyleSwitcher {
    constructor() {
        this.currentStylesheet = 'style.css';
        this.stylesheetLink = null;
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        // Create or find the main stylesheet link
        this.stylesheetLink = document.querySelector('link[rel="stylesheet"]') || this.createStylesheetLink();
        
        // Add event listeners
        this.addEventListeners();
        
        // Add transition overlay to body
        this.createTransitionOverlay();
        
        // Create hover text elements
        this.createHoverTexts();
    }
    
    createStylesheetLink() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.currentStylesheet;
        document.head.appendChild(link);
        return link;
    }
    
    createTransitionOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
    }
    
    createHoverTexts() {
        // Create hover text for overheat game
        const overheatElement = document.getElementById('overheat');
        if (overheatElement) {
            const hoverText = document.createElement('div');
            hoverText.id = 'overheat-hover-text';
            hoverText.textContent = 'Visit the website';
            hoverText.style.cssText = `
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 1000;
            `;
            
            // Make sure parent has relative positioning
            if (getComputedStyle(overheatElement).position === 'static') {
                overheatElement.style.position = 'relative';
            }
            
            overheatElement.appendChild(hoverText);
        }
        
        // Create hover text for UFG game
        const ufgElement = document.getElementById('ufg');
        if (ufgElement) {
            const hoverText = document.createElement('div');
            hoverText.id = 'ufg-hover-text';
            hoverText.textContent = 'Visit the website';
            hoverText.style.cssText = `
                position: absolute;
                bottom: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 1000;
            `;
            
            // Make sure parent has relative positioning
            if (getComputedStyle(ufgElement).position === 'static') {
                ufgElement.style.position = 'relative';
            }
            
            ufgElement.appendChild(hoverText);
        }
    }
    
    showHoverText(elementId) {
        const hoverText = document.getElementById(elementId + '-hover-text');
        if (hoverText) {
            hoverText.style.opacity = '1';
        }
    }
    
    hideHoverText(elementId) {
        const hoverText = document.getElementById(elementId + '-hover-text');
        if (hoverText) {
            hoverText.style.opacity = '0';
        }
    }
    
    addEventListeners() {
        // Overheat game listener
        const overheatElement = document.getElementById('overheat');
        if (overheatElement) {
            overheatElement.addEventListener('mouseenter', () => {
                this.switchStylesheet('overheat.css', 'OVERHEAT');
                this.showHoverText('overheat');
            });
            
            overheatElement.addEventListener('mouseleave', () => {
                this.hideHoverText('overheat');
            });
        }
        
        // UFG game listener
        const ufgElement = document.getElementById('ufg');
        if (ufgElement) {
            ufgElement.addEventListener('mouseenter', () => {
                this.switchStylesheet('ufg.css', 'UFG');
                this.showHoverText('ufg');
            });
            
            ufgElement.addEventListener('mouseleave', () => {
                this.hideHoverText('ufg');
            });
        }
        
        // Return to default when leaving games area
        const gamesContainer = document.querySelector('.games');
        if (gamesContainer) {
            gamesContainer.addEventListener('mouseleave', () => {
                if (this.currentStylesheet !== 'style.css') {
                    this.switchStylesheet('style.css', 'DEFAULT');
                }
                // Hide all hover texts when leaving games area
                this.hideHoverText('overheat');
                this.hideHoverText('ufg');
            });
        }
        
        // ESC key to return to default
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentStylesheet !== 'style.css') {
                this.switchStylesheet('style.css', 'DEFAULT');
                // Hide all hover texts when pressing ESC
                this.hideHoverText('overheat');
                this.hideHoverText('ufg');
            }
        });
    }
    
    async switchStylesheet(newStylesheet, gameName) {
        if (this.isTransitioning || this.currentStylesheet === newStylesheet) return;
        
        this.isTransitioning = true;
        console.log(`Switching to ${gameName} theme...`);
        
        // Start transition effects
        await this.startTransition();
        
        // Switch stylesheet
        this.stylesheetLink.href = newStylesheet;
        this.currentStylesheet = newStylesheet;
        
        // Wait for stylesheet to load
        await this.waitForStylesheetLoad();
        
        // End transition effects
        await this.endTransition();
        
        this.isTransitioning = false;
        console.log(`${gameName} theme loaded!`);
    }
    
    startTransition() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('transition-overlay');
            const body = document.body;
            
            // Show overlay
            overlay.style.opacity = '0.8';
            
            // Add flickering effect to body
            body.style.animation = 'flicker 0.5s ease-in-out';
            
            // Add CSS for flickering if not exists
            if (!document.getElementById('flicker-styles')) {
                const style = document.createElement('style');
                style.id = 'flicker-styles';
                style.textContent = `
                    @keyframes flicker {
                        0%, 100% { opacity: 1; filter: brightness(1); }
                        10% { opacity: 0.8; filter: brightness(0.7); }
                        20% { opacity: 1; filter: brightness(1.2); }
                        30% { opacity: 0.6; filter: brightness(0.5); }
                        40% { opacity: 1; filter: brightness(1); }
                        50% { opacity: 0.9; filter: brightness(0.8); }
                        60% { opacity: 1; filter: brightness(1.1); }
                        70% { opacity: 0.7; filter: brightness(0.6); }
                        80% { opacity: 1; filter: brightness(1); }
                        90% { opacity: 0.85; filter: brightness(0.9); }
                    }
                    
                    @keyframes glitch {
                        0% { transform: translateX(0); }
                        10% { transform: translateX(-2px) skew(-1deg); }
                        20% { transform: translateX(2px) skew(1deg); }
                        30% { transform: translateX(-1px) skew(-0.5deg); }
                        40% { transform: translateX(1px) skew(0.5deg); }
                        50% { transform: translateX(0); }
                        60% { transform: translateX(-1px) skew(-0.3deg); }
                        70% { transform: translateX(1px) skew(0.3deg); }
                        80% { transform: translateX(0); }
                        90% { transform: translateX(-0.5px); }
                        100% { transform: translateX(0); }
                    }
                    
                    .switching {
                        animation: glitch 0.6s ease-in-out !important;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Add glitch effect to game elements
            document.querySelectorAll('.game1, .game2').forEach(el => {
                el.classList.add('switching');
            });
            
            setTimeout(resolve, 500);
        });
    }
    
    waitForStylesheetLoad() {
        return new Promise((resolve) => {
            const link = this.stylesheetLink;
            
            if (link.sheet) {
                // Stylesheet already loaded
                setTimeout(resolve, 100);
                return;
            }
            
            const onLoad = () => {
                link.removeEventListener('load', onLoad);
                setTimeout(resolve, 100);
            };
            
            link.addEventListener('load', onLoad);
            
            // Fallback timeout
            setTimeout(resolve, 1000);
        });
    }
    
    endTransition() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('transition-overlay');
            const body = document.body;
            
            // Remove effects
            body.style.animation = '';
            document.querySelectorAll('.game1, .game2').forEach(el => {
                el.classList.remove('switching');
            });
            
            // Fade out overlay
            overlay.style.opacity = '0';
            
            setTimeout(resolve, 300);
        });
    }
    
    // Utility method to get current theme
    getCurrentTheme() {
        return this.currentStylesheet.replace('.css', '').toUpperCase();
    }
    
    // Method to preload stylesheets for smoother transitions
    preloadStylesheets() {
        const stylesheets = ['overheat.css', 'ufg.css', 'style.css'];
        
        stylesheets.forEach(stylesheet => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = stylesheet;
            document.head.appendChild(link);
        });
    }
}

// Initialize the switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const switcher = new GameStyleSwitcher();
    
    // Optional: Preload stylesheets for better performance
    switcher.preloadStylesheets();
    
    // Make switcher globally available if needed
    window.gameStyleSwitcher = switcher;
    
    console.log('Game Style Switcher initialized!');
    console.log('Hover over games to see "Visit the website" text and switch themes');
    console.log('ESC or leave games area to return to default');
});


async function sendEmail(formData) {
  try {
    const response = await fetch('/api/send-mail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Email sent successfully:', result);
      return { success: true, data: result };
    } else {
      console.error('Error sending email:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error' };
  }
}


async function test() {
    const testData = {
    name: "John Doe",
    email: "sreyam.bhattacharjee@gmail.com",
    subject: "Test Message",
    message: "This is a test message from the contact form."
};

    const result = await sendEmail(testData);
    console.log(result);
}
//test();

// Auto-grow textarea
document.querySelectorAll('.bubble-input.textarea').forEach(textarea => {
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        this.style.bottom = (this.scrollHeight) + 'px';
        const form = this.closest('.form');
        if (form) {
            const rect = this.getBoundingClientRect();
            if (rect.bottom > window.innerHeight) {
                form.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const steps = [
        { id: 'name-input', next: 'email' },
        { id: 'email-input', next: 'subject', validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) },
        { id: 'subject-input', next: 'message' },
        { id: 'message-input', next: 'send-btn' }
    ];

    function showStep(step) {
        const bubble = document.querySelector(`.bubble[data-step="${step}"]`);
        if (bubble) {
            bubble.style.display = '';
            setTimeout(() => bubble.classList.add('visible'), 10);
            const input = bubble.querySelector('input,textarea');
            if (input) input.focus();
            const form = bubble.closest('.form');
            if (form) form.scrollTop = form.scrollHeight;
        }
        if (step === 'send-btn' || step === 'message') {
            document.getElementById('send-btn').style.display = '';
        }
    }

    steps.forEach((stepObj, idx) => {
        const input = document.getElementById(stepObj.id);
        if (!input) return;
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && stepObj.id !== 'message-input') {
                e.preventDefault();
                const value = this.value.trim();
                if (stepObj.id === 'email-input' && stepObj.validate && !stepObj.validate(value)) {
                    this.style.borderBottomColor = "#e53935";
                    this.setCustomValidity("Please enter a valid email.");
                    this.reportValidity();
                    return;
                }
                this.style.borderBottomColor = "#bbb";
                showStep(stepObj.next);
            }
        });
        if (stepObj.id === 'email-input') {
            input.addEventListener('input', function() {
                const valid = steps[1].validate(this.value.trim());
                this.style.borderBottomColor = valid ? "#4caf50" : "#e53935";
            });
        }
    });

    document.getElementById('send-btn').addEventListener('click', async function() {
        const name = document.getElementById('name-input').value.trim();
        const email = document.getElementById('email-input').value.trim();
        const subject = document.getElementById('subject-input').value.trim();
        const message = document.getElementById('message-input').value.trim();
        if (!name || !email || !subject || !message) {
            alert("Please fill out all fields.");
            return;
        }
        if (!steps[1].validate(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        const result = await sendEmail({ name, email, subject, message });
        if (result.success) {
            alert("Message sent successfully!");
        } else {
            alert("Failed to send message: " + (result.error || "Unknown error"));
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle-form-type');
    const funForm = document.querySelector('.form');
    const normalForm = document.getElementById('normal-form');
    let funMode = true;

    toggle.addEventListener('click', () => {
        funMode = !funMode;
        if (funMode) {
            funForm.style.display = '';
            normalForm.style.display = 'none';
            toggle.textContent = "I want a normal form";
        } else {
            funForm.style.display = 'none';
            normalForm.style.display = '';
            toggle.textContent = "I want the fun form :[";
        }
    });
});

document.getElementById('normal-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('normal-name').value.trim();
    const email = document.getElementById('normal-email').value.trim();
    const subject = document.getElementById('normal-subject').value.trim();
    const message = document.getElementById('normal-message').value.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !subject || !message) {
        alert("Please fill out all fields.");
        return;
    }
    if (!emailValid) {
        alert("Please enter a valid email address.");
        return;
    }
    const result = await sendEmail({ name, email, subject, message });
    if (result.success) {
        alert("Message sent successfully!");
        this.reset();
    } else {
        alert("Failed to send message: " + (result.error || "Unknown error"));
    }
});



