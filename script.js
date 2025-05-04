document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM ELEMENT SELECTIONS ---
    // (Keep all existing selections)
    const headerContainer = document.querySelector('.header-container');
    const headerElement = document.querySelector('.cupra-header');
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const exploreButton = document.getElementById('start-button-left');
    const skipIntroButton = document.getElementById('skip-intro-button');
    const skipControlsContainer = document.getElementById('skip-controls-container');
    const mainContent = document.getElementById('main-content');
    const exteriorView = document.getElementById('exterior-view');
    const interiorView = document.getElementById('interior-view');
    const exteriorVideo = document.getElementById('exterior-video');
    const interiorVideo = document.getElementById('interior-video');
    const interiorImage = document.getElementById('interior-image');
    let headerNavButtonsContainer = null;
    let exteriorButton = null;
    let interiorButton = null;
    const catHelperContainer = document.getElementById('cat-helper-container');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const allHotspots = document.querySelectorAll('.hotspot');
    const interiorHotspots = document.querySelectorAll('#interior-interactive-area .hotspot');

    // --- 2. STATE & CONFIGURATION ---
    // (Keep existing state and config)
    const BACKEND_URL = 'http://localhost:3000/ask-ollama';
    let currentViewId = 'exterior-view';
    let resizeTimer;
    const basicResponses = { /* ... */ };
    const catClickPhrases = [ /* ... */ ];
    let isIntroSkippedOrEnded = false; // Flag to prevent double processing

    // --- 3. FUNCTIONS ---

    // --- Frame Capture Function ---
    function captureAndSetBackground(videoElement, targetContainer) {
        if (!videoElement || !targetContainer) return;

        // Check if video has data and dimensions
        if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            console.warn("Video not ready for frame capture.");
            // Optionally set a fallback background color/image here if needed
            // targetContainer.style.backgroundImage = 'url(path/to/fallback.jpg)';
            return; // Exit if video isn't ready
        }

        console.log("Capturing video frame...");
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;   // Use video's natural dimensions
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        try {
            // Draw the current video frame onto the canvas
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Get the image data URL from the canvas
            const dataURL = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for smaller size, adjust quality (0.0-1.0)

            // Set the data URL as the background image of the target container
            targetContainer.style.backgroundImage = `url(${dataURL})`;
            console.log("Frame captured and set as background.");

        } catch (error) {
            console.error("Error capturing video frame:", error);
            // Handle potential errors (e.g., CORS issues if video is cross-origin)
            // Optionally set a fallback background here too
        }
    }


    // --- View Switching Function ---
    // (Keep existing showView function - no changes needed here)
        // --- View Switching Function ---
        function showView(viewIdToShow) {
            console.log(`Switching view to: ${viewIdToShow}`);
            currentViewId = viewIdToShow; // Still track the actual active view
    
            const views = [exteriorView, interiorView]; // Array of view elements
            // We will determine which button to highlight based on the *opposite* logic
    
            views.forEach(view => {
                if (!view) {
                    console.warn(`View element is missing.`);
                    return;
                }
                const isActive = view.id === viewIdToShow;
                view.classList.toggle('hidden', !isActive); // Hide if not active, show if active
    
                // Handle Video Playback and Hotspot Positioning (No changes needed here)
                let videoElement = null;
                if (view.id === 'exterior-view') {
                    videoElement = exteriorVideo;
                } else if (view.id === 'interior-view') {
                    videoElement = interiorVideo;
                    if (isActive) {
                        setTimeout(updateInteriorHotspotPositions, 50);
                    }
                }
                if (videoElement) {
                    if (isActive && videoElement.paused) {
                        videoElement.play().catch(e => console.warn(`${view.id} video play failed:`, e));
                    } else if (!isActive && !videoElement.paused) {
                        videoElement.pause();
                    }
                }
            });
    
            // --- MODIFIED: Update header button active state (REVERSED LOGIC) ---
            // 1. Remove active class from both buttons first to reset
            if (exteriorButton) exteriorButton.classList.remove('active-view');
            if (interiorButton) interiorButton.classList.remove('active-view');
    
            // 2. Add active class to the *opposite* button
            if (viewIdToShow === 'exterior-view') {
                // If Exterior view is shown, highlight the INTERIOR button
                if (interiorButton) {
                    interiorButton.classList.add('active-view');
                    console.log("Highlighting Interior button (Exterior view is active)");
                } else {
                     console.warn("Interior button not found, cannot apply swapped highlight.");
                }
            } else if (viewIdToShow === 'interior-view') {
                // If Interior view is shown, highlight the EXTERIOR button
                if (exteriorButton) {
                    exteriorButton.classList.add('active-view');
                    console.log("Highlighting Exterior button (Interior view is active)");
                } else {
                    console.warn("Exterior button not found, cannot apply swapped highlight.");
                }
            }
            // --- End Modified Button Logic ---
        }


    // --- Intro Transition Functions ---
    function transitionToPostIntro() {
        // Prevent running if already past intro or post-intro, or if already processed
        const isPostIntroVisible = postIntroScreen && !postIntroScreen.classList.contains('hidden');
        const isMainContentVisible = mainContent && !mainContent.classList.contains('hidden');
        if (isPostIntroVisible || isMainContentVisible || isIntroSkippedOrEnded) return;

        console.log("Transitioning to post-intro screen (keeping background)...");
        isIntroSkippedOrEnded = true; // Set flag

        if (introVideo) {
            // *** Capture the current frame ***
            captureAndSetBackground(introVideo, introContainer);
            introVideo.pause(); // Pause the video
            // *** Hide the video *element* using CSS class ***
            introVideo.classList.add('capture-hidden');
        }

        // Hide skip controls immediately
        if (skipControlsContainer) skipControlsContainer.classList.add('hidden');

        // Show post-intro screen overlay (will fade in due to its CSS transition)
        if (postIntroScreen) postIntroScreen.classList.remove('hidden');

        // *** NOTE: We DO NOT hide introContainer here. It stays as the background holder. ***
    }

    // --- Function to create Header Buttons (if they don't exist) ---
    // (Keep existing createHeaderButtonsIfNotExists function)
    function createHeaderButtonsIfNotExists() {
        if (headerContainer && !headerNavButtonsContainer) { // Only create if container doesn't exist
           console.log("Adding header navigation buttons...");
           headerNavButtonsContainer = document.createElement('div'); // Assign to variable
           headerNavButtonsContainer.className = 'header-nav-buttons';
           headerNavButtonsContainer.id = 'header-nav'; // Keep the ID from original HTML

           // Create Exterior Button
           exteriorButton = document.createElement('button');
           exteriorButton.className = 'header-nav-button';
           exteriorButton.textContent = 'Exterior';
           exteriorButton.dataset.view = 'exterior-view'; // Use view ID for data attribute
           exteriorButton.addEventListener('click', () => showView('exterior-view'));

           // Create Interior Button
           interiorButton = document.createElement('button');
           interiorButton.className = 'header-nav-button';
           interiorButton.textContent = 'Interior';
           interiorButton.dataset.view = 'interior-view'; // Use view ID for data attribute
           interiorButton.addEventListener('click', () => showView('interior-view'));

           headerNavButtonsContainer.appendChild(exteriorButton);
           headerNavButtonsContainer.appendChild(interiorButton);
           headerContainer.appendChild(headerNavButtonsContainer); // Append to the flex container inside header
       }
   }


    // --- Function to Show Main Content ---
    function showMainContentAndInit() {
        console.log("Showing main content and initializing...");

        // Ensure Header Buttons Exist
        createHeaderButtonsIfNotExists();

        // Hide post-intro screen
        if (postIntroScreen) postIntroScreen.classList.add('hidden');

        // *** Hide the entire intro container (with its background image) ***
        if (introContainer) introContainer.classList.add('hidden');

        // Show Header, Main Content, Cat Helper
        if (headerElement) headerElement.classList.remove('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        if (catHelperContainer) catHelperContainer.classList.remove('hidden');

        // Set the INITIAL view and update buttons
        showView('exterior-view'); // Start with Exterior view

        // Enable body scrolling
        document.body.style.overflow = 'auto';
    }

    // --- Popup Functions ---
    // (Keep existing showPopup and hidePopup functions)
    function showPopup(title, info, isLoading = false) {
        if (!popup || !popupTitle || !popupInfo) return;
        popupTitle.textContent = title;
        popupInfo.textContent = info;
        popupInfo.classList.toggle('loading', isLoading); // Add/remove loading class based on parameter
        popup.classList.remove('hidden');
    }
    function hidePopup() {
        if (!popup) return;
        popup.classList.add('hidden');
    }


    // --- Backend Interaction Function ---
    // (Keep existing processQuestion function)
    async function processQuestion() {
        if (!catQuestionInput || !askCatButton || !popup) return;
        const question = catQuestionInput.value.trim();
        if (!question) return;
        const originalQuestion = question; // Keep original case for backend if needed
        catQuestionInput.value = ''; // Clear input immediately

        const lowerQ = question.toLowerCase();
        // 1. Check basic local responses first
        for (const keyword in basicResponses) {
             // Use simple includes or specific matching as needed
             if (lowerQ === keyword || (basicResponses[keyword].length < 20 && lowerQ.includes(keyword))) {
                showPopup("Gato Ayudante", basicResponses[keyword]);
                catQuestionInput.focus();
                return; // Stop processing if local match found
            }
        }

        // 2. If no local match, send to backend
        showPopup("Gato Ayudante", "Miau... Pensando...", true); // Show loading state
        askCatButton.disabled = true;
        catQuestionInput.disabled = true;

        try {
            console.log(`Sending to backend (${BACKEND_URL}): ${originalQuestion}`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: originalQuestion }), // Send original question
            });

            // Improved Error Handling
            if (!response.ok) {
                 let errorMsg = `Miau! Error ${response.status}. Hubo un problema al conectar.`;
                 try {
                     const errorData = await response.json();
                     // Try to get a meaningful error message from backend response
                     errorMsg = errorData.error || errorData.message || errorData.answer || errorMsg;
                     console.error("Backend error response:", errorData);
                 } catch (e) {
                      console.error("Could not parse error response body:", response.statusText);
                 }
                 throw new Error(errorMsg); // Throw an error with the message
            }

            const data = await response.json();
            console.log("Backend response data:", data);
            // Use the 'answer' field from the backend response
            showPopup("Gato Ayudante", data.answer || "Miau... No recibí una respuesta clara.");

        } catch (error) {
            console.error('Error asking cat:', error);
            // Display the error message caught (either from fetch or !response.ok)
            showPopup("Error", error.message || "Miau! No puedo responder ahora mismo.");
        } finally {
            // Re-enable input/button regardless of success or failure
            askCatButton.disabled = false;
            catQuestionInput.disabled = false;
            // No need to remove loading class here, showPopup does it when not loading
            catQuestionInput.focus();
        }
    }


    // --- Interior Hotspot Positioning ---
    // (Keep existing updateInteriorHotspotPositions function)
    function updateInteriorHotspotPositions() {
        // Only update if the interior view is visible and the image exists
        if (!interiorImage || interiorView.classList.contains('hidden')) {
            return;
        }

        const imageWidth = interiorImage.offsetWidth;
        const imageHeight = interiorImage.offsetHeight;

        if (imageWidth === 0 || imageHeight === 0) {
            // console.warn("Interior image dimensions zero, cannot place hotspots yet.");
            return; // Image might not be ready
        }

        interiorHotspots.forEach(hotspot => {
            const relX = parseFloat(hotspot.dataset.relX);
            const relY = parseFloat(hotspot.dataset.relY);
            const hotspotWidth = hotspot.offsetWidth; // Get current hotspot size
            const hotspotHeight = hotspot.offsetHeight;

            if (!isNaN(relX) && !isNaN(relY)) {
                // Calculate position for the *center* of the hotspot
                const targetX = (imageWidth * relX) - (hotspotWidth / 2);
                const targetY = (imageHeight * relY) - (hotspotHeight / 2);

                // Apply positions as inline styles (in pixels)
                hotspot.style.left = `${targetX}px`;
                hotspot.style.top = `${targetY}px`;
            } else {
                // Don't warn for exterior hotspots if they are included in the querySelector accidentally
                if (hotspot.closest('#interior-interactive-area')) {
                     console.warn(`Interior Hotspot ${hotspot.id || '(no id)'} missing or invalid data-rel-x/data-rel-y`);
                }
            }
        });
    }


    // Debounce function for resize events
    // (Keep existing debounce function)
    function debounce(func, delay) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(func, delay);
    }


    // --- 4. EVENT LISTENERS ---

    // Intro Video Listeners
    if (introVideo) {
        // *** Modify 'ended' listener to also capture frame ***
        introVideo.addEventListener('ended', () => {
             console.log("Intro video ended naturally.");
             transitionToPostIntro(); // Call the same transition logic
        });
        introVideo.addEventListener('error', (e) => {
            console.error("Intro video error:", e);
            isIntroSkippedOrEnded = true; // Prevent further processing on error
            // Decide fallback: Go straight to main content or show post-intro with black bg?
            // Option 1: Go straight to main content (simpler)
             showMainContentAndInit();
            // Option 2: Show post-intro without background capture (might look odd)
            // if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
            // if (postIntroScreen) postIntroScreen.classList.remove('hidden');
        });
    } else {
         console.warn("Intro video element (#intro-video) not found. Proceeding directly.");
         if (introContainer) introContainer.classList.add('hidden');
         if (postIntroScreen) postIntroScreen.classList.add('hidden');
         if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
         showMainContentAndInit();
    }

    // Skip Intro Button
    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }

    // Skip Intro with Enter Key
    document.addEventListener('keydown', (event) => {
        const isIntroVideoVisible = introContainer && !introContainer.classList.contains('hidden') && !isIntroSkippedOrEnded;
        if (event.key === 'Enter' && isIntroVideoVisible) {
            event.preventDefault();
            transitionToPostIntro();
        }
    });

    // Explore Button (Post-Intro Screen)
    if (exploreButton) {
        exploreButton.addEventListener('click', showMainContentAndInit);
    } else {
        console.warn("Explore button (#start-button-left) not found.");
    }

    // --- Main Interaction Listeners ---
    // (Keep existing listeners for hotspots, popup close, cat image, cat ask button, cat input keypress, click outside)
    // All Hotspot Clicks (Generic Popup Display)
    allHotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            // Extract title and info from data attributes
            const title = hotspot.dataset.title || "Information";
            const info = hotspot.dataset.info || "No details available for this point.";
            showPopup(title, info);
        });
    });

    // Popup Close Button
    if (closeButton) {
        closeButton.addEventListener('click', hidePopup);
    }

    // Cat Image Click - Show a random phrase
    if (catHelperImage) {
        catHelperImage.addEventListener('click', () => {
            if (catClickPhrases.length > 0) {
                const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
                showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
            } else {
                 showPopup("Gato Ayudante", "¡Miau! ¿Necesitas ayuda?");
            }
        });
    }

    // Cat Ask Button Click
    if (askCatButton) {
        askCatButton.addEventListener('click', processQuestion);
    }

    // Enter Key in Cat Input Field
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            // Use 'Enter' key, check if Shift/Ctrl/Alt are not pressed
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault(); // Prevent default form submission/newline
                processQuestion();
            }
        });
    }

    // Click Outside Popup to Close
    document.addEventListener('click', (event) => {
        // Check if popup exists and is currently visible
        if (popup && !popup.classList.contains('hidden')) {
            const isClickInsidePopup = popup.contains(event.target);
            // Check if click is NOT on the elements that should keep the popup open
            const isClickOnTrigger = event.target.closest('.hotspot') || (catHelperImage && catHelperImage.contains(event.target));

            if (!isClickInsidePopup && !isClickOnTrigger) {
                hidePopup();
            }
        }
    });


    // Window Resize Listener (for interior hotspots)
    window.addEventListener('resize', () => {
        debounce(updateInteriorHotspotPositions, 150);
        // *** If the captured background is visible, we might want to recapture on resize,
        // *** but that's complex as the video element is hidden.
        // *** For simplicity, the initial captured frame will stretch/crop on resize.
    });

    // --- 5. Initialisation ---
    console.log("Initializing...");
    // (Keep existing initialization logic)
    if (postIntroScreen) postIntroScreen.classList.add('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (headerElement) headerElement.classList.add('hidden');
    if (catHelperContainer) catHelperContainer.classList.add('hidden');
    if (popup) popup.classList.add('hidden');
    [exteriorView, interiorView].forEach(view => {
        if (view) view.classList.add('hidden');
    });
    document.body.style.overflow = 'hidden';

    console.log("Initialization complete. Waiting for intro video or user action.");

}); // End of DOMContentLoaded