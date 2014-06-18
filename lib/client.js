var util = require('util'),
    eventEmitter = require('events').EventEmitter,
    dgram = require('dgram'),
    Device = require('./device'),
    Socket = require('./socket')

    Client = function () {

        var // Constants
            SSDP_IP = '239.255.255.250',
            SSDP_PORT = 1900,
            SSDP_IPPORT = SSDP_IP + ':' + SSDP_PORT,
            devices = {
                "all": [],
                "sockets": [],
                "sensors": []
            },
            udpSocket = dgram.createSocket('udp4'),
            socketClosed = true,
            timeout,
            emitter = new eventEmitter(),

            startDiscovery = function () {
                socketClosed = false
                udpSocket.bind(0)

                startSendingDiscoveryMessage()
            },

            stopDiscovery = function () {

            }

        function onSocketError() {
            console.log('socket error')
        }

        function onSocketListening() {
            var addr = udpSocket.address();

            console.log('Listening on ' + addr.address + ':' + addr.port);

            udpSocket.addMembership(SSDP_IP)
            udpSocket.setMulticastTTL(2)
            //updateBinaryStates()
        }

        function onSocketMessage(msg) {
            var objectLocation,
                objectUSN,
                found = false,
                tokens = msg.toString().split('\r\n'),
                i,
                tmp,
                deviceType,
                id,
                lastSeen,
                ip,
                port,
                obj,
                device

            for (i = 0; i < tokens.length; i++) {
                tmp = tokens[i]

                if (tmp.indexOf("LOCATION:") >= 0)
                    objectLocation = tmp.substr(9).trim()
                else if (tmp.indexOf("USN:") >= 0)
                    objectUSN = tmp.substr(4).trim()

                if (objectLocation && objectUSN)
                    break
            }

            /* Continue only if both objectLocation and objectUSN are found */
            if (objectLocation == 'undefined' || objectUSN == 'undefined')
                return

            /* Continue only if found device is a Belkin WeMo device */
            if (objectUSN.indexOf("Belkin:service:basicevent:1") < 0)
                return

            /* Search if wemoObjects Array already contains found object */
            for (i = 0, k = devices.all.length; i < k; i++) {
                if (devices.all[i].USN == objectUSN) {
                    devices.all[i].lastSeen = +new Date
                    found = true
                    break
                }
            }

            /* If not found, this means that item is not in array, so is new */
            if (!found) {

                ipaddress = objectLocation.substr(7)
                port = ipaddress.substr(ipaddress.indexOf(":") + 1)
                port = port.substr(0, port.indexOf("/"))
                ipaddress = ipaddress.substring(0, ipaddress.indexOf(":"))

                if (objectUSN.indexOf("uuid:Socket") >= 0)
                    deviceType = "socket"
                else
                    deviceType = "sensor"

                id = objectUSN.substr(16)
                id = id.substr(0, id.indexOf(":"))

                lastSeen = +new Date

                obj = {
                    deviceType: deviceType,
                    id: id,
                    lastSeen: lastSeen,
                    location: objectLocation,
                    ipaddress: ipaddress,
                    port: port,
                    USN: objectUSN
                }

                switch (deviceType) {

                    case 'socket' :
                        device = Socket(obj)
                        devices.sockets.push(device)
                        break
                    default:
                        device = Device(obj)
                        break

                }

                devices.all.push(device)
                emitter.emit("wemo:device-found", device)

                obj = null
            }

            /* Check expired devices */
            /*var expired = this.wemoObjects.all.filter(function (item) {
                return (+new Date - item.lastSeen) > 30000
            })

            expired.forEach(function (item) {
                this.emit("device_lost", item);
                this.wemoObjects.splice(this.wemoObjects.indexOf(item), 1);
            }, this);
            */

        }

        function getDevices() {
            return devices
        }

        getSSDPHeader = function (head, vars, res) {
            var ret,
                n

            res = res || false
            ret = res ? "HTTP/1.1 " + head + "\r\n" : head + " HTTP/1.1\r\n"

            for (n in vars)
                ret += n + ": " + vars[n] + "\r\n"

            return ret + "\r\n"
        }

        function startSendingDiscoveryMessage() {
            var pkt = getSSDPHeader('M-SEARCH *', {
                HOST: SSDP_IPPORT,
                ST: 'urn:Belkin:service:basicevent:1',
                MAN: '"ssdp:discover"',
                MX: 3
            })

            pkt = new Buffer(pkt)

            sendViaSocket(pkt)

            timeout = setTimeout(startSendingDiscoveryMessage, 5000)
        }

        function sendViaSocket(pkt) {
            try {
                udpSocket.send(pkt, 0, pkt.length, SSDP_PORT, SSDP_IP)
            } catch (e) {
                console.error("Error sending UDP message: " + e.toString())
            }
        }

        udpSocket.on('error', onSocketError)
        udpSocket.on('listening', onSocketListening)
        udpSocket.on('message', onSocketMessage)

        return {
            devices: getDevices,
            socket: udpSocket,
            startDiscovery: startDiscovery,
            stopDiscovery: stopDiscovery,
            emitter: emitter,
            on: emitter.on,
            off:emitter.off
        }

    }

module.exports = Client
