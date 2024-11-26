document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const joinButton = document.getElementById('joinButton');
    const nameInput = document.getElementById('player-name');
    const roomCodeInput = document.getElementById('room-code');

    // Validar que los elementos existan en el DOM
    if (!joinButton || !nameInput || !roomCodeInput) {
        console.error('Error: Uno o más elementos no encontrados en el DOM.');
        return;
    }

    // Configurar conexión con el servidor Socket.IO
    const socket = io('http://localhost:4000'); // Asegúrate de que el servidor está en el puerto correcto

    // Manejar el evento de "unirse a la sala"
    joinButton.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const roomCode = roomCodeInput.value.trim();

        if (!name || !roomCode) {
            alert('Por favor completa todos los campos.');
            return;
        }

        if (roomCode !== '1234') {
            alert('Código de sala incorrecto.');
            return;
        }

        // Guardar datos en localStorage
        localStorage.setItem('playerName', name);
        localStorage.setItem('roomCode', roomCode);

        // Emitir evento para unirse a la sala
        socket.emit('joinRoom', { roomCode, name });

        // Redirigir a game.html
        window.location.href = '/game.html';
    });

    // Manejar evento de conexión exitosa a la sala
    socket.on('joinedRoom', (roomCode) => {
        console.log(`Te has unido a la sala: ${roomCode}`);
    });

    /* Manejar desconexión del servidor
    socket.on('disconnect', () => {
        console.log('Desconectado del servidor.');
    });*/

    // Manejar errores desde el servidor
    socket.on('errorMessage', (message) => {
        alert(message);
    });
});
