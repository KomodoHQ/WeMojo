# WeMojo

Node module for interfacing with Belkin Wemo devices. Heavily inspired by
[wemonode](https://github.com/supsi/wemonode) but with a (hopefully) nicer API.

## Getting Started
Install the module with: `npm install wemojo`

```javascript
var WeMojo = require('wemojo'),
    Client = WeMojo.Client()

Client.startDiscovery()

Client.emitter.on('wemo:device-found', function (device) {

    if (device.deviceType == 'socket')
        device.turnOn()

})
```

## License
Copyright (c) 2014 KomodoHQ  
Licensed under the MIT license.
