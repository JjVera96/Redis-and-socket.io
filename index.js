'use strict'

/* Creamos un servidor http y conectamos las
funciones de socket a este servidor */
var http = require('http').Server()
var io = require('socket.io')(http)
var redis = require('redis')
const port = 3000
const redisHost = 'localhost'
const redisPort = 6379

/* Esta función recibe cualquier petición de
conexión desde un socket en el navegador (cliente)
e imprime en consola que un nuevo usuario se ha
conectado */
io.on('connection', socket => {
	console.log('A user has connected...')
	// Conectamos con el servidor de redis cuando se conecte un nuevo usuario
	var redisClient = redis.createClient(redisPort, redisHost)

	//Se suscrbie al usuario y a la empresa
  	socket.on('subscribe', (data) => {
	    redisClient.subscribe(data.empresaId)
	    redisClient.subscribe(data.userId)
  	})

	//Se suscribe a una tarea
	socket.on('subscribeTask', taskId => {
	    redisClient.subscribe(taskId)
	})

	//Si se cierra el socket cerrar la conexion a redis
	socket.on('disconnect', () => {
		redisClient.quit()
		console.log('A user has disconnected...')
	})

  	/* Cuando redis genere una publicación (message)
  	el mesaje de esa publicación se emite al socket */
  	redisClient.on('message', (channel, message) => {
	    socket.emit('notify', message)
	})

	//Si el socket de redis falla, emitir cerrar al socket de la vista
	redisClient.on('error', error => {
		console.error(error)
		socket.emit('forceDisconnect')
	})

})


/* Levantamos el servidor http y lo ponemos a
escuchar en el puerto port */
http.listen(port, () =>  console.log('Listening on port ' + port))
