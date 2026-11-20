// ======================================================
// FACEFX STUDIO — CAMERA ENGINE V2
// ======================================================

class FaceFXCameraEngine {

    constructor() {

        this.video = document.getElementById("camera");
        this.stage = document.getElementById("cameraStage");

        this.startButton = document.getElementById("startCamera");
        this.flipButton = document.getElementById("flipCamera");

        this.cameraStatus = document.getElementById("cameraStatus");
        this.trackingStatus = document.getElementById("trackingStatus");

        this.errorBox = document.getElementById("cameraError");

        this.stream = null;
        this.isActive = false;
        this.isLoading = false;
        this.startPromise = null;
        this.facingMode = "user";

        this.initialize();
    }

    initialize() {

        if (!this.video) {
            console.error("Camera video element missing.");
            return;
        }

        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true;

        this.startButton?.addEventListener("click", () => {
            if (this.isActive) {
                this.stop();
            } else {
                this.start();
            }
        });

        this.flipButton?.addEventListener("click", () => {
            this.flipCamera();
        });

        console.log("FaceFX Camera Engine ready.");
    }

    // START CAMERA

    async start() {

        if (this.isActive) return true;

        if (this.startPromise) {
            return this.startPromise;
        }

        this.startPromise = this.startCamera();

        try {
            return await this.startPromise;
        } finally {
            this.startPromise = null;
        }
    }

    async startCamera() {

        this.isLoading = true;
        this.clearError();
        this.updateButton();
        this.updateStatus("CONNECTING CAMERA...");

        try {

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera API unavailable. Use localhost or HTTPS."
                );
            }

            const quality = document.getElementById("cameraQuality")?.value;

            const resolution = quality === "1080p"
                ? { width: 1920, height: 1080 }
                : quality === "480p"
                    ? { width: 640, height: 480 }
                    : { width: 1280, height: 720 };

            const constraints = {
                audio: false,
                video: {
                    facingMode: { ideal: this.facingMode },
                    width: { ideal: resolution.width },
                    height: { ideal: resolution.height },
                    frameRate: { ideal: 30 }
                }
            };

            let stream;

            try {

                stream = await navigator.mediaDevices.getUserMedia(
                    constraints
                );

            } catch (firstError) {

                console.warn("Retrying with basic camera settings:", firstError);

                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: { ideal: this.facingMode }
                    }
                });

            }

            this.stream = stream;
            this.video.srcObject = stream;

            // Wait until video metadata is available.

            if (this.video.readyState < HTMLMediaElement.HAVE_METADATA) {

                await new Promise((resolve, reject) => {

                    const onLoaded = () => {
                        cleanup();
                        resolve();
                    };

                    const onError = () => {
                        cleanup();
                        reject(new Error("Video source could not initialize."));
                    };

                    const cleanup = () => {
                        this.video.removeEventListener("loadedmetadata", onLoaded);
                        this.video.removeEventListener("error", onError);
                    };

                    this.video.addEventListener("loadedmetadata", onLoaded, { once: true });
                    this.video.addEventListener("error", onError, { once: true });

                });

            }

            await this.video.play();

            this.isActive = true;

            this.stage?.classList.add("camera-active");

            this.updateStatus("CAMERA CONNECTED");
            this.updateButton();

            window.dispatchEvent(
                new CustomEvent("facefx:camera-started", {
                    detail: { stream: this.stream }
                })
            );

            console.log("Camera successfully connected.");

            return true;

        } catch (error) {

            console.error("Camera initialization failed:", error);

            this.releaseStream();

            this.isActive = false;

            this.handleError(error);

            return false;

        } finally {

            this.isLoading = false;
            this.updateButton();

        }
    }

    // STOP CAMERA

    stop() {

        if (this.isLoading) return;

        this.releaseStream();

        this.isActive = false;

        this.stage?.classList.remove("camera-active");

        this.updateStatus("CAMERA OFF");
        this.updateButton();

        window.dispatchEvent(
            new CustomEvent("facefx:camera-stopped")
        );
    }

    // RELEASE STREAM

    releaseStream() {

        if (this.stream) {

            this.stream.getTracks().forEach(track => track.stop());

            this.stream = null;
        }

        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
        }
    }

    // SWITCH CAMERA

    async flipCamera() {

        if (this.isLoading) return;

        const active = this.isActive;

        this.facingMode =
            this.facingMode === "user" ? "environment" : "user";

        if (active) {
            this.stop();
            await this.start();
        }
    }

    // BUTTON

    updateButton() {

        if (!this.startButton) return;

        this.startButton.disabled = this.isLoading;

        this.startButton.textContent = this.isLoading
            ? "◌ Connecting..."
            : this.isActive
                ? "⏹ Stop Camera"
                : "◉ Enable Camera";
    }

    // STATUS

    updateStatus(message) {

        if (this.cameraStatus) {
            this.cameraStatus.textContent = message;
        }

        if (this.trackingStatus) {
            this.trackingStatus.textContent = message;
        }
    }

    // ERROR

    handleError(error) {

        let message = error.message || "Unable to access camera.";

        if (error.name === "NotAllowedError") {
            message = "Camera permission denied. Allow camera access in Chrome.";
        }

        if (error.name === "NotFoundError") {
            message = "No camera detected.";
        }

        if (error.name === "NotReadableError") {
            message = "Camera is busy. Close other camera applications.";
        }

        if (error.name === "OverconstrainedError") {
            message = "Camera does not support the requested settings.";
        }

        this.updateStatus("CAMERA ERROR");
        this.showError(message);
    }

    showError(message) {

        if (!this.errorBox) {
            this.errorBox = document.createElement("div");
            this.errorBox.id = "cameraError";
            this.errorBox.className = "camera-error";
            this.stage?.appendChild(this.errorBox);
        }

        this.errorBox.textContent = message;
    }

    clearError() {

        if (this.errorBox) {
            this.errorBox.textContent = "";
        }
    }
}

// INITIALIZE

window.FaceFXCamera = new FaceFXCameraEngine();