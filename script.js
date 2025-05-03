document.addEventListener('DOMContentLoaded', () => {

    // --- *** MERGED CODE *** ---

    // --- 1. DOM ELEMENT SELECTIONS (Combined & Declared Once) ---
    // Intro Elements
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const enterButton = document.getElementById('enter-button');
    const skipIntroButton = document.getElementById('skip-intro-button');
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
    // const BACKEND_URL = 'http://127.0.0.1:5000/ask'; // From First Code
    const BACKEND_URL = 'http://localhost:3000/ask-ollama'; // From Second Code (using this one)

    // Store hotspot info locally (From Second Code)
    const hotspotData = {};
    if (hotspots) {
        hotspots.forEach(hotspot => {
            // Use hotspot.id or another unique identifier if available and preferred
            const id = hotspot.id || hotspot.dataset.title; // Fallback to title if no id
            if (id) {
                 hotspotData[id] = {
                    title: hotspot.dataset.title || "Info", // Default title
                    info: hotspot.dataset.info || "No details available." // Default info
                };
            } else {
                console.warn("Hotspot found without id or data-title, cannot store data:", hotspot);
            }
        });
    }

    // Basic local responses (From Second Code)
    const basicResponses = {
        'hola': "¡Miau! Hola. ¿En qué puedo ayudarte con el coche?",
        'adios': "¡Miau! Hasta luego.",
        'gracias': "¡De nada! Siempre es un placer ayudar. Miau.",
        'ayuda': "Puedes preguntarme sobre el coche (volante, pantalla, etc.) o hacer clic en los puntos naranjas. También respondo a 'hola', 'gracias', etc. Miau!",
        'como estas': "¡Genial! Listo para ayudarte con el coche. Miau.",
        'que haces': "Estoy consultando mi información para ayudarte. Pregúntame algo. Miau!",
        'miau': "¡Miau! ¿Decías?"
        // Add more simple keywords/responses here
    };

    // Random phrases for clicking the cat (From Second Code)
    const catClickPhrases = [
        "¿En qué puedo ayudarte?",
        "¡Hey! ¿Qué tal?",
        "Pregúntame algo sobre el coche...",
        "Haz clic en los puntos naranjas para info rápida.",
        "Miau."
    ];


    // --- 3. FUNCTIONS ---

    // --- Intro Transition Functions (From First Code, with checks) ---
    function transitionToPostIntro() {
        if (introVideo) introVideo.pause();
        if (skipIntroButton) skipIntroButton.classList.add('hidden');
        if (postIntroScreen) postIntroScreen.classList.remove('hidden');
        // Do NOT hide introContainer here initially, it acts as background
    }

    function showMainContent() {
        if (postIntroScreen) postIntroScreen.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden'); // Hide video bg NOW
        if (mainContent) mainContent.classList.remove('hidden');
        document.body.style.overflow = 'auto'; // Enable scrolling
    }

    // --- Popup Functions (From Second Code, handles loading class) ---
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

    // --- Backend Interaction Function (From Second Code - Ollama logic) ---
    async function processQuestion() {
        if (!catQuestionInput || !askCatButton || !popup) return; // Check required elements

        const question = catQuestionInput.value.trim();
        if (!question) return; // Do nothing if empty

        const lowerQ = question.toLowerCase();
        let handledLocally = false;

        // 1. Check for basic local responses first
        for (const keyword in basicResponses) {
            // Match if the question *is* the keyword, or starts/ends with it (basic check)
             if (lowerQ === keyword || lowerQ.startsWith(keyword + ' ') || lowerQ.endsWith(' ' + keyword) || lowerQ.includes(' ' + keyword + ' ')) {
                showPopup("Gato Ayudante", basicResponses[keyword]);
                handledLocally = true;
                break;
            }
        }

        if (handledLocally) {
            catQuestionInput.value = ''; // Clear input
            catQuestionInput.focus();
            return; // Don't proceed to backend
        }

        // 2. If not basic, send to backend
        showPopup("Gato Ayudante", "Miau... Pensando..."); // Show loading state
        if (popupInfo) popupInfo.classList.add('loading'); // Add visual indicator
        askCatButton.disabled = true;
        catQuestionInput.disabled = true;

        try {
            console.log(`Sending to backend (${BACKEND_URL}): ${question}`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question }),
            });

            // Improved error handling from backend response
            if (!response.ok) {
                let errorMsg = `Miau! Error ${response.status}. No pude conectar con mi cerebro...`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.answer || errorMsg; // Use backend message if available
                    console.error("Backend error response:", errorData);
                } catch (e) {
                     console.error("Could not parse error response from backend.");
                     // Optionally try to read response as text for debugging
                     const textError = await response.text();
                     console.error("Backend error response (text):", textError);
                     errorMsg += ` Server response: ${response.statusText || 'Unknown'}`;
                }
                 // Add a check for specific statuses if needed
                 if (response.status === 404) errorMsg += " Endpoint no encontrado.";
                 if (response.status === 500) errorMsg += " Problema interno del servidor.";

                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log(`Received from backend:`, data);
            showPopup("Gato Ayudante", data.answer || "Miau... No recibí una respuesta clara."); // Display backend's answer

        } catch (error) {
            console.error('Error asking cat:', error);
            // Show specific error message thrown or a generic one
            showPopup("Error", error.message || "Miau! Hubo un problema al procesar tu pregunta.");
        } finally {
            // Re-enable input/button and clear input
            askCatButton.disabled = false;
            catQuestionInput.disabled = false;
            if (popupInfo) popupInfo.classList.remove('loading'); // Remove visual indicator
            catQuestionInput.value = '';
            catQuestionInput.focus();
        }
    }


    // --- 4. EVENT LISTENERS ---

    // --- Intro Event Listeners (From First Code, with checks) ---
    if (introVideo) {
        introVideo.addEventListener('ended', transitionToPostIntro);
        introVideo.addEventListener('error', (e) => {
            console.error("Error loading/playing intro video:", e);
            // Fallback: Hide intro elements, try showing post-intro or main content
            if (introContainer) introContainer.classList.add('hidden');
            if (skipIntroButton) skipIntroButton.classList.add('hidden');
            if (postIntroScreen) {
                 postIntroScreen.style.backgroundColor = '#404042'; // Fallback background
                 postIntroScreen.classList.remove('hidden');
            } else {
                 console.warn("Post-intro screen not found, showing main content directly on video error.");
                 showMainContent(); // Show main content if post-intro also fails
            }
        });
    } else {
         // If no intro video element exists at all, skip straight to main content
         console.warn("Intro video element not found. Skipping intro.");
         showMainContent();
         // Ensure other intro elements are hidden if they somehow exist
         if (introContainer) introContainer.classList.add('hidden');
         if (postIntroScreen) postIntroScreen.classList.add('hidden');
         if (skipIntroButton) skipIntroButton.classList.add('hidden');
    }

    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }

    if (enterButton) {
        enterButton.addEventListener('click', showMainContent);
    }

    // --- Main Interaction Event Listeners (Using Logic from Second Code) ---

    // Hotspot Clicks (Show local data from hotspotData)
    if (hotspots) {
        hotspots.forEach(hotspot => {
            hotspot.addEventListener('click', () => {
                 const id = hotspot.id || hotspot.dataset.title; // Get the same ID used to store data
                const data = hotspotData[id];
                if (data) {
                    showPopup(data.title, data.info);
                } else {
                    // Fallback if data wasn't stored correctly
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

    // Cat Image Click (Show random phrase)
    if (catHelperImage) {
        catHelperImage.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
            showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
        });
    }

    // Ask Button Click (Process question via backend)
    if (askCatButton) {
        askCatButton.addEventListener('click', processQuestion);
    }

    // Enter Key in Input Field (Process question via backend)
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission (if applicable)
                processQuestion();
            }
        });
    }

    // Click Outside Popup to Close (Simpler version from Second Code)
    if (popup) {
        popup.addEventListener('click', (event) => {
            // Close only if the click is directly on the popup background (event.target)
            // not on its children (content area, title, close button etc.)
            if (event.target === popup) {
                hidePopup();
            }
        });
    }


    // --- 5. STYLING (For Loading Indicator - From Second Code) ---
    const style = document.createElement('style');
    style.textContent = `
        #popup-info.loading::after {
            content: ' ';
            display: inline-block;
            width: 0.8em; /* Adjusted size slightly */
            height: 0.8em; /* Adjusted size slightly */
            border: 2px solid #ccc;
            border-radius: 50%;
            border-top-color: #333; /* Spinner color */
            animation: spin 1s linear infinite;
            margin-left: 8px; /* Spacing */
            vertical-align: middle;
            box-sizing: border-box; /* Include border in size */
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // --- END OF MERGED CODE ---

}); // End of DOMContentLoaded