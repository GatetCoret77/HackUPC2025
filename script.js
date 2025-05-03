// CONCATENATED CODE - READ COMMENTS ABOVE REGARDING CONFLICTS

document.addEventListener('DOMContentLoaded', () => {

    // --- INTRO VIDEO & SCREEN LOGIC (From First Code) ---
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const enterButton = document.getElementById('enter-button');
    const mainContent = document.getElementById('main-content');
    const skipIntroButton = document.getElementById('skip-intro-button'); // Get skip button

    // --- Function to transition from video to post-intro screen ---
    function transitionToPostIntro() {
        // Pause the video (important for skip)
        introVideo.pause();
        // Hide the skip button itself
        if (skipIntroButton) skipIntroButton.classList.add('hidden'); // Check if exists
        // Show the overlay screen (post-intro)
        if (postIntroScreen) postIntroScreen.classList.remove('hidden'); // Check if exists
        // DO NOT hide introContainer here, it serves as background
    }

    // --- Function to show the main application content ---
    function showMainContent() {
        if (postIntroScreen) postIntroScreen.classList.add('hidden'); // Check if exists
        if (introContainer) introContainer.classList.add('hidden'); // Hide video bg NOW
        if (mainContent) mainContent.classList.remove('hidden'); // Check if exists
        document.body.style.overflow = 'auto'; // Enable scrolling on main content
    }

    // --- Intro Event Listeners (Only add if elements exist) ---
    if (introVideo) {
        // Event: When the video ends NATURALLY
        introVideo.addEventListener('ended', transitionToPostIntro);

        // Opcional: If the video fails or cannot play
        introVideo.addEventListener('error', (e) => {
            console.error("Error loading/playing intro video:", e);
            // Hide video container and skip button on error
            if (introContainer) introContainer.classList.add('hidden');
            if (skipIntroButton) skipIntroButton.classList.add('hidden');
            // Show the post-intro screen directly with fallback background
            if (postIntroScreen) {
                 postIntroScreen.style.backgroundColor = '#404042'; // Ensure fallback bg
                 postIntroScreen.classList.remove('hidden');
            } else {
                 // Fallback if even post-intro is missing: show main content directly
                 console.warn("Post-intro screen not found, showing main content directly on video error.");
                 showMainContent();
            }
        });
    } else {
         console.warn("Intro video element not found. Skipping intro logic.");
         // If no video, assume we should show main content or post-intro directly
         // Depending on your desired flow without video, you might call:
         // showMainContent();
         // or remove 'hidden' from postIntroScreen if that's the next step.
         // For now, we'll assume main content should appear if intro fails completely.
         if (mainContent) mainContent.classList.remove('hidden');
         document.body.style.overflow = 'auto';
         if (introContainer) introContainer.classList.add('hidden');
         if (postIntroScreen) postIntroScreen.classList.add('hidden');
         if (skipIntroButton) skipIntroButton.classList.add('hidden');

    }

    if (skipIntroButton) {
        // Event: Clic on the "Skip Intro" button
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }

    if (enterButton) {
        // Event: Clic on the "Start" button (on post-intro screen)
        enterButton.addEventListener('click', showMainContent);
    }
    // --- FIN INTRO LOGIC ---


    // --- MERGED & REVISED CODE (Hotspots, Cat, Popup with Backend Logic from Second Code) ---

    // --- Selecciones de Elementos (Declared only ONCE) ---
    const hotspots = document.querySelectorAll('.hotspot');
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');
    const BACKEND_URL = 'http://127.0.0.1:5000/ask'; // URL of your Python backend (From Second Code)

    // --- Frases aleatorias si se hace clic en el gato (From Second Code) ---
    const catClickPhrases = [
        "¿En qué puedo ayudarte con el Tavascan?",
        "¡Miau! Pregúntame sobre el manual.",
        "Puedo intentar buscar información en el manual...",
        "Escribe tu pregunta y pulsa Enviar.",
        "Miau."
    ];

    // --- Funciones (Using versions from Second Code for Backend interaction) ---

    // Función para mostrar el popup
    function showPopup(title, info) {
        if (!popup || !popupTitle || !popupInfo) return; // Guard clause
        popupTitle.textContent = title;
        popupInfo.textContent = info; // Display the raw text
        popup.classList.remove('hidden');
    }

    // Función para ocultar el popup
    function hidePopup() {
        if (!popup) return; // Guard clause
        popup.classList.add('hidden');
    }

    // Función para procesar la pregunta via Backend (From Second Code)
    async function processQuestion() {
        if (!catQuestionInput || !askCatButton) return; // Guard clause

        const question = catQuestionInput.value.trim();
        if (!question) return; // No hacer nada si está vacío

        // Show loading state (updated message)
        showPopup("Tavascat Consultando...", "Buscando en el manual y pensando, miau...");
        askCatButton.disabled = true; // Disable button while processing
        catQuestionInput.disabled = true;

        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question }),
            });

            if (!response.ok) {
                // Try to get error message from backend if available
                let errorMsg = `Error del servidor: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.answer || errorMsg; // Use 'answer' field too for potential error messages from backend
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            showPopup("Tavascat Responde", data.answer); // Display backend's answer

        } catch (error) {
            console.error('Error:', error);
            showPopup("Error", `Miau! Hubo un problema: ${error.message}`);
        } finally {
            // Re-enable input/button
            askCatButton.disabled = false;
            catQuestionInput.disabled = false;
            catQuestionInput.value = ''; // Clear input after processing
            catQuestionInput.focus(); // Set focus back to input
        }
    }

    // --- Event Listeners (Using logic from Second Code where conflicts existed) ---

    // Clic en Hotspots (Shows a generic message - From Second Code)
    if (hotspots) {
        hotspots.forEach(hotspot => {
            hotspot.addEventListener('click', () => {
                // Check if data attributes exist before showing popup
                const title = hotspot.dataset.title || "Información";
                showPopup(title, "Puedes preguntarme sobre esto escribiendo en la caja de chat. Miau.");
            });
        });
    }

    // Clic en Botón de Cerrar Popup
    if (closeButton) {
        closeButton.addEventListener('click', hidePopup);
    }

    // Clic en la Imagen del Gato (muestra frase aleatoria simple - From Second Code)
    if (catHelperImage) {
        catHelperImage.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
            showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
        });
    }

    // Clic en el Botón "Enviar" (Calls backend processQuestion - From Second Code)
    if (askCatButton) {
        askCatButton.addEventListener('click', processQuestion);
    }

    // Presionar Enter en el campo de input (Calls backend processQuestion - From Second Code)
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evita el comportamiento por defecto (si lo hubiera)
                processQuestion();
            }
        });
    }

    // Opcional: Cerrar popup al hacer clic fuera del contenido (From Second Code)
    if (popup) {
        popup.addEventListener('click', (event) => {
            // Verifica que el clic fue directamente en el fondo del popup, no en sus hijos
            if (event.target === popup) {
                hidePopup();
            }
        });
    }

    // Listener from first code to close popup on outside click (might be redundant with the above)
    // Keeping it just in case, but might need review depending on exact HTML structure
    document.addEventListener('click', (event) => {
         const catContainer = document.getElementById('cat-helper-container');
         // Only hide if popup exists, is visible, wasn't clicked inside, and cat container exists and wasn't clicked inside
         if (popup && !popup.classList.contains('hidden') && !popup.contains(event.target) && catContainer && !catContainer.contains(event.target)) {
              // Also make sure the click wasn't on a hotspot itself
              let isHotspotClick = false;
              if (hotspots) {
                  hotspots.forEach(hs => {
                      if (hs.contains(event.target)) {
                          isHotspotClick = true;
                      }
                  });
              }
              if (!isHotspotClick) {
                  hidePopup();
              }
         }
     });

}); // Fin del DOMContentLoaded