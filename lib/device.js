var fs = require('fs'),
    path = require('path'),
    http = require('http'),

    Device = function (obj) {

    var send = function (command, parameters, callback) {
        
        fs.readFile(__dirname + '/commands/' + command + '.json', function (err, data) {

            if(err) {
                console.log('err',err)
                return
            }

            var commandObj = JSON.parse(data.toString()),
                options,
                req,
                envelope,
                key

            if (commandObj.appliesTo.indexOf(obj.deviceType) < 0) {
                if (callback) {
                    callback('ENOTAPPLICABLE', null)
                    callback = null
                }
            } else {
                options = {
                    hostname: obj.ipaddress,
                    port: obj.port,
                    path: commandObj.path,
                    method: 'POST',
                    headers: {
                        'SOAPACTION': commandObj.soapAction,
                        'content-type': 'text/xml',
                        'charset': 'utf-8'
                    }
                }

                req = http.request(options, function (res) {
                    res.setEncoding('utf8')
                    res.on('data', function (chunk) {
                        if (callback) {
                            callback(null, chunk)
                            callback = null
                        }
                    })
                })

                req.setTimeout(1000, function(err) {
                    req.abort()
                })

                req.on("error", function (err) {})

                envelope = commandObj.envelope;

                if (parameters) {

                    for (key in parameters)
                        envelope = envelope.replace('$$' + key.toUpperCase() + '$$', parameters[key])

                }

                req.write(envelope)
                req.end()


            }
            parameters = null
            device = null

        })

    }

    obj.send = send

    return obj

}

module.exports = Device
