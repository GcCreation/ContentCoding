// Set up canvas
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables for animation
const particles = [];
const hearts = [];
const TAU = Math.PI * 2;

// Color settings
let hueBase = 0;

// Heart coordinates calculation function (different formula than original)
function createHeartCoords(scale, xOffset, yOffset) {
    const coords = [];
    // Use a different heart formula than the original
    for (let i = 0; i < TAU; i += 0.05) {
        // A different heart curve formula
        const t = i % TAU;
        const x = scale * 16 * Math.pow(Math.sin(t), 3);
        const y = scale * -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        coords.push([x + xOffset, y + yOffset]);
    }
    return coords;
}

// Initialize hearts
function initHearts() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Create main heart
    hearts.push(createHeartCoords(12, centerX, centerY));

    // Create inner heart (smaller)
    hearts.push(createHeartCoords(9, centerX, centerY));

    // Create center heart (smallest)
    hearts.push(createHeartCoords(6, centerX, centerY));
}

// Initialize particles
function initParticles() {
    const particleCount = 1500;

    for (let i = 0; i < particleCount; i++) {
        let heartIndex;

        // Distribute particles across different hearts
        if (i < particleCount * 0.5) {
            heartIndex = 0; // 50% particles on outer heart
        } else if (i < particleCount * 0.8) {
            heartIndex = 1; // 30% particles on middle heart
        } else {
            heartIndex = 2; // 20% particles on inner heart
        }

        particles.push({
            x: canvas.width / 2, // Start at center
            y: canvas.height / 2, // Start at center
            vx: 0,
            vy: 0,
            radius: Math.random() * 3 + 1,
            heartIndex: heartIndex,
            targetIndex: Math.floor(Math.random() * hearts[heartIndex].length),
            speed: Math.random() * 0.8 + 0.6,
            friction: Math.random() * 0.08 + 0.91,
            color: null,
            pulse: Math.random() * 0.5 + 0.5,
            pulseSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Fade background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update color cycling
    hueBase = (hueBase + 0.2) % 360;

    // Add pulsation effect to heart shape
    const pulse = 1 + 0.08 * Math.sin(Date.now() * 0.002);

    // Process each particle
    particles.forEach((p, index) => {
        // Get target heart point with pulse effect
        const heart = hearts[p.heartIndex];
        const target = heart[p.targetIndex];

        // Apply pulse effect to target
        const tx = (target[0] - canvas.width / 2) * pulse + canvas.width / 2;
        const ty = (target[1] - canvas.height / 2) * pulse + canvas.height / 2;

        // Calculate direction vector
        const dx = tx - p.x;
        const dy = ty - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if particle is close enough to target
        if (distance < 10) {
            // Chance to pick a new target on the same heart
            if (Math.random() > 0.96) {
                p.targetIndex = Math.floor(Math.random() * heart.length);
            }
        }

        // Update velocity
        p.vx += dx / distance * p.speed;
        p.vy += dy / distance * p.speed;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Apply friction
        p.vx *= p.friction;
        p.vy *= p.friction;

        // Update pulse
        p.pulse += p.pulseSpeed;
        if (p.pulse > 1.5 || p.pulse < 0.5) {
            p.pulseSpeed *= -1;
        }

        // Set color based on position and heart index
        const hue = (hueBase + p.heartIndex * 15 + distance * 0.2) % 360;
        const saturation = 70 + p.heartIndex * 10;
        const lightness = 50 + Math.sin(p.pulse) * 20;
        p.color = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.pulse, 0, TAU);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect particles with subtle lines (only for some particles)
        if (index % 3 === 0 && index < particles.length - 1) {
            const next = particles[index + 1];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(next.x, next.y);
            ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.1)`;
            ctx.stroke();
        }
    });
}

// Handle window resize
function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reinitialize everything
    hearts.length = 0;
    particles.length = 0;
    initHearts();
    initParticles();
}

// Initialize and start animation
window.addEventListener('resize', handleResize);
initHearts();
initParticles();
animate();