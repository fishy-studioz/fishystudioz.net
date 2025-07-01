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
    topLine.style.background = '#0066cc';
    container.appendChild(topLine);
    
    // Bottom horizontal line
    const bottomLine = document.createElement('div');
    bottomLine.className = 'line horizontal';
    bottomLine.style.bottom = margin + 'px';
    bottomLine.style.left = margin + 'px';
    bottomLine.style.width = `calc(100% - ${margin * 2}px)`;
    bottomLine.style.background = '#0066cc';
    container.appendChild(bottomLine);
    
    // Left vertical line
    const leftLine = document.createElement('div');
    leftLine.className = 'line vertical';
    leftLine.style.left = margin + 'px';
    leftLine.style.top = margin + 'px';
    leftLine.style.height = `calc(100% - ${margin * 2}px)`;
    leftLine.style.background = '#0066cc';
    container.appendChild(leftLine);
    
    // Right vertical line
    const rightLine = document.createElement('div');
    rightLine.className = 'line vertical';
    rightLine.style.right = margin + 'px';
    rightLine.style.top = margin + 'px';
    rightLine.style.height = `calc(100% - ${margin * 2}px)`;
    rightLine.style.background = '#0066cc';
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
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.background = '#00aaff';
        dot.style.borderRadius = '50%';
        dot.style.position = 'absolute';
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
        elem.style.position = 'absolute';
        elem.style.color = '#0099dd';
        elem.style.fontSize = '12px';
        elem.style.fontFamily = 'Courier New, monospace';
        Object.assign(elem.style, m);
        container.appendChild(elem);
    });
}

function createDebugConnector(segment, targetPos) {
    const connector = document.createElement('div');
    connector.className = 'debug-connector';
    connector.style.position = 'absolute';
    connector.style.borderTop = '1px dotted #0088ff';
    connector.style.pointerEvents = 'none';
    connector.style.zIndex = '10';
    
    if (segment.type === 'horizontal') {
        const currentPos = gsap.getProperty(segment.element, "left");
        // Get the actual segment's vertical position and add half its height for center
        const segmentRect = segment.element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const y = segmentRect.top - containerRect.top + (segmentRect.height / 2);
        connector.style.top = (y + 5) + 'px' ;

        connector.style.width = Math.abs(targetPos - currentPos) + 'px';
        connector.style.height = '1px';
    } else {
        const currentPos = gsap.getProperty(segment.element, "top");
        const segmentRect = segment.element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const x = segmentRect.left - containerRect.left + (segmentRect.width / 2);
        
        connector.style.left = (x - 5) + 'px';
        connector.style.top = Math.min(currentPos, targetPos) + 'px';
        connector.style.width = '1px';
        connector.style.height = Math.abs(targetPos - currentPos) + 'px';
        connector.style.borderTop = 'none';
        connector.style.borderLeft = '1px dotted #0088ff';
    }
    
    container.appendChild(connector);
    return connector;
}

function createTargetConnector(segment, targetPos) {
    const connector = document.createElement('div');
    connector.className = 'target-connector';
    connector.style.position = 'absolute';
    connector.style.borderTop = '1px dotted #0088ff';
    connector.style.pointerEvents = 'none';
    connector.style.zIndex = '15';
    
    container.appendChild(connector);
    return connector;
}

function updateTargetConnector(connector, segment, targetPos) {
    if (segment.type === 'horizontal') {
        const currentPos = gsap.getProperty(segment.element, "left");
        const segmentRect = segment.element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const y = segmentRect.top - containerRect.top + (segmentRect.height / 2);
        
        connector.style.top = y + 'px';
        connector.style.left = Math.min(currentPos, targetPos) + 'px';
        connector.style.width = Math.abs(targetPos - currentPos) + 'px';
        connector.style.height = '1px';
        connector.style.borderLeft = 'none';
        connector.style.borderTop = '1px dotted #0088ff';
    } else {
        const currentPos = gsap.getProperty(segment.element, "top");
        const segmentRect = segment.element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const x = segmentRect.left - containerRect.left + (segmentRect.width / 2);
        
        connector.style.left = x + 'px';
        connector.style.top = Math.min(currentPos, targetPos) + 'px';
        connector.style.width = '1px';
        connector.style.height = Math.abs(targetPos - currentPos) + 'px';
        connector.style.borderTop = 'none';
        connector.style.borderLeft = '1px dotted #0088ff';
    }
}

function createDebugTarget(segment, targetPos) {
    // Clone the actual segment
    const target = segment.element.cloneNode(true);
    target.className = 'debug-target';
    
    // Style it as a target
    target.style.background = 'rgba(0, 136, 255, 0.3)';
    target.style.border = '1px solid #0088ff';
    target.style.pointerEvents = 'none';
    target.style.zIndex = '5';
    target.style.boxSizing = 'border-box';
    target.style.opacity = '0.7';
    
    // Add it to the same parent as the original segment
    segment.element.parentElement.appendChild(target);
    
    // Position it at target location and center it on the rail
    if (segment.type === 'horizontal') {
        gsap.set(target, { 
            left: targetPos,
            top: -11  // Center the 24px height segment on the 2px line (24/2 - 2/2 = 11)
        });
    } else {
        gsap.set(target, { 
            top: targetPos,
            left: -11  // Center the 24px width segment on the 2px line (24/2 - 2/2 = 11)
        });
    }
    
    // Add target position text
    const text = document.createElement('div');
    text.style.position = 'absolute';
    text.style.color = '#0088ff';
    text.style.fontSize = '10px';
    text.style.fontFamily = 'Courier New, monospace';
    text.textContent = Math.round(targetPos) + 'px';
    
    if (segment.type === 'horizontal') {
        text.style.top = '-20px';
        text.style.left = '50%';
        text.style.transform = 'translateX(-50%)';
    } else {
        text.style.left = '-30px';
        text.style.top = '50%';
        text.style.transform = 'translateY(-50%)';
    }
    
    target.appendChild(text);
    return target;
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
            segment.style.position = 'absolute';
            segment.style.background = '#0099ff';
            segment.style.zIndex = '20';
            
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
                    isAnimating: false,
                    debugElements: []
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
                    isAnimating: false,
                    debugElements: []
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
            
            // Clear previous debug elements
            segment.debugElements.forEach(el => el.remove());
            segment.debugElements = [];
            
            const isHorizontal = segment.type === 'horizontal';
            const maxDistance = segment.maxDistance;
            
            // Random speed between slow and medium
            let baseDuration = Math.random() * 3 + 2; // 2-5 seconds
            let isFast = false;
            
            // Occasionally make it very fast
            if (Math.random() < 0.025) { // 2.5% chance
                baseDuration = Math.random() * 0.5 + 0.3; // 0.3-0.8 seconds
                isFast = true;
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
            
            // Create debug visualization
            const connector = createDebugConnector(segment, targetPos);
            const target = createDebugTarget(segment, targetPos);
            const targetConnector = createTargetConnector(segment, targetPos);
            segment.debugElements.push(connector, target, targetConnector);
            
            // Handle fast segment styling and blinking
            let blinkTween = null;
            let rushTween = null;
            
            if (isFast) {

                segment.element.style.background = '#ff3333';
                target.style.background = 'rgba(255, 51, 51, 0.3)';
                target.style.border = '1px solid #ff3333';
                connector.style.borderColor = '#ff3333';
                targetConnector.style.borderColor = '#ff3333';
                
                const blinkDuration = Math.random() * 1 + 1; // 1-2 seconds of blinking
                
                blinkTween = gsap.to([segment.element, target], {
                    opacity: 0.3,
                    duration: 0.08,
                    yoyo: true,
                    repeat: -1,
                    ease: "power2.inOut"
                });
                
                gsap.delayedCall(blinkDuration, () => {
                    if (blinkTween) {
                        blinkTween.kill();
                        gsap.set([segment.element, target], { opacity: 1 });
                    }
                    
                    startMovement();
                });
                
                // Mark as animating immediately
                segment.isAnimating = true;
                return; // Exit early since we'll start movement after blink delay
            }
            
            function startMovement() {
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
                            segment.element.textContent = percentage + '%';
                            segment.element.style.color = isFast ? '#ffffff' : '#003366';
                            segment.element.style.fontSize = '10px';
                            segment.element.style.display = 'flex';
                            segment.element.style.alignItems = 'center';
                            segment.element.style.justifyContent = 'center';
                            segment.element.style.fontFamily = 'Courier New, monospace';
                        }
                        
                        // Update connector in real-time with correct positioning
                        const newCurrentPos = gsap.getProperty(segment.element, property);
                        if (isHorizontal) {
                            connector.style.left = Math.min(newCurrentPos, targetPos) + 'px';
                            connector.style.width = Math.abs(targetPos - newCurrentPos) + 'px';
                        } else {
                            connector.style.top = Math.min(newCurrentPos, targetPos) + 'px';
                            connector.style.height = Math.abs(targetPos - newCurrentPos) + 'px';
                        }
                        
                        // Update target connector (the dotted line between current and target)
                        updateTargetConnector(targetConnector, segment, targetPos);
                    },
                    onComplete: () => {
                        // Stop any remaining tweens
                        if (blinkTween) {
                            blinkTween.kill();
                        }
                        
                        // Restore normal colors
                        segment.element.style.background = '#0099ff';
                        segment.element.style.opacity = '1';
                        target.style.background = 'rgba(0, 136, 255, 0.3)';
                        target.style.border = '1px solid #0088ff';
                        target.style.opacity = '1';
                        connector.style.borderColor = '#0088ff';
                        targetConnector.style.borderColor = '#0088ff';
                        
                        // Update text color if it has text
                        if (segment.hasText) {
                            segment.element.style.color = '#003366';
                        }
                        
                        // Mark as not animating
                        segment.isAnimating = false;
                        
                        // Keep debug elements visible for a moment
                        gsap.delayedCall(0.5, () => {
                            segment.debugElements.forEach(el => {
                                gsap.to(el, { opacity: 0, duration: 0.5, onComplete: () => el.remove() });
                            });
                            segment.debugElements = [];
                        });
                        
                        // Add random delay before next animation
                        gsap.delayedCall(Math.random() * 2 + 1, createAnimation);
                    }
                });
            }
            
            // For non-fast segments, start movement immediately
            if (!isFast) {
                startMovement();
            }
        }
        
        // Set initial text if needed
        if (segment.hasText) {
            const property = segment.type === 'horizontal' ? "left" : "top";
            const currentPos = gsap.getProperty(segment.element, property);
            const percentage = Math.round((currentPos / segment.maxDistance) * 100);
            segment.element.textContent = percentage + '%';
            segment.element.style.color = '#003366';
            segment.element.style.fontSize = '10px';
            segment.element.style.display = 'flex';
            segment.element.style.alignItems = 'center';
            segment.element.style.justifyContent = 'center';
            segment.element.style.fontFamily = 'Courier New, monospace';
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
        line.style.position = 'absolute';
        line.style.height = '2px';
        line.style.background = '#0066cc';
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
            segment.style.position = 'absolute';
            segment.style.background = '#0099ff';
            segment.style.zIndex = '20';
            
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
                isAnimating: false,
                debugElements: []
            });
        }
    }
    
    // Create vertical inner lines
    for (let i = 0; i < numVerticalLines; i++) {
        const line = document.createElement('div');
        line.className = 'line vertical';
        line.style.position = 'absolute';
        line.style.width = '2px';
        line.style.background = '#0066cc';
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
            segment.style.position = 'absolute';
            segment.style.background = '#0099ff';
            segment.style.zIndex = '20';
            
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
                isAnimating: false,
                debugElements: []
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
    segments.forEach(seg => {
        gsap.killTweensOf(seg.element);
        seg.debugElements.forEach(el => el.remove());
    });
    container.innerHTML = '';
    segments.length = 0;
    init();
});