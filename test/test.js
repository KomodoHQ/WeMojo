var WeMojo = require('../lib/wemojo'),
    Client = WeMojo.Client()

Client.startDiscovery()

Client.emitter.on('wemo:device-found', function (device) {

    if (device.deviceType == 'socket')
        device.turnOn()

})
