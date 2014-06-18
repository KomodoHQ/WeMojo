var Device = require('./device'),

    Socket = function (obj) {

        var parent = Device(obj),
            socket,

            on = function () {
                parent.send("socket_setbinarystate", {"binarystate": 1})
            },

            off = function () {
                parent.send("socket_setbinarystate", {"binarystate": 0})
            }

        socket = parent

        socket.on = on
        socket.off = off

        return socket

    }

module.exports = Socket
