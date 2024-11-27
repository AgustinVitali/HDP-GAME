// game.js
const socket = io(window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : 'https://hdp-game-production-9b0a.up.railway.app'
);

// Recuperar datos del jugador desde localStorage
const name = localStorage.getItem('playerName');
const roomCode = localStorage.getItem('roomCode');

// Reunirse en la sala automáticamente al cargar la página
socket.on('connect', () => {
    console.log('Reconectado al servidor');
    const name = localStorage.getItem('playerName');
    const roomCode = localStorage.getItem('roomCode');
    if (name && roomCode) {
        socket.emit('joinRoom', { roomCode, name });
    }
});

if (!name || !roomCode) {
    alert('No se encontró información del jugador. Regresa al inicio.');
    window.location.href = '/';
}

// Escuchar eventos del servidor
socket.on('joinedRoom', (data) => {
    totalPlayers = data.totalPlayers; // Guardar el total de jugadores
    console.log(`Te uniste a la sala: ${data}`);
    document.getElementById('ready-button').style.display = 'block';
    document.getElementById('leave-room').style.display = 'block';
    // Hide black card and its container on room join
    document.getElementById('black-card').textContent = '';
    document.getElementById('black-card-container').style.display = 'none';
});

socket.on('playerJoined', (player) => {
    console.log(`${player.name} se unió a la sala.`);
});

socket.on('playerReady', (data) => {
    console.log(`${data.name} está listo. (${data.readyCount}/${data.totalPlayers})`);
    document.getElementById('game-status').innerText = 
        `Jugadores listos: ${data.readyCount}/${data.totalPlayers}`;
});

socket.on('allPlayersReady', () => {
    console.log('Todos los jugadores están listos. Comenzando el juego...');
    document.getElementById('ready-button').style.display = 'none';
    document.getElementById('leave-room').style.display = 'none';
    startGame();
});

let currentJudgeId = null;
let submittedCards = [];
let totalPlayers = 0; // Variable para contar el total de jugadores

// In game.js, update the startRound handler

socket.on('startRound', ({ judgeId, blackCard, hands }) => {
    submittedCards = [];
    console.log('Iniciando nueva ronda');
    console.log('ID del juez recibido:', judgeId);
    console.log('Mi ID:', socket.id);
    
    // Reset game state
    currentJudgeId = judgeId;
    const isJudge = socket.id === currentJudgeId;
    
    // Clear containers
    const cardsContainer = document.getElementById('cards-container');
    const submittedCardsContainer = document.getElementById('submitted-cards-container');
    const blackCardContainer = document.getElementById('black-card-container');
    const blackCardElement = document.getElementById('black-card');
    
    cardsContainer.innerHTML = '';
    submittedCardsContainer.innerHTML = '';
    blackCardElement.textContent = '';
    
    // Always hide black card first
    blackCardContainer.style.display = 'none';
    
    if (isJudge) {
        console.log('Configurando vista del juez');
        // Judge view setup
        cardsContainer.style.display = 'none';
        submittedCardsContainer.style.display = 'block';
        
        // Show black card only to judge
        blackCardContainer.style.display = 'flex';
        blackCardElement.textContent = blackCard;
        document.getElementById('game-status').innerText = `Eres el JUEZ - Carta negra: ${blackCard}`;
        
        submittedCardsContainer.innerHTML = '<p>Esperando cartas de los jugadores...</p>';
    } else {
        console.log('Configurando vista del jugador');
        // Player view setup
        cardsContainer.style.display = 'flex';
        submittedCardsContainer.style.display = 'none';
        
        document.getElementById('game-status').innerText = 'Eres JUGADOR - Tu turno de jugar una carta';
        
        // Deal player cards
        const playerHand = hands.find(h => h.id === socket.id)?.hand || [];
        console.log('Mis cartas:', playerHand);
        
        playerHand.forEach(card => {
            const cardButton = document.createElement('button');
            cardButton.className = 'card';
            cardButton.textContent = card;
            cardButton.onclick = () => submitCard(card);
            cardsContainer.appendChild(cardButton);
        });
    }
});

socket.on('cardSubmitted', ({ playerId, card, playerName, data }) => {
    console.log('Carta recibida:', { playerId, card, playerName });
    
    // Verificar si soy el juez
    if (socket.id === currentJudgeId) {
        console.log('SOY EL JUEZ - Procesando carta recibida');
        
        // Añadir carta al array
        submittedCards.push({ playerId, card, playerName });
        console.log('Cartas almacenadas:', submittedCards);
        
        // Verificar si todos los jugadores han enviado sus cartas
        if (submittedCards.length === data.totalPlayers - 1) { // -1 porque el juez no envía carta
            console.log('Todos los jugadores han enviado sus cartas.');
            // Aquí puedes mostrar las cartas al juez
            updateJudgeView(); // Llama a la función para mostrar las cartas
        } else {
            console.log('Esperando más cartas...');
        }
    } else {
        console.log('NO SOY EL JUEZ - Ignorando carta recibida');
    }
});

socket.on('winnerSelected', ({ card }) => {
    alert(`La carta ganadora es: ${card}`);
    // Aquí puedes agregar lógica adicional para manejar la carta ganadora
});

socket.on('errorMessage', (message) => {
    alert(message); // Mostrar mensaje de error
    window.location.href = '/'; // Redirigir al inicio
});

// Manejar reconexión
socket.on('connect', () => {
    console.log('Reconectado al servidor');
    const name = localStorage.getItem('playerName');
    const roomCode = localStorage.getItem('roomCode');
    if (name && roomCode) {
        socket.emit('joinRoom', { roomCode, name });
    }
});

socket.on('disconnect', () => {
    console.warn('Desconectado del servidor. Intentando reconectar...');
});

// Manejar el evento beforeunload para desconectar el socket
window.addEventListener('beforeunload', () => {
    socket.emit('leaveRoom', { roomCode, name });
    socket.disconnect(); // Desconecta el socket
    localStorage.clear(); // Limpia el almacenamiento local
});

// Botón para salir de la sala
document.getElementById('leave-room').addEventListener('click', () => {
    socket.emit('leaveRoom', { roomCode, name });
    socket.disconnect(); // Desconecta el socket
    localStorage.clear(); // Limpia el almacenamiento local
    window.location.href = '/'; // Redirige al inicio
});

// Función para manejar el botón "Estoy listo"
function playerReady() {
    const readyButton = document.getElementById('ready-button');
    readyButton.disabled = true;
    readyButton.textContent = 'Esperando a otros jugadores...';
    socket.emit('playerReady', { roomCode, name });
}

// Función para enviar la carta seleccionada por el jugador
function submitCard(card) {
    if (socket.id !== currentJudgeId) {
        console.log('Enviando carta:', card);
        socket.emit('submitCard', { 
            playerId: socket.id,
            card: card,
            playerName: name
        });
        
        // Feedback visual
        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = `<p>Enviaste la carta: "${card}"</p>`;
        document.getElementById('game-status').innerText = 'Carta enviada - Esperando al juez';
    }
}

// Función para comenzar el juego
function startGame() {
    console.log('El juego ha comenzado!');
    document.getElementById('ready-button').style.display = 'none';
}

// Función para seleccionar la carta ganadora (solo para el juez)
function selectWinner(card) {
    socket.emit('selectWinner', { card });
}

// Función nueva para actualizar la vista del juez
function updateJudgeView() {
    const submittedCardsContainer = document.getElementById('submitted-cards-container');
    
    if (!submittedCardsContainer) {
        console.error('No se encontró el contenedor de cartas enviadas');
        return;
    }

    console.log('Actualizando vista del juez. Cartas actuales:', submittedCards);
    
    // Forzar visibilidad del contenedor
    submittedCardsContainer.style.display = 'block';
    submittedCardsContainer.style.visibility = 'visible';
    submittedCardsContainer.style.opacity = '1';
    
    // Limpiar el contenedor
    submittedCardsContainer.innerHTML = '';
    
    if (submittedCards.length === 0) {
        submittedCardsContainer.innerHTML = '<p>Esperando cartas de los jugadores...</p>';
        return;
    }

    // Crear un contenedor para las cartas
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'cards-grid';
    submittedCardsContainer.appendChild(cardsGrid);

    // Mostrar todas las cartas almacenadas
    submittedCards.forEach(({ card, playerName }, index) => {
        const cardButton = document.createElement('button');
        cardButton.className = 'submitted-card'; // Asegúrate de que esta clase sea 'submitted-card'
        cardButton.innerHTML = `
            <div class="card-content">
                <div class="card-text">${card}</div>
                <div class="player-name">Jugador: ${playerName}</div>
            </div>
        `;
    
        cardButton.onclick = () => {
            if (confirm(`¿Seleccionar esta carta como ganadora?\n"${card}"`)) {
                selectWinner(card);
            }
        };
    
        submittedCardsContainer.appendChild(cardButton);
    });
}

function startGame() {
    console.log('El juego ha comenzado!');
    // Aquí puedes agregar más lógica para iniciar el juego
}