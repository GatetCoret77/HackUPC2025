// FINAL COMBINED AND CORRECTED SCRIPT for the provided HTML structure

document.addEventListener('DOMContentLoaded', () => {

    // --- *** MERGED CODE *** ---

    // --- 1. DOM ELEMENT SELECTIONS (Combined & Declared Once) ---
    // Intro Elements
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const enterButton = document.getElementById('enter-button');
    const skipIntroButton = document.getElementById('skip-intro-button'); // Needed for click listener
    const skipControlsContainer = document.getElementById('skip-controls-container'); // **** Added for container logic ****
    const mainContent = document.getElementById('main-content');

    // Main Interaction Elements (Cat, Popup, Hotspots)
    const hotspots = document.querySelectorAll('.hotspot'); // Use querySelectorAll
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');
    const catContainer = document.getElementById('cat-helper-container'); // Potentially used by logic

    // --- 2. CONFIGURATION & LOCAL DATA ---

    // !!! IMPORTANT: Choose the correct Backend URL for your setup !!!
    // const BACKEND_URL = 'http://127.0.0.1:5000/ask'; // Example 1
    const BACKEND_URL = 'http://localhost:3000/ask-ollama'; // Example 2 (Using this one based on your second code block)

    // Store hotspot info locally
    const hotspotData = {};
    if (hotspots) {
        hotspots.forEach(hotspot => {
            const id = hotspot.id || hotspot.dataset.title;
            if (id) {
                 hotspotData[id] = {
                    title: hotspot.dataset.title || "Info",
                    info: hotspot.dataset.info || "No details available."
                };
            } else {
                console.warn("Hotspot found without id or data-title, cannot store data:", hotspot);
            }
        });
    }

    // Basic local responses
    const basicResponses = {
        'hola': "¡Miau! Hola. ¿En qué puedo ayudarte con el coche?",
        'adios': "¡Miau! Hasta luego.",
        'gracias': "¡De nada! Siempre es un placer ayudar. Miau.",
        'ayuda': "Puedes preguntarme sobre el coche (volante, pantalla, etc.) o hacer clic en los puntos naranjas. También respondo a 'hola', 'gracias', etc. Miau!",
        'como estas': "¡Genial! Listo para ayudarte con el coche. Miau.",
        'que haces': "Estoy consultando mi información para ayudarte. Pregúntame algo. Miau!",
        'miau': "¡Miau! ¿Decías?"
    };

    // Random phrases for clicking the cat
    const catClickPhrases = [
        "¿En qué puedo ayudarte?",
        "¡Hey! ¿Qué tal?",
        "Pregúntame algo sobre el coche...",
        "Haz clic en los puntos naranjas para info rápida.",
        "Miau."
    ];


    // --- 3. FUNCTIONS ---

    // --- Intro Transition Functions ---
    function transitionToPostIntro() {
        // Check if already transitioned
        if (postIntroScreen && !postIntroScreen.classList.contains('hidden')) {
             console.log("Transition to post-intro already happened.");
             return;
        }
        console.log("Transitioning to post-intro screen...");

        if (introVideo) introVideo.pause();
        // Hide the entire skip controls container (button + hint)
        if (skipControlsContainer) skipControlsContainer.classList.add('hidden'); // **** CORRECTED ****
        if (postIntroScreen) postIntroScreen.classList.remove('hidden');
        // Do NOT hide introContainer here initially, it acts as background
    }

    function showMainContent() {
        console.log("Showing main content...");
        if (postIntroScreen) postIntroScreen.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden'); // Hide video bg NOW
        if (mainContent) mainContent.classList.remove('hidden');
        document.body.style.overflow = 'auto'; // Enable scrolling
    }

    // --- Popup Functions ---
    function showPopup(title, info) {
        if (!popup || !popupTitle || !popupInfo) return;
        popupTitle.textContent = title;
        popupInfo.textContent = info;
        popupInfo.classList.remove('loading'); // Ensure loading state is cleared
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

        const lowerQ = question.toLowerCase();
        let handledLocally = false;

        // 1. Check for basic local responses first
        for (const keyword in basicResponses) {
             if (lowerQ === keyword || lowerQ.startsWith(keyword + ' ') || lowerQ.endsWith(' ' + keyword) || lowerQ.includes(' ' + keyword + ' ')) {
                showPopup("Gato Ayudante", basicResponses[keyword]);
                handledLocally = true;
                break;
            }
        }

        if (handledLocally) {
            catQuestionInput.value = '';
            catQuestionInput.focus();
            return; // Don't proceed to backend
        }

        // 2. If not basic, send to backend
        showPopup("Gato Ayudante", "Miau... Pensando...");
        if (popupInfo) popupInfo.classList.add('loading');
        askCatButton.disabled = true;
        catQuestionInput.disabled = true;

        try {
            console.log(`Sending to backend (${BACKEND_URL}): ${question}`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ question: question }),
            });

            if (!response.ok) {
                let errorMsg = `Miau! Error ${response.status}. No pude conectar con mi cerebro...`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.answer || errorMsg;
                    console.error("Backend error response:", errorData);
                } catch (e) {
                     console.error("Could not parse error response from backend.");
                     const textError = await response.text().catch(() => "Could not read text response"); // Prevent double error
                     console.error("Backend error response (text):", textError);
                     errorMsg += ` Server response: ${response.statusText || 'Unknown'}`;
                }
                 if (response.status === 404) errorMsg += " Endpoint no encontrado.";
                 if (response.status === 500) errorMsg += " Problema interno del servidor.";
                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log(`Received from backend:`, data);
            showPopup("Gato Ayudante", data.answer || "Miau... No recibí una respuesta clara.");

        } catch (error) {
            console.error('Error asking cat:', error);
            showPopup("Error", error.message || "Miau! Hubo un problema al procesar tu pregunta.");
        } finally {
            askCatButton.disabled = false;
            catQuestionInput.disabled = false;
            if (popupInfo) popupInfo.classList.remove('loading');
            catQuestionInput.value = '';
            catQuestionInput.focus();
        }
    }


    // --- 4. EVENT LISTENERS ---

    // --- Intro Event Listeners ---
    if (introVideo) {
        introVideo.addEventListener('ended', transitionToPostIntro);
        introVideo.addEventListener('error', (e) => {
            console.error("Error loading/playing intro video:", e);
            if (introContainer) introContainer.classList.add('hidden');
            // Hide skip controls container on error
            if (skipControlsContainer) skipControlsContainer.classList.add('hidden'); // **** CORRECTED ****
            if (postIntroScreen) {
                 postIntroScreen.style.backgroundColor = '#404042';
                 postIntroScreen.classList.remove('hidden');
            } else {
                 console.warn("Post-intro screen not found, showing main content directly on video error.");
                 showMainContent();
            }
        });
    } else {
         // If no intro video element exists at all, skip straight to main content
         console.warn("Intro video element not found. Skipping intro.");
         showMainContent();
         if (introContainer) introContainer.classList.add('hidden');
         if (postIntroScreen) postIntroScreen.classList.add('hidden');
         // Hide skip controls container if no video
         if (skipControlsContainer) skipControlsContainer.classList.add('hidden'); // **** CORRECTED ****
    }

    // Click listener is still on the BUTTON itself
    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }

    // Enter key listener (to skip intro)
    document.addEventListener('keydown', (event) => {
        // Check visibility of the CONTAINER
        const isIntroPhaseActive = skipControlsContainer && !skipControlsContainer.classList.contains('hidden'); // **** CORRECTED ****

        if (event.code === 'Enter' && isIntroPhaseActive) {
            event.preventDefault();
            console.log("Enter key pressed during intro - Skipping...");
            transitionToPostIntro();
        }
    });


    if (enterButton) { // The "Start" button on the post-intro screen
        enterButton.addEventListener('click', showMainContent);
    }

    // --- Main Interaction Event Listeners ---

    // Hotspot Clicks
    if (hotspots) {
        hotspots.forEach(hotspot => {
            hotspot.addEventListener('click', () => {
                 const id = hotspot.id || hotspot.dataset.title;
                const data = hotspotData[id];
                if (data) {
                    showPopup(data.title, data.info);
                } else {
                    showPopup(hotspot.dataset.title || "Info", "Details not found for this hotspot.");
                    console.warn("Could not find stored data for hotspot:", hotspot);
                }
            });
        });
    }

    // Popup Close Button Click
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

    // Enter Key in Input Field (for asking cat)
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                processQuestion();
            }
        });
    }

    // Click Outside Popup to Close
    // Note: This version doesn't use the document click listener from the very first script,
    // It uses the simpler version from the second script which only closes if the click is *directly* on the popup overlay.
    // Adjust if you need the more complex behavior of closing on any click outside popup *and* outside cat container.
    if (popup) {
        popup.addEventListener('click', (event) => {
            if (event.target === popup) {
                hidePopup();
            }
        });
    }


    // --- 5. STYLING (For Loading Indicator) ---
    const style = document.createElement('style');
    style.textContent = `
        #popup-info.loading::after {
            content: ' ';
            display: inline-block;
            width: 0.8em;
            height: 0.8em;
            border: 2px solid #ccc;
            border-radius: 50%;
            border-top-color: #333;
            animation: spin 1s linear infinite;
            margin-left: 8px;
            vertical-align: middle;
            box-sizing: border-box;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // --- END OF MERGED CODE ---

}); // End of DOMContentLoaded