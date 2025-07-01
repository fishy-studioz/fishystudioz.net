const container = document.getElementById('lnc');
const segments = [];

function createBorderLines() {
    const margin = 40;
    
    // Top horizontal line
    const topLine = document.createElement('div');
    topLine.className = 'line horizontal';
    topLine.style.top = margin + 'px';
    topLine.style.left = margin + 'px';
    topLine.style.width = `calc(100% - ${margin * 2}px)`;
    container.appendChild(topLine);
    
    // Bottom horizontal line
    const bottomLine = document.createElement('div');
    bottomLine.className = 'line horizontal';
    bottomLine.style.bottom = margin + 'px';
    bottomLine.style.left = margin + 'px';
    bottomLine.style.width = `calc(100% - ${margin * 2}px)`;
    container.appendChild(bottomLine);
    
    // Left vertical line
    const leftLine = document.createElement('div');
    leftLine.className = 'line vertical';
    leftLine.style.left = margin + 'px';
    leftLine.style.top = margin + 'px';
    leftLine.style.height = `calc(100% - ${margin * 2}px)`;
    container.appendChild(leftLine);
    
    // Right vertical line
    const rightLine = document.createElement('div');
    rightLine.className = 'line vertical';
    rightLine.style.right = margin + 'px';
    rightLine.style.top = margin + 'px';
    rightLine.style.height = `calc(100% - ${margin * 2}px)`;
    container.appendChild(rightLine);
    
    return { topLine, bottomLine, leftLine, rightLine, margin };
}

function createCornerDots(margin) {
    const positions = [
        { top: margin - 4 + 'px', left: margin - 4 + 'px' },
        { top: margin - 4 + 'px', right: margin - 4 + 'px' },
        { bottom: margin - 4 + 'px', left: margin - 4 + 'px' },
        { bottom: margin - 4 + 'px', right: margin - 4 + 'px' }
    ];
    
    positions.forEach(pos => {
        const dot = document.createElement('div');
        dot.className = 'cdtmsr';
        Object.assign(dot.style, pos);
        container.appendChild(dot);
    });
}

function createMeasurements(margin) {
    const measurements = [
        { text: '88.2', top: margin - 25 + 'px', left: '50%', transform: 'translateX(-50%)' },
        { text: '88.2', bottom: margin - 25 + 'px', left: '50%', transform: 'translateX(-50%)' },
        { text: '134.22', left: margin - 35 + 'px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' },
        { text: '134.22', right: margin - 35 + 'px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }
    ];
    
    measurements.forEach(m => {
        const elem = document.createElement('div');
        elem.className = 'msr';
        elem.textContent = m.text;
        Object.assign(elem.style, m);
        container.appendChild(elem);
    });
}

function createThickSegments(lines) {
    const { topLine, bottomLine, leftLine, rightLine, margin } = lines;
    
    // Create segments for each line
    const segmentConfigs = [
        { line: topLine, type: 'horizontal', parent: topLine },
        { line: bottomLine, type: 'horizontal', parent: bottomLine },
        { line: leftLine, type: 'vertical', parent: leftLine },
        { line: rightLine, type: 'vertical', parent: rightLine }
    ];
    
    segmentConfigs.forEach((config, index) => {
        // Create 2-3 segments per line
        const numSegments = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < numSegments; i++) {
            const segment = document.createElement('div');
            segment.className = `thick-segment ${config.type}`;
            
            // Randomize shape - rectangle or square
            const isSquare = Math.random() > 0.5;
            const hasText = Math.random() > 0.6; // 40% chance to have text
            
            if (config.type === 'horizontal') {
                const width = isSquare ? 24 : Math.random() * 40 + 30; // 30-70px for rectangles, 24px for squares
                segment.style.width = width + 'px';
                segment.style.height = '24px';
                
                const maxDistance = window.innerWidth - margin * 2 - width;
                const initialPos = Math.random() * maxDistance;
                gsap.set(segment, { left: initialPos });
                
                segments.push({ 
                    element: segment, 
                    type: config.type, 
                    lineIndex: index,
                    maxDistance: maxDistance,
                    hasText: hasText,
                    width: width,
                    isAnimating: false // Track animation state
                });
            } else {
                const height = isSquare ? 24 : Math.random() * 40 + 30; // 30-70px for rectangles, 24px for squares
                segment.style.height = height + 'px';
                segment.style.width = '24px';
                
                const maxDistance = window.innerHeight - margin * 2 - height;
                const initialPos = Math.random() * maxDistance;
                gsap.set(segment, { top: initialPos });
                
                segments.push({ 
                    element: segment, 
                    type: config.type, 
                    lineIndex: index,
                    maxDistance: maxDistance,
                    hasText: hasText,
                    height: height,
                    isAnimating: false // Track animation state
                });
            }
            
            config.parent.appendChild(segment);
        }
    });
}

function animateSegments() {
    segments.forEach((segment, index) => {
        function createAnimation() {
            // Don't start new animation if already animating
            if (segment.isAnimating) {
                return;
            }
            
            const isHorizontal = segment.type === 'horizontal';
            const maxDistance = segment.maxDistance;
            
            // Random speed between slow and medium
            let baseDuration = Math.random() * 3 + 2; // 2-5 seconds
            
            // Occasionally make it very fast
            if (Math.random() < 0.025) { // 2.5% chance
                baseDuration = Math.random() * 0.5 + 0.3; // 0.3-0.8 seconds
            }
            
            const direction = Math.random() > 0.5 ? 1 : -1;
            const currentPos = isHorizontal ? 
                gsap.getProperty(segment.element, "left") : 
                gsap.getProperty(segment.element, "top");
            
            let targetPos;
            if (direction > 0) {
                targetPos = Math.min(currentPos + Math.random() * 200 + 100, maxDistance);
            } else {
                targetPos = Math.max(currentPos - Math.random() * 200 - 100, 0);
            }
            
            const property = isHorizontal ? "left" : "top";
            
            // Mark as animating
            segment.isAnimating = true;
            
            gsap.to(segment.element, {
                [property]: targetPos,
                duration: baseDuration,
                ease: "power2.inOut",
                onUpdate: () => {
                    if (segment.hasText) {
                        const currentPos = gsap.getProperty(segment.element, property);
                        const percentage = Math.round((currentPos / maxDistance) * 100);
                        segment.element.textContent = percentage ;
                    }
                },
                onComplete: () => {
                    // Mark as not animating
                    segment.isAnimating = false;
                    
                    // Add random delay before next animation
                    gsap.delayedCall(Math.random() * 1 + 0.5, createAnimation);
                }
            });
        }
        
        // Set initial text if needed
        if (segment.hasText) {
            const property = segment.type === 'horizontal' ? "left" : "top";
            const currentPos = gsap.getProperty(segment.element, property);
            const percentage = Math.round((currentPos / segment.maxDistance) * 100);
            segment.element.textContent = percentage + '%';
        }
        
        // Start each segment with a random initial delay
        gsap.delayedCall(Math.random() * 2, createAnimation);
    });
}

function createInnerLines() {
    const margin = 40;
    const numHorizontalLines = Math.floor(Math.random() * 3) + 2; // 2-4 lines
    const numVerticalLines = Math.floor(Math.random() * 3) + 2; // 2-4 lines
    
    // Create horizontal inner lines
    for (let i = 0; i < numHorizontalLines; i++) {
        const line = document.createElement('div');
        line.className = 'line horizontal';
        const y = margin + (window.innerHeight - margin * 2) * Math.random();
        line.style.top = y + 'px';
        line.style.left = margin + 'px';
        line.style.width = `calc(100% - ${margin * 2}px)`;
        container.appendChild(line);
        
        // Add segments to this line
        const numSegments = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numSegments; j++) {
            const segment = document.createElement('div');
            segment.className = 'thick-segment horizontal';
            
            // Randomize shape - rectangle or square
            const isSquare = Math.random() > 0.5;
            const hasText = Math.random() > 0.6; // 40% chance to have text
            
            const width = isSquare ? 24 : Math.random() * 40 + 30;
            segment.style.width = width + 'px';
            segment.style.height = '24px';
            
            const maxDistance = window.innerWidth - margin * 2 - width;
            const initialPos = Math.random() * maxDistance;
            gsap.set(segment, { left: initialPos });
            
            line.appendChild(segment);
            segments.push({ 
                element: segment, 
                type: 'horizontal', 
                lineIndex: segments.length,
                maxDistance: maxDistance,
                hasText: hasText,
                width: width,
                isAnimating: false // Track animation state
            });
        }
    }
    
    // Create vertical inner lines
    for (let i = 0; i < numVerticalLines; i++) {
        const line = document.createElement('div');
        line.className = 'line vertical';
        const x = margin + (window.innerWidth - margin * 2) * Math.random();
        line.style.left = x + 'px';
        line.style.top = margin + 'px';
        line.style.height = `calc(100% - ${margin * 2}px)`;
        container.appendChild(line);
        
        // Add segments to this line
        const numSegments = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < numSegments; j++) {
            const segment = document.createElement('div');
            segment.className = 'thick-segment vertical';
            
            // Randomize shape - rectangle or square
            const isSquare = Math.random() > 0.5;
            const hasText = Math.random() > 0.6; // 40% chance to have text
            
            const height = isSquare ? 24 : Math.random() * 40 + 30;
            segment.style.height = height + 'px';
            segment.style.width = '24px';
            
            const maxDistance = window.innerHeight - margin * 2 - height;
            const initialPos = Math.random() * maxDistance;
            gsap.set(segment, { top: initialPos });
            
            line.appendChild(segment);
            segments.push({ 
                element: segment, 
                type: 'vertical', 
                lineIndex: segments.length,
                maxDistance: maxDistance,
                hasText: hasText,
                height: height,
                isAnimating: false // Track animation state
            });
        }
    }
}

// Initialize everything
function init() {
    const lines = createBorderLines();
    createCornerDots(lines.margin);
    createMeasurements(lines.margin);
    createThickSegments(lines);
    createInnerLines();
    animateSegments();
}

// Start when page loads
window.addEventListener('load', init);


window.addEventListener('resize', () => {
    segments.forEach(seg => gsap.killTweensOf(seg.element));
    container.innerHTML = '';
    segments.length = 0;
    init();
});
