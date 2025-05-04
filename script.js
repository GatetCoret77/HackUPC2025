document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM ELEMENT SELECTIONS ---
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

    // --- 2. STATE & CONFIGURATION ---
    const BACKEND_URL = 'http://localhost:3000/ask-ollama';
    let currentViewId = 'exterior-view';
    const basicResponses = { /* ... existing ... */ };
    const catClickPhrases = [ /* ... existing ... */ ];
    let isIntroSkippedOrEnded = false;
    let hasCatGreeted = false;

    // --- 3. FUNCTIONS ---

    // --- Frame Capture Function ---
    function captureAndSetBackground(videoElement, targetContainer) { /* ... existing ... */
        if (!videoElement || !targetContainer) return;
        if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) { console.warn("Video not ready."); return; }
        console.log("Capturing frame..."); const canvas = document.createElement('canvas'); canvas.width = videoElement.videoWidth; canvas.height = videoElement.videoHeight; const ctx = canvas.getContext('2d');
        try { ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height); const dataURL = canvas.toDataURL('image/jpeg', 0.8); targetContainer.style.backgroundImage = `url(${dataURL})`; console.log("Frame captured."); } catch (error) { console.error("Error capturing frame:", error); }
    }

    // --- View Switching Function ---
    function showView(viewIdToShow) { /* ... Keep existing showView function ... */
        console.log(`Switching view to: ${viewIdToShow}`); currentViewId = viewIdToShow; const views = [exteriorView, interiorView];
        views.forEach(view => { if (!view) return; const isActive = view.id === viewIdToShow; view.classList.toggle('hidden', !isActive); let videoElement = null; if (view.id === 'exterior-view') videoElement = exteriorVideo; else if (view.id === 'interior-view') videoElement = interiorVideo; if (videoElement) { if (isActive && videoElement.paused) videoElement.play().catch(e => console.warn(`${view.id} video play failed:`, e)); else if (!isActive && !videoElement.paused) videoElement.pause(); }});
        allHotspots.forEach(hotspot => { const isInExterior = hotspot.closest('#exterior-interactive-area'); const isInInterior = hotspot.closest('#interior-interactive-area'); let shouldBeVisible = false; if (viewIdToShow === 'exterior-view' && isInExterior) { shouldBeVisible = true; } else if (viewIdToShow === 'interior-view' && isInInterior) { shouldBeVisible = true; } hotspot.classList.toggle('hidden', !shouldBeVisible); });
        if (exteriorButton) exteriorButton.classList.remove('active-view'); if (interiorButton) interiorButton.classList.remove('active-view'); if (viewIdToShow === 'exterior-view') { if (interiorButton) interiorButton.classList.add('active-view'); } else if (viewIdToShow === 'interior-view') { if (exteriorButton) exteriorButton.classList.add('active-view'); }
    }

    // --- Intro Transition Functions ---
    function transitionToPostIntro() { /* ... Keep existing transitionToPostIntro function ... */
        const isPostIntroVisible = postIntroScreen && !postIntroScreen.classList.contains('hidden'); const isMainContentVisible = mainContent && !mainContent.classList.contains('hidden'); if (isPostIntroVisible || isMainContentVisible || isIntroSkippedOrEnded) return; console.log("Transitioning to post-intro..."); isIntroSkippedOrEnded = true; if (introVideo) { captureAndSetBackground(introVideo, introContainer); introVideo.pause(); introVideo.classList.add('capture-hidden'); } if (skipControlsContainer) skipControlsContainer.classList.add('hidden'); if (postIntroScreen) postIntroScreen.classList.remove('hidden');
    }

    // --- Function to create Header Buttons ---
    function createHeaderButtonsIfNotExists() { /* ... Keep existing createHeaderButtonsIfNotExists function ... */
        if (headerContainer && !headerNavButtonsContainer) { console.log("Adding header nav buttons..."); headerNavButtonsContainer = document.createElement('div'); headerNavButtonsContainer.className = 'header-nav-buttons'; headerNavButtonsContainer.id = 'header-nav'; exteriorButton = document.createElement('button'); exteriorButton.className = 'header-nav-button'; exteriorButton.textContent = 'Exterior'; exteriorButton.dataset.view = 'exterior-view'; exteriorButton.addEventListener('click', () => showView('exterior-view')); interiorButton = document.createElement('button'); interiorButton.className = 'header-nav-button'; interiorButton.textContent = 'Interior'; interiorButton.dataset.view = 'interior-view'; interiorButton.addEventListener('click', () => showView('interior-view')); headerNavButtonsContainer.appendChild(exteriorButton); headerNavButtonsContainer.appendChild(interiorButton); headerContainer.appendChild(headerNavButtonsContainer); }
    }

    // --- Function to Show Main Content ---
    function showMainContentAndInit() { /* ... Keep existing showMainContentAndInit (including initial greeting logic) ... */
        console.log("Showing main content and initializing..."); createHeaderButtonsIfNotExists(); if (postIntroScreen) postIntroScreen.classList.add('hidden'); if (introContainer) introContainer.classList.add('hidden'); if (headerElement) headerElement.classList.remove('hidden'); if (mainContent) mainContent.classList.remove('hidden');
        if (catHelperContainer) { catHelperContainer.classList.remove('hidden'); if (!hasCatGreeted) { setTimeout(() => { showPopup("TavasCAT", "Hi, I'm TavasCAT, your assistant and buddy. Feel free to ask me anything about your car!"); hasCatGreeted = true; }, 600); } } // Pass "TavasCAT" explicitly
        showView('exterior-view'); document.body.style.overflow = 'auto';
    }

    // --- Popup Functions ---
    // Sets H2 title based on first argument. Defaults to "TavasCAT" if title is null/falsy.
    function showPopup(title, info, isLoading = false) {
        if (!popup || !popupTitle || !popupInfo) return;

        // Determine the title to display
        let displayTitle = "TavasCAT"; // Default title
        if (title && title !== "Error") { // Use specific title if provided and not "Error"
             displayTitle = title;
        } else if (title === "Error") { // Use "Error" if specifically passed
             displayTitle = "Error";
        } // Otherwise, it remains "TavasCAT"

        popupTitle.textContent = displayTitle;

        // Set the info content directly
        popupInfo.textContent = info; // Use textContent, no HTML injection needed now

        popupInfo.classList.toggle('loading', isLoading); // Handle loading state
        popup.classList.remove('hidden');
    }

    function hidePopup() { /* ... Keep existing hidePopup function ... */
        if (!popup) return; popup.classList.add('hidden');
    }

    // --- Backend Interaction Function ---
    async function processQuestion() { /* ... Keep existing processQuestion function ... */
        if (!catQuestionInput || !askCatButton || !popup) return; const question = catQuestionInput.value.trim(); if (!question) return; const originalQuestion = question; catQuestionInput.value = ''; const lowerQ = question.toLowerCase();
        for (const keyword in basicResponses) { if (lowerQ === keyword || (basicResponses[keyword].length < 20 && lowerQ.includes(keyword))) { showPopup("TavasCAT", basicResponses[keyword]); catQuestionInput.focus(); return; } } // Explicitly TavasCAT
        showPopup("TavasCAT", "Miau... Pensando...", true); askCatButton.disabled = true; catQuestionInput.disabled = true; // Explicitly TavasCAT
        try {
            const response = await fetch(BACKEND_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: originalQuestion }), });
            if (!response.ok) { let errorMsg = `Miau! Error ${response.status}.`; try { const errorData = await response.json(); errorMsg = errorData.error || errorData.message || errorData.answer || errorMsg; console.error("Backend error:", errorData); } catch (e) { console.error("Parse error:", response.statusText); } throw new Error(errorMsg); }
            const data = await response.json();
            showPopup("TavasCAT", data.answer || "Miau... No recibí una respuesta clara."); // Explicitly TavasCAT
        } catch (error) { console.error('Error asking cat:', error); showPopup("Error", error.message || "Miau! No puedo responder ahora."); } // Keep "Error" title
        finally { askCatButton.disabled = false; catQuestionInput.disabled = false; catQuestionInput.focus(); }
    }


    // --- 4. EVENT LISTENERS ---
    // Intro Video / Skip / Explore ... (Keep existing)
    if (introVideo) { introVideo.addEventListener('ended', () => transitionToPostIntro()); introVideo.addEventListener('error', (e) => { console.error("Intro video error:", e); isIntroSkippedOrEnded = true; showMainContentAndInit(); }); } else { console.warn("Intro video element not found."); if (introContainer) introContainer.classList.add('hidden'); if (postIntroScreen) postIntroScreen.classList.add('hidden'); if (skipControlsContainer) skipControlsContainer.classList.add('hidden'); showMainContentAndInit(); } if (skipIntroButton) { skipIntroButton.addEventListener('click', transitionToPostIntro); } document.addEventListener('keydown', (event) => { const isIntroVideoVisible = introContainer && !introContainer.classList.contains('hidden') && !isIntroSkippedOrEnded; if (event.key === 'Enter' && isIntroVideoVisible) { event.preventDefault(); transitionToPostIntro(); } }); if (exploreButton) { exploreButton.addEventListener('click', showMainContentAndInit); } else { console.warn("Explore button not found."); }

    // --- Hotspot Clicks listener ---
    allHotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            if (!hotspot.classList.contains('hidden')) {
                // Get the specific title FROM the hotspot
                const specificTitle = hotspot.dataset.title || "Information";
                const info = hotspot.dataset.info || "No details available.";
                // Pass the SPECIFIC title to showPopup
                showPopup(specificTitle, info);
            }
        });
    });

    // --- Popup Close Button ---
    if (closeButton) { closeButton.addEventListener('click', hidePopup); }

    // --- Cat Image Click listener ---
    if (catHelperImage) {
        catHelperImage.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
            // Pass "TavasCAT" explicitly as the title
            showPopup("TavasCAT", catClickPhrases[randomIndex] || "¡Meow!");
        });
    }

    // (Keep Ask Button, Input Keypress, Click Outside listeners)
    if (askCatButton) { askCatButton.addEventListener('click', processQuestion); }
    if (catQuestionInput) { catQuestionInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); processQuestion(); } }); }
    document.addEventListener('click', (event) => { if (popup && !popup.classList.contains('hidden')) { const isClickInsidePopup = popup.contains(event.target); const isClickOnTrigger = event.target.closest('.hotspot:not(.hidden)') || (catHelperImage && catHelperImage.contains(event.target)); if (!isClickInsidePopup && !isClickOnTrigger) { hidePopup(); } } });


    // --- 5. Initialisation ---
    // (Keep existing initialization logic)
    console.log("Initializing..."); if (postIntroScreen) postIntroScreen.classList.add('hidden'); if (mainContent) mainContent.classList.add('hidden'); if (headerElement) headerElement.classList.add('hidden'); if (catHelperContainer) catHelperContainer.classList.add('hidden'); if (popup) popup.classList.add('hidden'); [exteriorView, interiorView].forEach(view => { if (view) view.classList.add('hidden'); }); allHotspots.forEach(hotspot => hotspot.classList.add('hidden')); document.body.style.overflow = 'hidden'; console.log("Initialization complete.");

}); // End of DOMContentLoaded