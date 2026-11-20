// ======================================================
// FACEFX STUDIO — FILTER GALLERY 3.0
// ======================================================

class FaceFXFilterGallery {

    constructor() {

        this.filters = [
            { id: "none", name: "No Filter", emoji: "🚫", category: "all", type: "Original" },

            { id: "dog", name: "Cute Dog", emoji: "🐶", category: "cute", type: "Animal" },
            { id: "cat", name: "Pretty Cat", emoji: "🐱", category: "cute", type: "Animal" },
            { id: "bunny", name: "Bunny", emoji: "🐰", category: "cute", type: "Animal" },
            { id: "hearts", name: "Love Hearts", emoji: "❤️", category: "cute", type: "Animated" },
            { id: "butterfly", name: "Butterfly", emoji: "🦋", category: "cute", type: "Animated" },
            { id: "flower", name: "Flower Crown", emoji: "🌸", category: "cute", type: "Beauty" },
            { id: "stars", name: "Star Eyes", emoji: "⭐", category: "cute", type: "Beauty" },

            { id: "crown", name: "Royal Crown", emoji: "👑", category: "fantasy", type: "Royal" },
            { id: "angel", name: "Angel", emoji: "😇", category: "fantasy", type: "Fantasy" },
            { id: "devil", name: "Devil", emoji: "😈", category: "fantasy", type: "Fantasy" },
            { id: "alien", name: "Alien", emoji: "👽", category: "fantasy", type: "Fantasy" },
            { id: "diamond", name: "Diamond", emoji: "💎", category: "fantasy", type: "Luxury" },
            { id: "ghost", name: "Ghost", emoji: "👻", category: "fantasy", type: "Fantasy" },

            { id: "glasses", name: "Cool Glasses", emoji: "🕶️", category: "funny", type: "Style" },
            { id: "robot", name: "Robot", emoji: "🤖", category: "funny", type: "Character" },

            { id: "fire", name: "Fire Aura", emoji: "🔥", category: "effects", type: "Animated" },
            { id: "electric", name: "Electric Aura", emoji: "⚡", category: "effects", type: "Animated" },
            { id: "neon", name: "Neon Mask", emoji: "🎭", category: "effects", type: "Neon" },
            { id: "rainbow", name: "Rainbow", emoji: "🌈", category: "effects", type: "Color" },
            { id: "magic", name: "Magic Sparkles", emoji: "✨", category: "effects", type: "Animated" }
        ];

        this.activeCategory = "all";
        this.activeFilter = "none";

        this.initialize();

    }

    initialize() {

        const gallery = document.getElementById("facefxFilterGallery");

        if (!gallery) {
            console.error("FaceFX: Filter gallery container not found.");
            return;
        }

        this.gallery = gallery;

        this.render();
        this.setupEvents();

        console.log("FaceFX Filter Gallery initialized.");

    }

    render() {

        this.gallery.innerHTML = `
            <div class="filter-gallery">

                <div class="filter-gallery-header">
                    <div>
                        <h2>✨ AR Effects</h2>
                        <p>Choose your perfect look</p>
                    </div>

                    <span class="filter-count">
                        ${this.filters.length} EFFECTS
                    </span>
                </div>

                <div class="filter-search">
                    <span>⌕</span>

                    <input
                        type="text"
                        id="filterSearch"
                        placeholder="Search filters..."
                        autocomplete="off"
                    >
                </div>

                <div class="filter-categories">

                    <button class="filter-category active" data-category="all">
                        All Effects
                    </button>

                    <button class="filter-category" data-category="cute">
                        💖 Cute
                    </button>

                    <button class="filter-category" data-category="funny">
                        😂 Funny
                    </button>

                    <button class="filter-category" data-category="fantasy">
                        🪄 Fantasy
                    </button>

                    <button class="filter-category" data-category="effects">
                        ⚡ Effects
                    </button>

                </div>

                <div class="filter-grid" id="filterGrid"></div>

                <div class="filter-empty" id="filterEmpty">
                    No matching effects found.
                </div>

                <div class="selected-filter-info">

                    <div class="selected-filter-icon" id="selectedFilterEmoji">
                        🚫
                    </div>

                    <div class="selected-filter-text">
                        <strong id="selectedFilterName">No Filter</strong>
                        <small id="selectedFilterType">Original camera view</small>
                    </div>

                    <span class="filter-live-indicator">
                        ● LIVE
                    </span>

                </div>

                <div class="filter-intensity">

                    <div class="filter-intensity-header">
                        <span>Effect Intensity</span>
                        <strong id="filterIntensityValue">85%</strong>
                    </div>

                    <input
                        type="range"
                        id="filterIntensity"
                        min="0"
                        max="100"
                        value="85"
                    >

                </div>

            </div>
        `;

        this.renderFilters();

    }

    renderFilters() {

        const grid = document.getElementById("filterGrid");
        const search = document.getElementById("filterSearch").value.toLowerCase();

        const visibleFilters = this.filters.filter(filter => {

            const matchesCategory =
                this.activeCategory === "all" ||
                filter.category === this.activeCategory;

            const matchesSearch =
                filter.name.toLowerCase().includes(search) ||
                filter.type.toLowerCase().includes(search);

            return matchesCategory && matchesSearch;

        });

        grid.innerHTML = visibleFilters.map(filter => `

            <button
                class="filter-card ${this.activeFilter === filter.id ? "active" : ""}"
                data-filter="${filter.id}"
                type="button"
                aria-label="Select ${filter.name}"
                aria-pressed="${this.activeFilter === filter.id}"
            >

                <div class="filter-preview">
                    ${filter.emoji}
                </div>

                <span class="filter-name">
                    ${filter.name}
                </span>

                <span class="filter-type">
                    ${filter.type}
                </span>

            </button>

        `).join("");

        document.getElementById("filterEmpty")
            .classList.toggle("visible", visibleFilters.length === 0);

    }

    selectFilter(id) {

        const filter = this.filters.find(item => item.id === id);

        if (!filter) return;

        this.activeFilter = id;

        if (window.FaceFXAR) {
            window.FaceFXAR.setFilter(id);
        }

        document.getElementById("selectedFilterEmoji").textContent =
            filter.emoji;

        document.getElementById("selectedFilterName").textContent =
            filter.name;

        document.getElementById("selectedFilterType").textContent =
            filter.type;

        this.renderFilters();

        console.log("FaceFX selected:", filter.name);

    }

    setupEvents() {

        this.gallery.addEventListener("click", event => {

            const filterCard = event.target.closest("[data-filter]");

            if (filterCard) {
                this.selectFilter(filterCard.dataset.filter);
                return;
            }

            const categoryButton = event.target.closest("[data-category]");

            if (categoryButton) {

                this.activeCategory = categoryButton.dataset.category;

                this.gallery.querySelectorAll(".filter-category")
                    .forEach(button => {
                        button.classList.toggle(
                            "active",
                            button === categoryButton
                        );
                    });

                this.renderFilters();

            }

        });

        this.gallery.addEventListener("input", event => {

            if (event.target.id === "filterSearch") {
                this.renderFilters();
            }

            if (event.target.id === "filterIntensity") {

                const value = Number(event.target.value);

                document.getElementById("filterIntensityValue")
                    .textContent = `${value}%`;

                if (window.FaceFXAR) {
                    window.FaceFXAR.setIntensity(value / 100);
                }

            }

        });

    }

}

window.FaceFXFilterGallery = new FaceFXFilterGallery();