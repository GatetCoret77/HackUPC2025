document.addEventListener('DOMContentLoaded', () => {

    // --- Selecciones de Elementos ---
    const hotspots = document.querySelectorAll('.hotspot');
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');
    const BACKEND_URL = 'http://127.0.0.1:5000/ask'; // URL of your Python backend

    // --- Frases aleatorias si se hace clic en el gato ---
    const catClickPhrases = [
        "¿En qué puedo ayudarte con el Tavascan?",
        "¡Miau! Pregúntame sobre el manual.",
        "Puedo intentar buscar información en el manual...",
        "Escribe tu pregunta y pulsa Enviar.",
        "Miau."
    ];

    // --- Funciones ---

    // Función para mostrar el popup
    function showPopup(title, info) {
        popupTitle.textContent = title;
        popupInfo.textContent = info; // Display the raw text
        popup.classList.remove('hidden');
    }

    // Función para ocultar el popup
    function hidePopup() {
        popup.classList.add('hidden');
    }

    // Función para procesar la pregunta via Backend
    async function processQuestion() {
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

    // --- Event Listeners ---

    // Clic en Hotspots (Shows a generic message)
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            showPopup(hotspot.dataset.title, "Puedes preguntarme sobre esto escribiendo en la caja de chat. Miau.");
        });
    });

    // Clic en Botón de Cerrar Popup
    closeButton.addEventListener('click', hidePopup);

    // Clic en la Imagen del Gato (muestra frase aleatoria simple)
    catHelperImage.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
        showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
    });

    // Clic en el Botón "Enviar"
    askCatButton.addEventListener('click', processQuestion);

    // Presionar Enter en el campo de input
    catQuestionInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita el comportamiento por defecto (si lo hubiera)
            processQuestion();
        }
    });

    // Opcional: Cerrar popup al hacer clic fuera del contenido
    popup.addEventListener('click', (event) => {
         // Verifica que el clic fue directamente en el fondo del popup, no en sus hijos (título, p, botón)
         if (event.target === popup) {
              hidePopup();
         }
     });

});