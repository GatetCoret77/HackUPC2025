document.addEventListener('DOMContentLoaded', () => {

    // --- Selecciones de Elementos ---
    const hotspots = document.querySelectorAll('.hotspot');
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input'); // NUEVO
    const askCatButton = document.getElementById('ask-cat-button');       // NUEVO
    // const manualLink = document.getElementById('popup-manual-link');

    // --- Datos para la "IA" del Gato ---

    // 1. Palabras clave asociadas a los hotspots (ID -> [keywords])
    const hotspotKeywords = {
        'hotspot-volante': ['volante', 'dirección', 'girar', 'claxon', 'pito', 'botones volante', 'control crucero'],
        'hotspot-pantalla': ['pantalla', 'infoentretenimiento', 'navegador', 'gps', 'mapa', 'radio', 'musica', 'multimedia', 'bluetooth', 'conectar movil', 'apple carplay', 'android auto'],
        'hotspot-clima': ['clima', 'aire', 'acondicionado', 'calefaccion', 'temperatura', 'ventilador', 'frio', 'calor'],
        'hotspot-emergencia': ['emergencia', 'warning', 'peligro', 'intermitentes', 'luces emergencia', 'triangulo rojo']
        // Añade más IDs y keywords si tienes más hotspots
    };

    // 2. Respuestas básicas del gato (keyword -> response)
    const basicResponses = {
        'hola': "¡Miau! Hola. ¿Qué quieres saber sobre el coche?",
        'adios': "¡Miau! Hasta luego.",
        'gracias': "¡De nada! Siempre es un placer ayudar. Miau.",
        'ayuda': "Puedes preguntarme sobre partes como 'volante', 'pantalla', 'clima', 'luces de emergencia' o hacer clic en los puntos naranjas. También respondo a 'hola' y 'gracias'.",
        'como estas': "¡Genial! Listo para ayudarte con el coche. Miau.",
        'que haces': "Estoy aquí para darte información sobre este coche Cupra. Pregúntame algo.",
        'miau': "¡Miau! ¿Decías?"
        // Añade más interacciones básicas
    };

    // 3. Frases aleatorias si se hace clic en el gato (como antes)
    const catClickPhrases = [
        "¿En qué puedo ayudarte?",
        "¡Hey! ¿Qué tal?",
        "Pregúntame algo sobre el coche...",
        "Haz clic en los puntos naranjas para info rápida.",
        "Miau."
    ];

    // --- Funciones ---

    // Función para mostrar el popup (sin cambios internos)
    function showPopup(title, info) {
        popupTitle.textContent = title;
        popupInfo.textContent = info;
        popup.classList.remove('hidden');
        // Lógica del enlace al manual (si la hubiera)
    }

    // Función para ocultar el popup (sin cambios)
    function hidePopup() {
        popup.classList.add('hidden');
    }

    // NUEVO: Función para procesar la pregunta del usuario
    function processQuestion() {
        const question = catQuestionInput.value.trim().toLowerCase();
        if (!question) return; // No hacer nada si está vacío

        let foundResponse = false;

        // 1. Buscar keywords de hotspots
        for (const hotspotId in hotspotKeywords) {
            const keywords = hotspotKeywords[hotspotId];
            for (const keyword of keywords) {
                // Usamos includes() para buscar la palabra clave dentro de la pregunta
                if (question.includes(keyword)) {
                    const hotspotElement = document.getElementById(hotspotId);
                    if (hotspotElement) {
                        showPopup(hotspotElement.dataset.title, hotspotElement.dataset.info);
                        foundResponse = true;
                        break; // Salir del bucle de keywords para este hotspot
                    }
                }
            }
            if (foundResponse) break; // Salir del bucle de hotspots
        }

        // 2. Si no se encontró keyword de hotspot, buscar respuestas básicas
        if (!foundResponse) {
            for (const basicKeyword in basicResponses) {
                if (question.includes(basicKeyword)) {
                    showPopup("Gato Ayudante", basicResponses[basicKeyword]);
                    foundResponse = true;
                    break; // Salir del bucle de respuestas básicas
                }
            }
        }

        // 3. Si no se encontró nada, respuesta por defecto
        if (!foundResponse) {
            showPopup("Gato Ayudante", "Miau... No estoy seguro de entender eso. Intenta preguntarme por 'volante', 'pantalla', 'clima', 'emergencia' o pide 'ayuda'.");
        }

        // Limpiar el input después de procesar
        catQuestionInput.value = '';
    }


    // --- Event Listeners ---

    // Clic en Hotspots (sin cambios)
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            showPopup(hotspot.dataset.title, hotspot.dataset.info);
        });
    });

    // Clic en Botón de Cerrar Popup (sin cambios)
    closeButton.addEventListener('click', hidePopup);

    // Clic en la Imagen del Gato (muestra frase aleatoria simple)
    catHelperImage.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
        showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
    });

    // NUEVO: Clic en el Botón "Enviar"
    askCatButton.addEventListener('click', processQuestion);

    // NUEVO: Presionar Enter en el campo de input
    catQuestionInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita el comportamiento por defecto (si lo hubiera)
            processQuestion();
        }
    });

    // Opcional: Cerrar popup al hacer clic fuera (sin cambios, debería seguir funcionando)
    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            hidePopup();
        }
    });

});