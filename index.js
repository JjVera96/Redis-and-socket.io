'use strict'

/* Creamos un servidor http y conectamos las
funciones de socket a este servidor */
const http = require('http').Server()
const io = require('socket.io')(http)
const redis = require('redis')
require('dotenv').config()

const port = process.env.PORT ? process.env.PORT: 3000
const redisHost = process.env.REDIS_HOST ? process.env.REDIS_HOST : 'localhost'
const redisPort = process.env.REDIS_PORT ? process.env.REDIS_PORT : 6379

/* Esta función recibe cualquier petición de
conexión desde un socket en el navegador (cliente)
e imprime en consola que un nuevo usuario se ha
conectado */
io.on('connection', socket => {
	// Conectamos con el servidor de redis cuando se conecte un nuevo usuario
	var redisClient = redis.createClient(redisPort, redisHost)

	//Se suscribe a una tarea
	socket.on('subscribeTask', taskId => {
	    redisClient.subscribe(taskId)
	})

	//Se dessuscribe a una tarea
	socket.on('unsubscribeTask', taskId => {
	    redisClient.unsubscribe(taskId)
	})

	//Si se cierra el socket cerrar la conexion a redis
	socket.on('disconnect', () => {
		redisClient.quit()
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
