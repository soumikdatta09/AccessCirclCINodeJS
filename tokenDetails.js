module.exports = {
    getTokenDetails: function (url, path, headerContentName, orgName, repoName, jwt, callback) {
        console.log("getTokenDetails called.......");
        //console.log(url + path + email + pwd);
        path = '/' + path + '?orgName=' + orgName + '&repoName=' + repoName;
        console.log(url + path);
        var querystring = require('querystring');
        var https = require('https');

        var data = querystring.stringify({
            //Authorization: headerContentName
        });
        console.log(data);
        var options = {
            host: url,
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                headerContentName: jwt
            }
        };

        var req = https.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (tokenData) {
                //console.log("body: " + chunk);
                callback(tokenData);
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.write(data);
        req.end();
    }
}