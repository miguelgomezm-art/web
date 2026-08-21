// servidor.js
const WebSocket = require('ws');

// Levanta el canal de comunicación en el puerto 8085
const wss = new WebSocket.Server({ port: 8085 });

wss.on('connection', function connection(ws) {
    console.log('Nuevo terminal remoto conectado a la red de mantención.');

    // Al recibir una actualización de un dispositivo, la replica en todas las pantallas
    ws.on('message', function incoming(data) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});

console.log('Servidor de sincronización remota activo en el puerto 8085...');
