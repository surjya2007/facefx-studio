// ============================================================
// FACEFX STUDIO — ADVANCED FACE TRACKING ENGINE
// Powered by MediaPipe Face Landmarker
// ============================================================

import {
    FaceLandmarker,
    FilesetResolver
} from "@mediapipe/tasks-vision";


class FaceFXFaceTracking {

    constructor() {

        this.video = document.getElementById("camera");

        this.landmarker = null;

        this.isInitialized = false;
        this.isRunning = false;
        this.isLoading = false;

        this.animationFrame = null;

        this.lastVideoTime = -1;
        this.lastDetectionTime = 0;

        this.fps = 0;
        this.frameCount = 0;
        this.fpsStartTime = performance.now();

        this.landmarks = null;
        this.blendshapes = null;
        this.transformation = null;

        this.statusElement = document.getElementById("trackingStatus");

        this.initializeEvents();

        console.log("FaceFX Face Tracking Engine ready.");
    }


    // --------------------------------------------------------
    // EVENT INITIALIZATION
    // --------------------------------------------------------

    initializeEvents() {

        window.addEventListener(
            "facefx:camera-started",
            () => this.start()
        );

        window.addEventListener(
            "facefx:camera-stopped",
            () => this.stop()
        );

    }


    // --------------------------------------------------------
    // LOAD MEDIAPIPE
    // --------------------------------------------------------

    async initialize() {

        if (this.isInitialized) {
            return true;
        }

        if (this.isLoading) {
            return false;
        }

        this.isLoading = true;

        this.updateStatus("LOADING FACE TRACKING...");

        try {

            console.log("Loading MediaPipe...");

            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );

            const options = {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",

                    delegate: "GPU"
                },

                runningMode: "VIDEO",

                numFaces: 1,

                minFaceDetectionConfidence: 0.5,

                minFacePresenceConfidence: 0.5,

                minTrackingConfidence: 0.5,

                outputFaceBlendshapes: true,

                outputFacialTransformationMatrixes: true
            };

            try {

                this.landmarker = await FaceLandmarker.createFromOptions(
                    vision,
                    options
                );

            } catch (gpuError) {

                console.warn(
                    "GPU initialization failed. Switching to CPU.",
                    gpuError
                );

                options.baseOptions.delegate = "CPU";

                this.landmarker = await FaceLandmarker.createFromOptions(
                    vision,
                    options
                );

            }

            this.isInitialized = true;

            console.log("MediaPipe initialized successfully.");

            return true;

        } catch (error) {

            console.error("MediaPipe initialization failed:", error);

            this.updateStatus("FACE TRACKING ERROR");

            return false;

        } finally {

            this.isLoading = false;

        }

    }


    // --------------------------------------------------------
    // START TRACKING
    // --------------------------------------------------------

    async start() {

        if (this.isRunning) {
            return;
        }

        if (!this.video || !this.video.srcObject) {
            console.error("Camera is not available.");
            return;
        }

        const initialized = await this.initialize();

        if (!initialized) {
            this.updateStatus("TRACKING UNAVAILABLE");
            return;
        }

        if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            this.updateStatus("WAITING FOR CAMERA...");
            return;
        }

        this.isRunning = true;

        this.lastVideoTime = -1;

        this.updateStatus("SEARCHING FOR FACE...");

        console.log("Face tracking started.");

        this.detectFrame();

    }


    // --------------------------------------------------------
    // REAL-TIME FACE DETECTION
    // --------------------------------------------------------

    detectFrame() {

        if (!this.isRunning) {
            return;
        }

        if (
            this.video &&
            this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {

            const currentTime = this.video.currentTime;

            if (currentTime !== this.lastVideoTime) {

                this.lastVideoTime = currentTime;

                try {

                    const results = this.landmarker.detectForVideo(
                        this.video,
                        performance.now()
                    );

                    this.processResults(results);

                    this.calculateFPS();

                } catch (error) {

                    console.error("Face detection error:", error);

                }

            }

        }

        this.animationFrame = requestAnimationFrame(
            () => this.detectFrame()
        );

    }


    // --------------------------------------------------------
    // PROCESS FACE LANDMARKS
    // --------------------------------------------------------

    processResults(results) {

        if (
            results.faceLandmarks &&
            results.faceLandmarks.length > 0
        ) {

            this.landmarks = results.faceLandmarks[0];

            this.blendshapes =
                results.faceBlendshapes?.[0] || null;

            this.transformation =
                results.facialTransformationMatrixes?.[0] || null;

            // Share data with the AR engine.

            window.FaceFXLandmarks = this.landmarks;

            window.FaceFXBlendshapes = this.blendshapes;

            window.FaceFXTransformation = this.transformation;

            window.FaceFXFaceCount = results.faceLandmarks.length;

            this.updateStatus(
                `FACE DETECTED · ${this.landmarks.length} LANDMARKS`
            );

            window.dispatchEvent(
                new CustomEvent("facefx:face-detected", {
                    detail: {
                        landmarks: this.landmarks,
                        blendshapes: this.blendshapes,
                        transformation: this.transformation
                    }
                })
            );

        } else {

            this.landmarks = null;
            this.blendshapes = null;
            this.transformation = null;

            window.FaceFXLandmarks = null;
            window.FaceFXBlendshapes = null;
            window.FaceFXTransformation = null;
            window.FaceFXFaceCount = 0;

            this.updateStatus("SEARCHING FOR FACE...");

        }

    }


    // --------------------------------------------------------
    // FPS COUNTER
    // --------------------------------------------------------

    calculateFPS() {

        this.frameCount++;

        const currentTime = performance.now();

        const elapsed = currentTime - this.fpsStartTime;

        if (elapsed >= 1000) {

            this.fps = Math.round(
                (this.frameCount * 1000) / elapsed
            );

            this.frameCount = 0;

            this.fpsStartTime = currentTime;

            window.FaceFXTrackingFPS = this.fps;

        }

    }


    // --------------------------------------------------------
    // UPDATE TRACKING STATUS
    // --------------------------------------------------------

    updateStatus(message) {

        if (this.statusElement) {
            this.statusElement.textContent = message;
        }

        console.log("[FaceFX Tracking]", message);

    }


    // --------------------------------------------------------
    // STOP TRACKING
    // --------------------------------------------------------

    stop() {

        this.isRunning = false;

        if (this.animationFrame) {

            cancelAnimationFrame(this.animationFrame);

            this.animationFrame = null;

        }

        this.landmarks = null;
        this.blendshapes = null;
        this.transformation = null;

        window.FaceFXLandmarks = null;
        window.FaceFXBlendshapes = null;
        window.FaceFXTransformation = null;
        window.FaceFXFaceCount = 0;

        this.updateStatus("TRACKING STOPPED");

        console.log("Face tracking stopped.");

    }


    // --------------------------------------------------------
    // GET TRACKING DATA
    // --------------------------------------------------------

    getLandmarks() {
        return this.landmarks;
    }

    getBlendshapes() {
        return this.blendshapes;
    }

    getTransformation() {
        return this.transformation;
    }

    getFPS() {
        return this.fps;
    }


    // --------------------------------------------------------
    // DESTROY ENGINE
    // --------------------------------------------------------

    destroy() {

        this.stop();

        if (this.landmarker) {

            this.landmarker.close();

            this.landmarker = null;

        }

        this.isInitialized = false;

        console.log("FaceFX Tracking Engine destroyed.");

    }

}


// ============================================================
// GLOBAL INSTANCE
// ============================================================

window.FaceFXTracker = new FaceFXFaceTracking();