module.exports = {
    getJwtDetails: function (url, path, email, pwd, callback) {
        console.log("getJwtDetails called.......");
        //console.log(url + path + email + pwd);
        path = '/' + path + '?email=' + email + '&password=' + pwd;
        console.log('JWT URL: ' + url + path);
        var querystring = require('querystring');
        var https = require('https');

        var data = querystring.stringify({
            // email: email,
            // password: pwd
        });
        console.log(data);
        var options = {
            host: url,
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        var req = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (jwtData) {
                //console.log("body: " + chunk);
                callback(jwtData);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.write(data);
        req.end();
    }
}