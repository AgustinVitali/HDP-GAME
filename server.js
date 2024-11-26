// server.js
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files first
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:4000', 'https://hdp-game-nu.vercel.app'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const players = new Map();
const roomCode = '1234';
let judgeIndex = 0;
let currentJudgeId = null;


const blackCards = ["No te puedo explcar el asco que me da ________.","Trágico accidente deja 35 heridos. La causa:________.","La causa de la Tercera Guerra Mundial va a ser ________.",
    "Mi viejo siempre decía:En la mesa no se habla de política ni de ________.","El tiburón más grande es el tiburón ballena. Pero el más raro es el tiburón ________.",
    "Se le solicita a los señores pasajeros ________.","El médico me dijo que fue un milagro, pero de ahora en más nada de ________.",
    "Mi vida secuales es comparable a ________.","No sé si es el momento para decirlo, pero ayer (nombrá un jugador de la mesa) me dijo que tenía pesadillas recurrentes con ________.",
    "¿Sabías que el campeón mundial de ________ es argentino?","Macri reemplazó los cuadros de la Casa Rosada por cuadros de ________.",
    "Piedra, papel o ________.","Lo que más exita a (nombrá un jugador de la mesa) es ________.","Lo unico que le gusta más a los Pumas que cantar el himno es ________.",
    "El problema de la Iglesia es que está controlada por ________.","Lo más difícil de ser ciego debe ser ________.","Solo dos cosas pueden lastimar a Superman: la kryptonita y ________.",
    "Soy el heredero al trono. La espada de ________ me pertenece.","¿Cuál es el peor regalo que te pueden hacer?","La verdad es que soy un privilegiado vivo de ________.",
    "De qué fue testigo de Jehová","#________.","Chanel presenta su nueva fragancia: Obsesión de ________, eau de toilette.","Entre mi porno tengo una carpeta entera dedicada a ________.",
    "No hay nada mejor para una primera cita que ________.","El homeópata me recomendó ________.","Plantar un árbol, escribir un libro ________.","Solo hay una cosa que me gusta más que coger ________.",
    "De pibe tenía el albúm de figuritas de ________.","Se difundió una encuesta que dice que al 71% de los argentinos les gusta ________.","Cuando tenía tiempo, en lugar de la Z de Zorro te dibujaba ________.",
    "Lo que más bronca le da a (nombrá un jugador de la mesa) es ________.","Todos los días de 20 a 21 me tomo una horita para ________.","Amo el olor de ________ por la mañana.",
    "Quién estuvo detrás del atentado a la AMIA","El Comité Olímpico Internacional está analizando sumar ________ a los próximos juegos.","Donald Trump podrá tener todo el dinero del mundo, pero nunca podrá tener ________.",
    "¿Qué es lo peor que te podrás tatuar borracho?","Llegué tarde pique había un piquete a favor de ________.","La secuela de Charlie y la fábrica de chocolate debería llamarse Charlie y ________.",
    "No hay nada más triste que ________.","No se la pude chupar. Tenía gusta a ________.","¿Qué cosa es legal pero va a dejar de serlo en 10 años?","Elije tu propia aventura: Eres una agente secreto contra ________.",
    "¿Cuál es tu secreto para ser tan sexy?","Soy el genio de la lámpara y te concederé tres deseos,¿cuál es el primero?","Nada es tan desagradable que masturbarse pensando en ________.",
    "Los ricos come sushi sobre el cuerpo de una mufer desnuda. Los MUY ricos, sobre ________.","El munde seráa un lugar mejor sin ________.","El que depositó dólares, recibirá ________.",
    "Hoy en yoga aprendimos tres posturas nuevas. La grulla, el loto y ________.","Informe especial: El lado oscuro de ________.","Según la Organización Mundial de la Salud no hay nada más peligroso que ________.",
    "Todo bien con el colectivo y la birome, pero el mejo invento argentino es por lejos ________.","Cuando era chico, todos los año le pedia a Papá Noel lo mismo: ________.","¿Qué tiene que tener tu pareja ideal?",
    "De los caballeros de la measa redonda, el que más me gusta es Sir ________.","Nada le gusta tanto a un cora como ________.","Club Atlético ________.",
    "Mis viejos se unieron en una secta nueva que adora ________.","El frente para la Victoria tiene a La Cámpora, Cambiemos tiene ________.","________ puso a Argentina en el mapa.",
    "Acabo de terminar de leer una novela erotica sobre ________.","En el cine están dando ________III.",
    "En lugar de rendir el final tuvimos que preparar una monografía sobre ________.","El gobierno planea reemplazar el Obelisco con un monumento a ________.",
    "En el nombre del Padre, del Hijo de ________.","-¿Por qué llora Quico? -Por ________.","Mi pareja me dejó po ________.", "Cada vez hay más gente con fobia a ________.",
    "Debo confesarlo tengo un fetiche con ________.","Soy capaz de tolerar cualquier cosa, excepto ________.","Arqueólogos descubre que los antiguos agipcios amaban ________.",
    "Antes de morir, Nostradamus predijo la llegada de ________.","¿Qué guarda Batman en lo mas profundo de la Baticueva?","Dios perdona ________ no.",
    "(nombrá un jugador de la mesa) usa el mismo password para todo: ________.","Olmedo y Porcel presentan: A las chicas les gusta ________."
]; // Ejemplo de cartas negras

const whiteCards = ["Un Volquete lleno de cadáveres", "Un bebé de caca", "El olor a billete viejo", 
    "El padre de Grassi", "Una paja bolsillera", "La cura contra el cáncer", "El pibe con el que debutó Pele", 
    "Una Milanesa de soja", "ALF", "Un disparo en la cabeza", "La selección rusa de Volley", 
    "Responder un Te amo con un gracias", "Un Falcon Verde", "El Viagra", "Un mes sin masacres en EEUU", 
    "El Poliamor", "El ex presidente Pinedo", "Un antojo de carne humana", "Ir a pilates","Un Ano contra natural",
    "Un cinturón de castidad", "Una guerra de almohadas","Los millennials", "El fantasma de la B","Ser Mufa",
    "Chuck Norris", "La verdad toda la verdad y nada más que la verdad","Un detector de sarcasmo","Compartir jeringas",
    "El aro del corpiño"," El tránsito lento","Mi entrepierna","Dos niñas de 7 años","Un secuestro express","Andar a caballo en pelotas",
    "¡Esssta!","Un hippie con OSDE","Un alto guiso","Poner la otra mejilla","La flora intestinal","Enterarme de que mi vieja es insaciable",
    "Salir de joda los martes", "Un disfraz de Empanada","Los piojos","Un uruguayo llamado Washington", "Enterarme de que su ex la tenia mucho mas grande",
    "Un enorme y gigantesco clítoris", "Guantánamo","Laburar los findes", "Eyacular en gravedad cero", "Esperar a que cumpla los 18",
    "Donald Trump", "Chupar de abajo para arriba", " Separar siameses", "La Cámara de Diputados","Apoyar el traste en la estufa",
    "Un pinguino empetrolado", "Ejercer el derecho de prima nocte con todos mis amigos", "Rabas hechas con prepucios",
    "36 vírgenes por un trabajo hecho a medias", "Anonymus", "La Marcha Peronista", "El Dirty Sanchez", "Pezones bizcos",
    "Dar el vuelto con caramelos","Entrarle como gallego a la gaita", "Hacerle caso a las voces de mi cabeza","El liquido azul de las propagandas de las toallitas",
    "Ese festival chino donde comen carne de perro","Forros sabor cordero patagónico", "La subtrenmetrocleta", "El pibe de mi pobre angelito",
    "La década ganada", "Quebrar en la previa", "Un banco de esperma", "La Bonaerense", "La 12", "Imponer socialmente el Día de la Concha",
    "El sex shop al final de la galeria","Sentir que me están cagando","Frodo, Sam y los otros dos", "Consumir drogas duras",
    "Una bicibleta con dos vergas en lugar de manubrio","Maiameeee","La navaja de MacGyver","Un mal flash","Cagar al prójimo",
    "La santa Biblia","Larry, Curly y Moe","Irse a vivir al Uritorco","La justicia por mano propia","El testículo del medio",
    "El amor de Viggio Mortensen por San Lorenzo","El Gauchito Gil","Los cabrones del conurbano","La homofobia","La clase obrera",
    "Fingir el orgasmo","Ponerla","Un sueño Húmedo","La gilada","El gol de Diego a los ingleses","Un grupo de viejos fachos","La SIDE",
    "Pobreza digna","El anillo de cuero","Un perrito con ruedas en lugar de patas traseras","El anticristo","Cambiar de género",
    "Un guiso de escrotos","Depilarse el pecho","La pica entre colectiveros y taxistas","La siesta santagueña","Un masaje de próstata",
    "Los kelpers","Hacerte el orto","El tipo con el que fantasea tu vieja","Los piqueteros","Tener cara de boludo","Una fuerte tendencia a la necrofilia",
    "El hijo de puto que se está cogiendo al amor de tu vida mientras vos jugas esto","El negro que muere primero en las películas",
    "Un señor desnudo llorando en la calle","Un Pollock de caca","Viajar en la línea Sarmiento","Dos semanas de retraso",
    "Oler la ropa interior de tu vieja","Los niños rata","Mi colección de rosarios anales","Un volcán de semen","La asfixia erótica",
    "Salir del clóset","Un culo peludo","El gigoló de Rosario","Diciembre 2001","la celulitis","Las invasiones bárbaras",
    "Los fluidos vaginales","El tipo que piensa las placas de Crónica","La del mono","Aguantar los trapos","Pinchar forros",
    "Sacar los pelos de la rejilla del baño","Borrar una publicación porque nadie le dio like","Cenar atún directo de la lata","Un supositorio",
    "Meter los cuernos","La fiesta","Hacer cucharita con Hitler","Tu vieja","El espiral para los mosquitos","El tráfico de órganos",
    "La infertilidad","El Paco","Un niño africano y su AK-47","Amar animales más de lo que alguien debería amar a un animal",
    "Las islas Malvinas","El racismo","El sadomasoquismo","Rosa, la maravillosa","La fe cristiana","Un payaso","El chi chi chi le le le",
    "Un ginecólogo pediatra","No tener códigos","Ese tío raro que tienen todas las familias","las anécdotas de mi vieijo","Malos modales",
    "Una inerte barra de carbón","La fiesta de la espuma","Un proctólogo","La bipolaridad","Instalar la monarquía en la Argentina","Una denuncia de Carrío",
    "Ponerle pasas de uva a las empanadas","Creer en el horóscopo","La zona roja","El vértigo en la cola","Stalkear a tu ex en redes sociales","La adicción al sexo",
    "El acoso dexual en el subte","Fosas comunes","El gluten","Mi hermano","La versión braille del Kamasutra","Algún pelotudo de la farándula al azar",
    "Ir a misa","La pena de muerte","Sacarla y acabar afuera","Un cinturonga","Los mormones","Un ataque de palometas","Adolf Hitler",
    "Un poster de la concha de tu hermana","Un tuca","Un super chino","Agacharse y conocerlo","Las inundaciones","El segundo cordón del conurbano bonaerense",
    "El cuco","El fundamentalismo vegano","Probar con un yogur","La cara de Cristiano cuando le dan un premio a Messi","La computadorita por la que habla Stephen Hawking",
    "Revisarle el celu a tu pareja","Mi jefe","Un enema","Un metrodelegado","La Deep Web","Jugar al Jenga con un sobreviviente de las Torres Gemelas",
    "La esvástica","Un frasquito con un feto adentro","Una foto mía de hace 5 años","Las manos de todos los pies arriba","La raza aria",
    "Un harén de cholas peruanas","Ponerse la gorra","Las manos de Perón","Una lluvia de pijas","Lo que queda del radicalismo","Querer que vuelvan los militares",
    "Tomar medio vasito de orina","Un video de ISIS decapitando periodistas","La Tercera Guerra MUndial","Tener las bolas por el piso",
    "Un dildo de dos puntas","Vivir rodeado de pelotudos","Los skinheads","Las hemorroides","Hacer molinete","Coger con extraños",
    "Un arquero paraguayo con el ego altísimo","Matilda","La pincita de la depiladora","El Dalai Lama","El amor","Opinar sin saber",
    "El calentamiento global","La discriminación","La eutanasia","La mafia china","Herpes bocales","Llegar virgen al matrimonio",
    "La difunta correa","Jesús","El Día de la Lealtad","Salpicar la tapa del inodoro","La posibilidad de una guerra nuclear","El cavado profundo",
    "Un brote de dengue","La que hace la traducción para sordomudos","Un canchero","El Ku Klux Klan","La servidumbre","(Nombrá al jugador de tu derecha)",
    "Una MILF","El autor intelectual del crimen de Cabezas","Los pelirojos","Rambo","Un motochorro","El antidóping","Un chiste misógino",
    "Darle para que tenga","El olor a bebé","El culto al crossfit","Legalizar el aborto","Una guacha piola","El sueño de ser campeón de Gimnasia",
    "Una bañera llena de leche tibia","Los porteños","Una salidera bancaria","El pibe de sistemas","El incesto","La cárcel de Devoto","Un puñal de carne",
    "El machismo","Negar el Holocausto","ISIS","El rigor mortis","El colesterol alto","Los ensayos nucleares de Corea del Norte","Lamer axilas",
    "Tapar el baño","El 70% de descuento en la segunda unidad","La pubertad","La leche cortada","La barba candado","Vladimir Putin","La AFIP","Automedicarse",
    "Quedarse pelado","Una tirada de goma decepcionante","La pulserita roja contra la envidia","Un deportista argentino en una final","El Opus Dei",
    "Una mujer con pies muy pequeños y el pene muy grande","Un pedo vaginal","Jugar al teto","La concha de la lora","Cerrar el orto","Los pañales para adultos",
    "Recuerdos reprimidos","La copa menstrual","La pastilla de día después","Un culo come trapo","La ira de Dios","La carpita mañanera","El pueblo judío",  
    "El papa Francisco","Una jauría de lobos salvajes","Eructar el abecedario","Sergio Massa","Mauricio Macri","Esa tibia sensación que sentís cuando levantás la caca del perro con una bolcita",
    "Brownie con gusto a pasto","La Iglesia maradoniana","Una silla de ruedas","Un test de embarazo positivo","La flacidez","Un accidente en un parque de diversiones",
    "Matar al último panda","El porno gay","Las bicisendas","Mirar nenas en jumper","(Nombrá al jugador de tu izquierda)","La cumbia villera","Coger con cocaína en la punta de la verga",
    "Usar sandalias con medias","Un cabeza de termo","La muerte","Parir en el auto","Preguntarle si está por acabar","Auschwitz","Lágrimas de semen","Tu situación laboral",
    "Una verga más ancha que larga","Orgasmos múltiples","La tiro de cola","El negro pijudo de WhatsApp","El carnaval carioca","El trabajo esclavo","Irse en seco" 
     ]; // Ejemplo de cartas blancas

io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);

    socket.on('joinRoom', ({ roomCode: clientRoomCode, name }) => {
        if (clientRoomCode === roomCode) {
            socket.join(roomCode);
            
            // Actualizar o crear jugador
            players.set(socket.id, { 
                name, 
                roomCode, 
                ready: false,
                hand: [],
                submittedCard: null,
                connected: true // Nuevo flag para tracking de conexión
            });
            
            // Emitir estado actualizado
            updatePlayerStatus(roomCode);
            io.to(roomCode).emit('joinedRoom', { id: socket.id, name });
        }
    });


    socket.on('playerReady', ({ roomCode, name }) => {
        const player = players.get(socket.id);
        if (player) {
            player.ready = true;
            console.log(`${name} está listo.`);
            
            // Contar jugadores activos y listos
            const activePlayersCount = Array.from(players.values())
                .filter(p => p.connected).length;
            const readyPlayersCount = Array.from(players.values())
                .filter(p => p.connected && p.ready).length;
            
            console.log(`Jugadores listos: ${readyPlayersCount}/${activePlayersCount}`);
            
            io.to(roomCode).emit('playerReady', { 
                id: socket.id, 
                name,
                readyCount: readyPlayersCount,
                totalPlayers: activePlayersCount
            });

            // Verificar si todos están listos
            const allReady = Array.from(players.values())
                .filter(p => p.connected)
                .every(p => p.ready);
                
            if (allReady && activePlayersCount >= 2) {
                io.to(roomCode).emit('allPlayersReady');
                console.log('Todos los jugadores están listos. Comenzando el juego...');
                console.log(whiteCards.length)
                startRound();
            }
        }
    });

    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log(`Jugador ${player.name} desconectado.`);
            player.connected = false; // Marcar como desconectado en lugar de eliminar
            player.ready = false; // Quitar estado ready al desconectar
            
            setTimeout(() => {
                // Si después de 5 segundos sigue desconectado, eliminar
                if (!player.connected) {
                    players.delete(socket.id);
                }
            }, 5000);
            
            updatePlayerStatus(roomCode);
            
            io.to(roomCode).emit('playerDisconnected', { 
                id: socket.id, 
                name: player.name 
            });
        }
    });

    socket.on('leaveRoom', ({ roomCode, name }) => {
        console.log(`Jugador ${name} salió de la sala ${roomCode}.`);
        socket.leave(roomCode);
        delete players[socket.id];
    });

    socket.on('submitCard', ({ playerId, card, playerName }) => {
        console.log('Server received card submission:', { playerId, card, playerName });
        console.log('Current judge ID:', currentJudgeId);
        
        if (currentJudgeId) {
            // Calculate total active players
            const totalPlayers = Array.from(players.values()).filter(p => p.connected).length;
            
            io.to(currentJudgeId).emit('cardSubmitted', {
                playerId,
                card,
                playerName,
                data: { totalPlayers }
            });
            console.log('Card sent to judge:', currentJudgeId);
        } else {
            console.error('No judge ID available');
        }
    });

    
    

    

    socket.on('selectWinner', ({ card }) => {
        // Lógica para manejar la carta ganadora seleccionada por el juez
        console.log(`El juez seleccionó la carta ganadora: ${card}`);
        io.to(roomCode).emit('winnerSelected', { card });
        // Aquí puedes agregar la lógica para manejar la carta ganadora
        startRound(); // Iniciar la siguiente ronda
    });

    socket.on('startRound', () => {
        const activePlayers = Array.from(players.entries())
            .filter(([_, player]) => player.connected);
        
        currentJudgeId = activePlayers[judgeIndex % activePlayers.length][0];
        
        const hands = activePlayers.map(([playerId]) => ({
            id: playerId,
            hand: generateHand()
        }));

        io.to(roomCode).emit('startRound', {
            judgeId: currentJudgeId,
            blackCard: 'Carta negra de ejemplo',
            hands: hands
        });

        judgeIndex++;
    });
});

// Función auxiliar para actualizar estado de jugadores
function updatePlayerStatus(roomCode) {
    const activePlayersCount = Array.from(players.values())
        .filter(p => p.connected).length;
    const readyPlayersCount = Array.from(players.values())
        .filter(p => p.connected && p.ready).length;
        
    io.to(roomCode).emit('playerReady', { 
        readyCount: readyPlayersCount,
        totalPlayers: activePlayersCount
    });
}

// At the top with other constants
//let availableWhiteCards = [...whiteCards]; // Create a copy of white cards array

// In server.js, add this shuffle function at the top with other functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Update startRound function
function startRound() {
    const activePlayers = Array.from(players.entries())
        .filter(([_, player]) => player.connected);
    
    currentJudgeId = activePlayers[judgeIndex % activePlayers.length][0];
    const blackCard = blackCards[Math.floor(Math.random() * blackCards.length)];

    // Create a copy and shuffle white cards
    let availableCards = shuffleArray([...whiteCards]);

    // Distribute 10 unique cards to each non-judge player
    activePlayers.forEach(([playerId, player]) => {
        if (playerId !== currentJudgeId) {
            // Take 10 cards from available cards
            player.hand = availableCards.splice(0, 10);
        } else {
            player.hand = []; // Judge gets no cards
        }
    });

    io.to(roomCode).emit('startRound', { 
        judgeId: currentJudgeId, 
        blackCard, 
        hands: activePlayers.map(([id, player]) => ({ 
            id, 
            hand: player.hand 
        })) 
    });

    judgeIndex = (judgeIndex + 1) % activePlayers.length;
}


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});


