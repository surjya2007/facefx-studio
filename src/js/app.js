// ======================================================
// FACEFX STUDIO — ULTIMATE EDITION
// MAIN APPLICATION CONTROLLER
// ======================================================

class FaceFXStudio {

    constructor() {

        this.currentFilter = "none";
        this.currentCategory = "all";
        this.intensity = 80;

        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];

        this.recordingTimer = null;
        this.recordingSeconds = 0;

        this.video = document.getElementById("camera");
        this.cameraStage = document.getElementById("cameraStage");

        this.initialize();

    }

    initialize() {

        console.log("FaceFX Studio initializing...");

        this.setupFilterGallery();
        this.setupCategories();
        this.setupIntensityControl();
        this.setupFullscreen();
        this.setupPhotoCapture();
        this.setupVideoRecording();
        this.setupKeyboardShortcuts();
        this.setupNavigation();

        this.updateFilterDisplay();

        console.log("FaceFX Studio initialized successfully.");

    }

    // ==================================================
    // FILTER GALLERY
    // ==================================================

    setupFilterGallery() {

        const filters = document.querySelectorAll(".filter-card");

        filters.forEach(filter => {

            filter.addEventListener("click", () => {

                filters.forEach(item => {
                    item.classList.remove("active");
                });

                filter.classList.add("active");

                this.currentFilter = filter.dataset.filter || "none";

                const filterName =
                    filter.querySelector("span:last-child")?.textContent ||
                    "Original";

                const selected = document.getElementById("selectedFilter");

                if (selected) {
                    selected.textContent = filterName;
                }

                // CRITICAL AR ENGINE CONNECTION

                if (window.FaceFXAR) {

                    window.FaceFXAR.setFilter(this.currentFilter);

                } else {

                    console.error("FaceFX AR Engine not available.");

                }

                this.applyVisualFilter();

                console.log("Selected AR Filter:", this.currentFilter);

            });

        });

    }

    // ==================================================
    // VISUAL FILTER
    // ==================================================

    applyVisualFilter() {

        if (!this.video) return;

        // AR effects are drawn on the canvas.
        // Keep the video itself visually neutral.

        const filters = {

            none: "none",
            dog: "none",
            cat: "none",
            bunny: "none",
            crown: "none",
            glasses: "none",
            hearts: "none"

        };

        this.video.style.filter =
            filters[this.currentFilter] || "none";

        this.video.style.opacity = "1";

    }

    // ==================================================
    // FILTER CATEGORIES
    // ==================================================

    setupCategories() {

        const categories =
            document.querySelectorAll(".category-item");

        const categoryMap = {

            animals: ["dog", "cat", "bunny"],
            fantasy: ["crown", "hearts"],
            fashion: ["glasses"],
            funny: ["dog", "cat", "bunny"],
            makeup: ["hearts"]

        };

        categories.forEach(button => {

            button.addEventListener("click", () => {

                categories.forEach(item => {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                this.currentCategory =
                    button.dataset.category || "all";

                const allowed = categoryMap[this.currentCategory];

                document.querySelectorAll(".filter-card").forEach(card => {

                    const filter = card.dataset.filter;

                    card.style.display =
                        this.currentCategory === "all" ||
                        !allowed ||
                        filter === "none" ||
                        allowed.includes(filter)
                            ? ""
                            : "none";

                });

            });

        });

    }

    // ==================================================
    // INTENSITY
    // ==================================================

    setupIntensityControl() {

        const slider = document.getElementById("intensity");

        if (!slider) return;

        slider.addEventListener("input", event => {

            this.intensity = Number(event.target.value);

            if (window.FaceFXAR) {
                window.FaceFXAR.setIntensity(this.intensity / 100);
            }

        });

    }

    // ==================================================
    // FILTER INFORMATION
    // ==================================================

    updateFilterDisplay() {

        const selected = document.getElementById("selectedFilter");

        if (selected) {
            selected.textContent = "Original";
        }

    }

    // ==================================================
    // PHOTO CAPTURE
    // ==================================================

    setupPhotoCapture() {

        document.getElementById("capturePhoto")
            ?.addEventListener("click", () => {

                this.capturePhoto();

            });

    }

    capturePhoto() {

        if (!this.video?.srcObject) {

            this.showNotification("Enable your camera first.", "error");
            return;

        }

        const width = this.video.videoWidth;
        const height = this.video.videoHeight;

        if (!width || !height) return;

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(this.video, 0, 0, width, height);

        ctx.restore();

        // Composite the AR canvas into the photo.

        const arCanvas = document.getElementById("filterCanvas");

        if (arCanvas) {

            ctx.save();

            ctx.translate(width, 0);
            ctx.scale(-1, 1);

            ctx.drawImage(arCanvas, 0, 0, width, height);

            ctx.restore();

        }

        canvas.toBlob(blob => {

            if (!blob) return;

            const url = URL.createObjectURL(blob);

            this.downloadFile(
                url,
                `FaceFX-Photo-${Date.now()}.png`
            );

            this.showNotification("Photo captured!", "success");

        }, "image/png");

    }

    // ==================================================
    // VIDEO RECORDING
    // ==================================================

    setupVideoRecording() {

        document.getElementById("recordVideo")
            ?.addEventListener("click", () => {

                this.isRecording
                    ? this.stopRecording()
                    : this.startRecording();

            });

    }

    startRecording() {

        const stream = this.video?.srcObject;

        if (!stream) {

            this.showNotification("Enable camera first.", "error");
            return;

        }

        try {

            this.recordedChunks = [];

            const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
                ? { mimeType: "video/webm;codecs=vp9" }
                : {};

            this.mediaRecorder = new MediaRecorder(stream, options);

            this.mediaRecorder.ondataavailable = event => {

                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }

            };

            this.mediaRecorder.onstop = () => {

                this.downloadRecording();

            };

            this.mediaRecorder.start(1000);

            this.isRecording = true;

            this.updateRecordingInterface();

            this.startRecordingTimer();

            this.showNotification("Recording started!", "success");

        } catch (error) {

            console.error(error);

            this.showNotification("Unable to record video.", "error");

        }

    }

    stopRecording() {

        if (this.mediaRecorder?.state === "recording") {
            this.mediaRecorder.stop();
        }

        this.isRecording = false;

        this.stopRecordingTimer();

        this.resetRecordingInterface();

        this.showNotification("Preparing video...", "success");

    }

    downloadRecording() {

        if (!this.recordedChunks.length) return;

        const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder.mimeType || "video/webm"
        });

        const url = URL.createObjectURL(blob);

        this.downloadFile(
            url,
            `FaceFX-Video-${Date.now()}.webm`
        );

        this.recordedChunks = [];

    }

    updateRecordingInterface() {

        const button = document.getElementById("recordVideo");

        if (button) {

            button.classList.add("recording");
            button.textContent = "■ Stop";

        }

        this.cameraStage?.classList.add("recording");

    }

    resetRecordingInterface() {

        const button = document.getElementById("recordVideo");

        if (button) {

            button.classList.remove("recording");
            button.textContent = "● Record";

        }

        this.cameraStage?.classList.remove("recording");

    }

    startRecordingTimer() {

        this.recordingSeconds = 0;

        this.recordingTimer = setInterval(() => {

            this.recordingSeconds++;

            const minutes = Math.floor(this.recordingSeconds / 60);
            const seconds = this.recordingSeconds % 60;

            const status = document.getElementById("trackingStatus");

            if (status) {

                status.textContent =
                    `● REC ${String(minutes).padStart(2, "0")}:` +
                    String(seconds).padStart(2, "0");

            }

        }, 1000);

    }

    stopRecordingTimer() {

        clearInterval(this.recordingTimer);

        this.recordingTimer = null;

    }

    // ==================================================
    // FULLSCREEN
    // ==================================================

    setupFullscreen() {

        document.getElementById("fullscreenButton")
            ?.addEventListener("click", async () => {

                try {

                    if (!document.fullscreenElement) {

                        await this.cameraStage.requestFullscreen();

                    } else {

                        await document.exitFullscreen();

                    }

                } catch (error) {

                    console.error(error);

                }

            });

    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    setupKeyboardShortcuts() {

        document.addEventListener("keydown", event => {

            if (
                event.target.matches("input, textarea, select") ||
                event.target.isContentEditable
            ) return;

            if (event.code === "Space") {

                event.preventDefault();
                this.capturePhoto();

            }

            if (event.key.toLowerCase() === "r") {

                this.isRecording
                    ? this.stopRecording()
                    : this.startRecording();

            }

            if (event.key.toLowerCase() === "f") {

                document.getElementById("fullscreenButton")?.click();

            }

        });

    }

    // ==================================================
    // NAVIGATION
    // ==================================================

    setupNavigation() {

        document.querySelectorAll(".nav-link").forEach(link => {

            link.addEventListener("click", () => {

                document.querySelectorAll(".nav-link")
                    .forEach(item => item.classList.remove("active"));

                link.classList.add("active");

            });

        });

    }

    // ==================================================
    // DOWNLOAD
    // ==================================================

    downloadFile(url, filename) {

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = filename;

        document.body.appendChild(anchor);

        anchor.click();
        anchor.remove();

        setTimeout(() => URL.revokeObjectURL(url), 10000);

    }

    // ==================================================
    // NOTIFICATIONS
    // ==================================================

    showNotification(message, type = "success") {

        let notification = document.getElementById("facefxNotification");

        if (!notification) {

            notification = document.createElement("div");

            notification.id = "facefxNotification";

            document.body.appendChild(notification);

        }

        notification.textContent = message;

        notification.className =
            `facefx-notification ${type} show`;

        clearTimeout(this.notificationTimeout);

        this.notificationTimeout = setTimeout(() => {

            notification.classList.remove("show");

        }, 3000);

    }

}

// ======================================================
// START APPLICATION
// ======================================================

function initializeFaceFX() {

    if (!window.FaceFX) {
        window.FaceFX = new FaceFXStudio();
    }

}

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", initializeFaceFX);

} else {

    initializeFaceFX();

}