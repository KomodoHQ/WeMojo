var Device = require('./device'),

    Socket = function (obj) {

        var parent = Device(obj),
            socket,

            turnOn = function () {
                parent.send("socket_setbinarystate", {"binarystate": 1})
            },

            turnOff = function () {
                parent.send("socket_setbinarystate", {"binarystate": 0})
            }

        socket = parent

        socket.turnOn = turnOn
        socket.turnOff = turnOff

        return socket

    }

module.exports = Socket
