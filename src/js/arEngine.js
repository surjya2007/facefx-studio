// ======================================================
// FACEFX STUDIO — AR ENGINE 3.0
// 20+ Animated Face Filters
// ======================================================

class FaceFXAREngine {

    constructor() {

        this.canvas = document.getElementById("filterCanvas");
        this.video = document.getElementById("camera");

        if (!this.canvas || !this.video) {
            console.error("FaceFX: Camera canvas or video not found.");
            return;
        }

        this.ctx = this.canvas.getContext("2d");

        this.currentFilter = "none";
        this.intensity = 0.85;

        this.running = false;
        this.animationFrame = null;

        this.time = 0;
        this.particles = [];

        this.initialize();

    }

    initialize() {

        this.resizeCanvas();

        window.addEventListener("resize", () => {
            this.resizeCanvas();
        });

        window.addEventListener("facefx:camera-started", () => {

            this.resizeCanvas();
            this.start();

        });

        window.addEventListener("facefx:camera-stopped", () => {
            this.clear();
        });

        this.start();

        console.log("FaceFX AR Engine 3.0 initialized.");

    }

    // --------------------------------------------------
    // CANVAS
    // --------------------------------------------------

    resizeCanvas() {

        const width = this.video.videoWidth || 1280;
        const height = this.video.videoHeight || 720;

        if (
            this.canvas.width !== width ||
            this.canvas.height !== height
        ) {

            this.canvas.width = width;
            this.canvas.height = height;

        }

    }

    clear() {

        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

    }

    // --------------------------------------------------
    // FILTER CONTROL
    // --------------------------------------------------

    setFilter(filter) {

        this.currentFilter = filter;

        this.particles = [];

        console.log("Selected AR Filter:", filter);

        this.clear();

    }

    setIntensity(value) {

        this.intensity = Math.max(
            0,
            Math.min(1, Number(value))
        );

    }

    // --------------------------------------------------
    // ANIMATION LOOP
    // --------------------------------------------------

    start() {

        if (this.running) return;

        this.running = true;

        this.render();

    }

    stop() {

        this.running = false;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.clear();

    }

    render() {

        if (!this.running) return;

        this.animationFrame = requestAnimationFrame(
            () => this.render()
        );

        this.time += 0.035;

        this.resizeCanvas();

        this.clear();

        if (this.currentFilter === "none") return;

        const landmarks = window.FaceFXLandmarks;

        if (!landmarks || landmarks.length < 468) return;

        const ctx = this.ctx;

        ctx.save();

        ctx.globalAlpha = this.intensity;

        const face = this.getFace(landmarks);

        if (!face) {
            ctx.restore();
            return;
        }

        this.drawFilter(face, landmarks);

        ctx.restore();

    }

    // --------------------------------------------------
    // FACE GEOMETRY
    // --------------------------------------------------

    point(landmarks, index) {

        const p = landmarks[index];

        return {
            x: p.x * this.canvas.width,
            y: p.y * this.canvas.height,
            z: p.z || 0
        };

    }

    getFace(landmarks) {

        const leftEye = this.point(landmarks, 33);
        const rightEye = this.point(landmarks, 263);

        const forehead = this.point(landmarks, 10);
        const chin = this.point(landmarks, 152);

        const nose = this.point(landmarks, 1);

        const eyeDistance = Math.hypot(
            rightEye.x - leftEye.x,
            rightEye.y - leftEye.y
        );

        const angle = Math.atan2(
            rightEye.y - leftEye.y,
            rightEye.x - leftEye.x
        );

        return {
            leftEye,
            rightEye,
            forehead,
            chin,
            nose,
            centerX: (leftEye.x + rightEye.x) / 2,
            centerY: (forehead.y + chin.y) / 2,
            eyeDistance,
            angle,
            width: eyeDistance * 2.25,
            height: Math.abs(chin.y - forehead.y)
        };

    }

    // --------------------------------------------------
    // DRAWING HELPERS
    // --------------------------------------------------

    glow(color, blur = 20) {

        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;

    }

    textEmoji(emoji, x, y, size, rotation = 0) {

        const ctx = this.ctx;

        ctx.save();

        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.font = `${size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(emoji, 0, 0);

        ctx.restore();

    }

    ellipse(x, y, rx, ry, color, lineWidth = 4) {

        const ctx = this.ctx;

        ctx.save();

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            rx,
            ry,
            0,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();

    }

    line(x1, y1, x2, y2, color, width = 4) {

        const ctx = this.ctx;

        ctx.save();

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";

        ctx.beginPath();

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.stroke();

        ctx.restore();

    }

    // --------------------------------------------------
    // FILTER ROUTER
    // --------------------------------------------------

    drawFilter(face, landmarks) {

        const filters = {

            dog: () => this.dog(face),
            cat: () => this.cat(face),
            bunny: () => this.bunny(face),
            crown: () => this.crown(face),
            glasses: () => this.glasses(face),

            hearts: () => this.hearts(face),
            devil: () => this.devil(face),
            angel: () => this.angel(face),
            alien: () => this.alien(face),
            robot: () => this.robot(face),

            butterfly: () => this.butterfly(face),
            flower: () => this.flower(face),
            stars: () => this.stars(face),
            fire: () => this.fire(face),
            electric: () => this.electric(face),

            diamond: () => this.diamond(face),
            neon: () => this.neon(face),
            rainbow: () => this.rainbow(face),
            magic: () => this.magic(face),
            ghost: () => this.ghost(face)

        };

        if (filters[this.currentFilter]) {
            filters[this.currentFilter]();
        }

    }

    // --------------------------------------------------
    // 1. DOG
    // --------------------------------------------------

    dog(f) {

        this.textEmoji(
            "🐶",
            f.centerX,
            f.forehead.y - 35,
            f.width * 0.48
        );

        this.textEmoji(
            "🐶",
            f.leftEye.x - 65,
            f.centerY - 20,
            65
        );

        this.textEmoji(
            "🐶",
            f.rightEye.x + 65,
            f.centerY - 20,
            65
        );

    }

    // --------------------------------------------------
    // 2. CAT
    // --------------------------------------------------

    cat(f) {

        const y = f.forehead.y - 30;

        this.ctx.save();
        this.ctx.translate(f.centerX, y);
        this.ctx.rotate(f.angle);

        this.textEmoji("🐱", 0, 0, f.width * 0.55);

        this.ctx.restore();

        this.textEmoji("🐾", f.leftEye.x - 65, f.centerY, 45);
        this.textEmoji("🐾", f.rightEye.x + 65, f.centerY, 45);

    }

    // --------------------------------------------------
    // 3. BUNNY
    // --------------------------------------------------

    bunny(f) {

        this.ctx.save();

        this.ctx.translate(f.centerX, f.forehead.y - 55);
        this.ctx.rotate(f.angle);

        this.textEmoji("🐰", 0, 0, f.width * 0.65);

        this.ctx.restore();

    }

    // --------------------------------------------------
    // 4. CROWN
    // --------------------------------------------------

    crown(f) {

        this.glow("#ffd700", 25);

        this.textEmoji(
            "👑",
            f.centerX,
            f.forehead.y - 45,
            f.width * 0.55
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 5. GLASSES
    // --------------------------------------------------

    glasses(f) {

        const ctx = this.ctx;

        ctx.save();

        ctx.translate(f.centerX, f.centerY - 25);
        ctx.rotate(f.angle);

        ctx.fillStyle = "#101020";
        ctx.strokeStyle = "#00eaff";
        ctx.lineWidth = 5;

        const w = f.eyeDistance * 0.48;

        ctx.beginPath();
        ctx.roundRect(-w - 8, -25, w, 50, 12);
        ctx.roundRect(8, -25, w, 50, 12);
        ctx.fill();
        ctx.stroke();

        this.line(-8, 0, 8, 0, "#00eaff", 5);

        ctx.restore();

    }

    // --------------------------------------------------
    // 6. HEARTS
    // --------------------------------------------------

    hearts(f) {

        for (let i = 0; i < 5; i++) {

            const x = f.centerX +
                Math.sin(this.time + i) * f.width * 0.55;

            const y = f.forehead.y -
                30 -
                ((this.time * 35 + i * 50) % 120);

            this.textEmoji("❤️", x, y, 30);

        }

    }

    // --------------------------------------------------
    // 7. DEVIL
    // --------------------------------------------------

    devil(f) {

        this.glow("#ff1744", 20);

        this.textEmoji(
            "😈",
            f.centerX,
            f.forehead.y - 40,
            f.width * 0.55
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 8. ANGEL
    // --------------------------------------------------

    angel(f) {

        this.glow("#fff4b0", 20);

        this.textEmoji(
            "😇",
            f.centerX,
            f.forehead.y - 35,
            f.width * 0.52
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 9. ALIEN
    // --------------------------------------------------

    alien(f) {

        this.glow("#00ff99", 25);

        this.textEmoji(
            "👽",
            f.centerX,
            f.centerY - 30,
            f.width * 0.65
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 10. ROBOT
    // --------------------------------------------------

    robot(f) {

        this.glow("#00eaff", 15);

        this.textEmoji(
            "🤖",
            f.centerX,
            f.centerY - 20,
            f.width * 0.62
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 11. BUTTERFLY
    // --------------------------------------------------

    butterfly(f) {

        const size = f.width * 0.28;

        this.textEmoji(
            "🦋",
            f.leftEye.x - 35,
            f.forehead.y - 10,
            size
        );

        this.textEmoji(
            "🦋",
            f.rightEye.x + 35,
            f.forehead.y - 10,
            size
        );

    }

    // --------------------------------------------------
    // 12. FLOWER CROWN
    // --------------------------------------------------

    flower(f) {

        for (let i = 0; i < 7; i++) {

            const angle = Math.PI + (i / 6) * Math.PI;

            const x = f.centerX +
                Math.cos(angle) * f.width * 0.48;

            const y = f.forehead.y - 15 +
                Math.sin(angle) * f.width * 0.18;

            this.textEmoji("🌸", x, y, 40);

        }

    }

    // --------------------------------------------------
    // 13. STAR EYES
    // --------------------------------------------------

    stars(f) {

        this.glow("#fff000", 20);

        this.textEmoji("⭐", f.leftEye.x, f.leftEye.y, 48);
        this.textEmoji("⭐", f.rightEye.x, f.rightEye.y, 48);

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 14. FIRE
    // --------------------------------------------------

    fire(f) {

        this.glow("#ff4500", 25);

        for (let i = 0; i < 8; i++) {

            const x = f.centerX +
                Math.sin(this.time * 2 + i) * f.width * 0.5;

            const y = f.forehead.y -
                20 -
                ((this.time * 50 + i * 35) % 100);

            this.textEmoji("🔥", x, y, 35);

        }

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 15. ELECTRIC
    // --------------------------------------------------

    electric(f) {

        this.glow("#00eaff", 25);

        for (let i = 0; i < 6; i++) {

            const x = f.centerX +
                Math.cos(this.time + i) * f.width * 0.6;

            const y = f.centerY +
                Math.sin(this.time * 2 + i) * f.height * 0.35;

            this.textEmoji("⚡", x, y, 32);

        }

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 16. DIAMOND
    // --------------------------------------------------

    diamond(f) {

        this.glow("#8eeaff", 25);

        this.textEmoji(
            "💎",
            f.centerX,
            f.forehead.y - 35,
            f.width * 0.45
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 17. NEON MASK
    // --------------------------------------------------

    neon(f) {

        this.glow("#a855f7", 20);

        this.ellipse(
            f.centerX,
            f.centerY,
            f.width * 0.55,
            f.height * 0.45,
            "#d946ef",
            5
        );

        this.ellipse(
            f.leftEye.x,
            f.leftEye.y,
            24,
            14,
            "#00eaff",
            4
        );

        this.ellipse(
            f.rightEye.x,
            f.rightEye.y,
            24,
            14,
            "#00eaff",
            4
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 18. RAINBOW
    // --------------------------------------------------

    rainbow(f) {

        const colors = [
            "#ff0000",
            "#ff9900",
            "#ffff00",
            "#00ff00",
            "#00aaff",
            "#9900ff"
        ];

        colors.forEach((color, i) => {

            this.ellipse(
                f.centerX,
                f.forehead.y + 5,
                f.width * (0.25 + i * 0.055),
                f.width * (0.12 + i * 0.025),
                color,
                5
            );

        });

    }

    // --------------------------------------------------
    // 19. MAGIC
    // --------------------------------------------------

    magic(f) {

        this.glow("#c084fc", 20);

        for (let i = 0; i < 12; i++) {

            const angle = this.time + i * 0.52;

            const x = f.centerX +
                Math.cos(angle) * f.width * 0.7;

            const y = f.centerY +
                Math.sin(angle) * f.height * 0.55;

            this.textEmoji("✨", x, y, 28);

        }

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // 20. GHOST
    // --------------------------------------------------

    ghost(f) {

        this.glow("#ffffff", 25);

        this.textEmoji(
            "👻",
            f.centerX,
            f.forehead.y - 35,
            f.width * 0.55
        );

        this.ctx.shadowBlur = 0;

    }

    // --------------------------------------------------
    // DESTROY
    // --------------------------------------------------

    destroy() {

        this.stop();

        this.particles = [];

        this.clear();

    }

}

// ======================================================
// GLOBAL INSTANCE
// ======================================================

window.FaceFXAR = new FaceFXAREngine();

console.log(
    "%c FACEFX AR ENGINE 3.0 READY ",
    "background:#8b5cf6;color:white;padding:8px;font-weight:bold;"
);