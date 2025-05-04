document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM ELEMENT SELECTIONS ---
    // Header
    const headerContainer = document.querySelector('.header-container');

    // Intro Elements
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const exploreButton = document.getElementById('start-button-left');
    const skipIntroButton = document.getElementById('skip-intro-button');
    const skipControlsContainer = document.getElementById('skip-controls-container');

    // Main Content & View Containers/Elements
    const mainContent = document.getElementById('main-content');
    const exteriorView = document.getElementById('exterior-view');
    const interiorView = document.getElementById('interior-view');
    const exteriorVideo = document.getElementById('exterior-video');
    const interiorVideo = document.getElementById('interior-video');
    // Note: Images (#exterior-image, #interior-image) don't need specific JS selection for now

    // Header buttons (will be selected/assigned when created)
    let exteriorButton = null;
    let interiorButton = null;

    // Cat Helper Elements
    const catHelperContainer = document.getElementById('cat-helper-container'); // Select the cat container
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');

    // Popup Elements
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');

    // Hotspots (Specifically target interior ones for now)
    const interiorHotspots = document.querySelectorAll('#interior-interactive-area .hotspot');
    // const exteriorHotspots = document.querySelectorAll('#exterior-interactive-area .hotspot'); // Add later if needed

    // --- 2. CONFIGURATION & LOCAL DATA ---
    const BACKEND_URL = 'http://localhost:3000/ask-ollama'; // Replace if needed

    // Load Hotspot Data (Only for Interior currently)
    const hotspotData = {};
    if (interiorHotspots) {
        interiorHotspots.forEach(hotspot => {
            const id = hotspot.id || hotspot.dataset.title;
            if (id) {
                 hotspotData[id] = {
                    title: hotspot.dataset.title || "Info",
                    info: hotspot.dataset.info || "No details available."
                };
            } else {
                console.warn("Interior hotspot found without id or data-title:", hotspot);
            }
        });
    } else {
        console.warn("No interior hotspots found.");
    }
    // Add loading for exterior hotspots here if they exist

    // Basic chat responses
    const basicResponses = {
        'hola': "¡Miau! Hola. ¿En qué puedo ayudarte con el coche?",
        'adios': "¡Miau! Hasta luego.",
        'gracias': "¡De nada! Siempre es un placer ayudar. Miau.",
        'ayuda': "Puedes preguntarme sobre partes del coche o hacer clic en los puntos naranjas (si los ves). También respondo a 'hola', 'gracias', etc. Miau!",
        'como estas': "¡Genial! Listo para ayudarte con el Tavascan. Miau.",
        'que haces': "Estoy aquí para responder tus preguntas sobre el coche. Miau!",
        'miau': "¡Miau! ¿Necesitas algo?"
    };
    const catClickPhrases = [
        "¿En qué puedo ayudarte?",
        "¡Hey! ¿Qué tal?",
        "Pregúntame algo sobre el coche...",
        "Miau. ¿Explorando el Tavascan?",
        "Haz clic en los puntos naranjas para info rápida (en la vista interior).",
        "Miau."
    ];

    // --- 3. FUNCTIONS ---

    // --- View Switching Function ---
    function showView(viewIdToShow) {
        console.log(`Switching view to: ${viewIdToShow}`);
        const views = [exteriorView, interiorView];
        let buttonToActivate = null;

        views.forEach(view => {
            if (!view) { // Safety check
                console.warn(`View element is missing in the views array.`);
                return;
            }
            const isActive = view.id === viewIdToShow;
            view.classList.toggle('hidden', !isActive); // Hide if not active, show if active

            // Handle Video Playback
            let videoElement = null;
            if (view.id === 'exterior-view') {
                videoElement = exteriorVideo;
                if (isActive) buttonToActivate = exteriorButton;
            } else if (view.id === 'interior-view') {
                videoElement = interiorVideo;
                if (isActive) buttonToActivate = interiorButton;
            }

            if (videoElement) {
                if (isActive && videoElement.paused) {
                    videoElement.play().catch(e => console.warn(`${view.id} video play failed:`, e));
                } else if (!isActive && !videoElement.paused) {
                    videoElement.pause();
                }
            }
        });

        // Update header button active state
        if (exteriorButton) exteriorButton.classList.remove('active-view');
        if (interiorButton) interiorButton.classList.remove('active-view');
        if (buttonToActivate) {
            buttonToActivate.classList.add('active-view');
        } else {
             console.warn(`Could not find button to activate for view: ${viewIdToShow}`);
        }
    }

    // --- Intro Transition Functions ---
    function transitionToPostIntro() {
        const isMainContentVisible = mainContent && !mainContent.classList.contains('hidden');
        if ((postIntroScreen && !postIntroScreen.classList.contains('hidden')) || isMainContentVisible) return; // Already transitioned
        console.log("Transitioning to post-intro screen...");
        if (introVideo) introVideo.pause();
        if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
        if (postIntroScreen) postIntroScreen.classList.remove('hidden');
    }

    function showMainContent() {
        console.log("Showing main content...");

        // Add Header Buttons if they don't exist
        if (headerContainer && !headerContainer.querySelector('.header-nav-buttons')) {
            console.log("Adding header navigation buttons...");
            const navButtonsContainer = document.createElement('div');
            navButtonsContainer.className = 'header-nav-buttons';

            // Create Exterior Button
            exteriorButton = document.createElement('button'); // Assign to variable
            exteriorButton.className = 'header-nav-button'; // Initial state set by showView
            exteriorButton.textContent = 'Exterior';
            exteriorButton.addEventListener('click', () => showView('exterior-view')); // Add listener

            // Create Interior Button
            interiorButton = document.createElement('button'); // Assign to variable
            interiorButton.className = 'header-nav-button'; // Initial state set by showView
            interiorButton.textContent = 'Interior';
            interiorButton.addEventListener('click', () => showView('interior-view')); // Add listener

            navButtonsContainer.appendChild(exteriorButton);
            navButtonsContainer.appendChild(interiorButton);
            headerContainer.appendChild(navButtonsContainer);
        } else {
            // If buttons exist, ensure variables are assigned (e.g., on page refresh if state persists)
            if(!exteriorButton) exteriorButton = headerContainer.querySelector('.header-nav-button:nth-child(1)');
            if(!interiorButton) interiorButton = headerContainer.querySelector('.header-nav-button:nth-child(2)');
            // Ensure listeners are attached if needed (might be redundant but safe)
            if(exteriorButton && !exteriorButton.onclick) exteriorButton.addEventListener('click', () => showView('exterior-view'));
            if(interiorButton && !interiorButton.onclick) interiorButton.addEventListener('click', () => showView('interior-view'));
        }

        // Hide intro/post-intro screens
        if (postIntroScreen) postIntroScreen.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden');

        // Show main content wrapper
        if (mainContent) mainContent.classList.remove('hidden');

        // *** Show the Cat Helper ***
        if (catHelperContainer) {
            catHelperContainer.classList.remove('hidden');
        } else {
            console.warn("Cat helper container not found.");
        }

        // *** Set the INITIAL view ***
        showView('exterior-view'); // Start with Exterior view

        // Enable body scrolling
        document.body.style.overflow = 'auto';
    }

    // --- Popup Functions ---
    function showPopup(title, info) {
        if (!popup || !popupTitle || !popupInfo) return;
        popupTitle.textContent = title;
        popupInfo.textContent = info;
        popupInfo.classList.remove('loading');
        popup.classList.remove('hidden');
    }
    function hidePopup() {
        if (!popup) return;
        popup.classList.add('hidden');
    }

    // --- Backend Interaction Function ---
    async function processQuestion() {
        if (!catQuestionInput || !askCatButton || !popup) return;
        const question = catQuestionInput.value.trim();
        if (!question) return;
        catQuestionInput.value = ''; // Clear input immediately

        const lowerQ = question.toLowerCase();
        // Check basic local responses
        for (const keyword in basicResponses) {
             if (lowerQ === keyword || lowerQ.includes(keyword)) { // Simple check
                showPopup("Gato Ayudante", basicResponses[keyword]);
                catQuestionInput.focus();
                return;
            }
        }

        // Send to backend
        showPopup("Gato Ayudante", "Miau... Pensando...");
        if (popupInfo) popupInfo.classList.add('loading');
        askCatButton.disabled = true; catQuestionInput.disabled = true;

        try {
            console.log(`Sending to backend (${BACKEND_URL}): ${question}`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question }),
            });

            if (!response.ok) { /* ... error handling ... */
                 let errorMsg = `Miau! Error ${response.status}. Hubo un problema al conectar.`;
                 try { const errorData = await response.json(); errorMsg = errorData.error || errorData.answer || errorMsg; console.error("Backend error:", errorData); } catch (e) { /* Ignore parsing error */ }
                 throw new Error(errorMsg);
            }
            const data = await response.json();
            showPopup("Gato Ayudante", data.answer || "Miau... No entendí eso.");
        } catch (error) {
            console.error('Error asking cat:', error);
            showPopup("Error", error.message || "Miau! No puedo responder ahora mismo.");
        } finally {
            askCatButton.disabled = false; catQuestionInput.disabled = false;
            if (popupInfo) popupInfo.classList.remove('loading');
            catQuestionInput.focus();
        }
    }

    // --- 4. EVENT LISTENERS ---

    // Intro Listeners
    if (introVideo) {
        introVideo.addEventListener('ended', transitionToPostIntro);
        introVideo.addEventListener('error', (e) => {
            console.error("Intro video error:", e);
            transitionToPostIntro(); // Go to post-intro on error
        });
    } else { // No intro video element found
         console.warn("Intro video element not found. Skipping to main content.");
         showMainContent();
         if (introContainer) introContainer.classList.add('hidden');
         if (postIntroScreen) postIntroScreen.classList.add('hidden');
         if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
    }
    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }
    document.addEventListener('keydown', (event) => { // Skip with Enter key
        const isIntroPhaseActive = skipControlsContainer && !skipControlsContainer.classList.contains('hidden');
        const isPostIntroVisible = postIntroScreen && !postIntroScreen.classList.contains('hidden');
        if (event.code === 'Enter' && isIntroPhaseActive && !isPostIntroVisible) {
            event.preventDefault(); transitionToPostIntro();
        }
    });
    if (exploreButton) {
        exploreButton.addEventListener('click', showMainContent);
    } else {
        console.warn("Explore button not found.");
    }

    // Main Interaction Listeners

    // Interior Hotspot Clicks
    if (interiorHotspots) {
        interiorHotspots.forEach(hotspot => {
            hotspot.addEventListener('click', () => {
                const id = hotspot.id || hotspot.dataset.title;
                const data = hotspotData[id];
                if (data) {
                    showPopup(data.title, data.info);
                } else {
                    showPopup(hotspot.dataset.title || "Info", "Details not found.");
                    console.warn("Could not find stored data for interior hotspot:", hotspot);
                }
            });
        });
    }
    // Add listeners for exterior hotspots here if created

    // Popup Close Button
    if (closeButton) {
        closeButton.addEventListener('click', hidePopup);
    }

    // Cat Image Click
    if (catHelperImage) {
        catHelperImage.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
            showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
        });
    }

    // Ask Button Click
    if (askCatButton) {
        askCatButton.addEventListener('click', processQuestion);
    }

    // Enter Key in Input Field
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); processQuestion();
            }
        });
    }

    // Click Outside Popup to Close
    document.addEventListener('click', (event) => {
        if (popup && !popup.classList.contains('hidden')) {
            const isClickInsidePopup = popup.contains(event.target);
            const isClickOnCat = catHelperImage && catHelperImage.contains(event.target);
            const isClickOnHotspot = event.target.closest('.hotspot'); // Check if click is on hotspot or child
            if (!isClickInsidePopup && !isClickOnCat && !isClickOnHotspot) {
                hidePopup();
            }
        }
    });

    // --- 5. Initialisation (No extra styling needed via JS) ---
    // Style for close button X is now in CSS

}); // End of DOMContentLoaded