var express = require('express');
var myParser = require("body-parser");
var app = express();
var fs = require("fs");
var appSettings = require("./appSettings");
var jwtDetails = require("./jwtDetails");
var tokenDetails = require("./tokenDetails");

var repo_id, circle_ci_token, vcs_type, userName, repoName, build_num, JWT, token;
var totalCount = 0, successCount = 0, failureCount = 0, successRate = 0;

app.get('/listUsers', function (req, res) {
    fs.readFile(__dirname + "/" + "users.json", 'utf8', function (err, data) {
        // var a = JSON.parse(data)
        // console.log(a.user1.name);
        res.end(data);
    });
})

app.get('', function (req, res) {
    console.log('app running');
    res.end('app running');
})

//POST Functionality from CircleCI Webhhook
app.use(myParser.urlencoded({ extended: true }));
app.use(myParser.json());
app.use(myParser.raw());

app.post('/ParseWebHookData', function (req, res) {

    if (req.body && req.body.payload) {
        repo_id = req.query.repo_id;
        circle_ci_token = req.query.circle_ci_token;
        var circleCIResponse = req.body;
        vcs_type = circleCIResponse.payload.vcs_type;
        userName = circleCIResponse.payload.username;
        repoName = circleCIResponse.payload.reponame;
        build_num = circleCIResponse.payload.build_num;
    }

    console.log("VCS Type:", circleCIResponse.payload.vcs_type);
    console.log("username:", circleCIResponse.payload.username);
    console.log("reponame:", circleCIResponse.payload.reponame);
    console.log("build_num:", circleCIResponse.payload.build_num);
    console.log(repo_id);
    console.log("circle_ci_token:" + circle_ci_token);
    //console.log(circleCIResponse);
    // var date = new Date();

    var JWTUrl = appSettings.jwtSettings.jwtUrl;
    var path = appSettings.jwtSettings.path;
    var studioMailID = appSettings.jwtSettings.studioMailID;
    var studioPassword = appSettings.jwtSettings.studioPassword;

    //JWT Implementation
    jwtDetails.getJwtDetails(JWTUrl, path, studioMailID, studioPassword, function (resPonse) {
        //console.log(JSON.parse(resPonse).jwt);

        //Token Implementation
        if (resPonse) {
            JWT = JSON.parse(resPonse).jwt;
            console.log('JWT: ' + JWT)

            var tokenUrl = appSettings.TokenSettings.TokenGetUrl;
            var tokenPath = appSettings.TokenSettings.path;
            var headerContentName = appSettings.TokenSettings.HeaderContentName;

            //tokenDetails.getTokenDetails(tokenUrl, tokenPath, headerContentName, userName, repoName, JWT, function (tokenResponse) {
            //token = "1e571341d9d12ba236cbf8065e78081d2750992b"; //Change the hard coding.....................................................
            console.log('circle_ci_token: ' + circle_ci_token);
            //});
        }

        if (circle_ci_token) {
            console.log('about to call getApiData');
            getApiData(vcs_type, userName, repoName, build_num, circle_ci_token, function (response) {
                //console.log(response);

                if (response) {
                    getTestResultCount(response, function (callback) {
                        console.log('jsonToPush: ' + callback);

                        var jsonToPush = callback;
                        if (jsonToPush) {
                            pushSnapshotData(jsonToPush, function (RESPONSE) {
                                console.log("Data Pushed to Rails API, " + RESPONSE);
                            });
                        }
                    });
                }
            });
        }
    });

    res.end();
})
//POST Functionality from CircleCI Webhhook

// Get API Data
function getApiData(vcs_type, userName, repoName, buildNumber, token, callback) {
    var url = appSettings.CircleCISettings.ApiUrl + '/' + appSettings.CircleCISettings.path + '/' + vcs_type + "/" + userName + "/" + repoName + "/" +
        buildNumber + "/" + appSettings.CircleCISettings.TestProject + token;
    console.log('GetApiData URL: ' + url);
    var https = require('https');

    var options = {
        hostname: appSettings.CircleCISettings.ApiUrl,
        port: 443,
        path: '/' + appSettings.CircleCISettings.path + '/' + vcs_type + "/" + userName + "/" + repoName + "/" +
        buildNumber + "/" + appSettings.CircleCISettings.TestProject + token,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    https.get(options, (res) => {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error(`Request Failed.\n` +
                `Status Code: ${statusCode}`);
        }
        // else if (!/^application\/json/.test(contentType)) {
        //     error = new Error(`Invalid content-type.\n` +
        //         `Expected application/json but received ${contentType}`);
        // }
        if (error) {
            console.log(error.message);
            // consume response data to free up memory
            res.resume();
            return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => {
            try {
                console.log('Raw Data: ' + rawData);
                let parsedData = JSON.parse(rawData);
                //console.log(parsedData);
                callback(parsedData);
            } catch (e) {
                console.log(e.message);
            }
        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}
// Get API Data

// Get Test Results Count
function getTestResultCount(result, callback) {
    console.log('getTestResultCount called........');
    var tests = result.tests;
    console.log("No. of Tests: " + tests.length);
    // var tests = [{
    //     "classname": "Actions auth actions should create an action for requesting login",
    //     "file": 1,
    //     "result": "success"
    // },
    // {
    //     "classname": "Actions auth actions should create an action for requesting login",
    //     "file": 2,
    //     "result": "success"
    // },
    // {
    //     "classname": "Actions auth actions should create an action for a failed login",
    //     "file": 3,
    //     "result": "failure"
    // }];

    for (i = 0; i < tests.length; i++) {
        if (tests[i]["result"] == "success") {
            successCount++;
        }
        else {
            failureCount++;
        }
    }
    totalCount = tests.length;
    console.log('totalCount: ' + totalCount + ', ' + 'successCount: ' + successCount);

    if (totalCount != 0 && successCount != 0)
        successRate = (successCount / totalCount) * 100;

    var CircleCISnapShotName = appSettings.CircleCISnapshotSettings.CircleCISnapShotName;
    var total_test_count = appSettings.CircleCISnapshotSettings.total_test_count;
    var test_success_rate = appSettings.CircleCISnapshotSettings.test_success_rate;

    var jsonToPush = `{
                    ${CircleCISnapShotName}: {
                            ${total_test_count} : ${totalCount},
                            ${test_success_rate} : ${Math.round(successRate * 100) / 100}
                        }
                    }`;

    //console.log(jsonToPush);
    callback(jsonToPush);


}
// Get Test Results Count

//Push Snapshot Data to Rails

function pushSnapshotData(result, callback) {
    console.log('pushSnapshotData called........');
    var url = appSettings.CircleCISnapshotSettings.PostURLBaseAddress;
    path = '/' + appSettings.CircleCISnapshotSettings.PostQueryCircleCIPath + '/'
        + repo_id + '/' + appSettings.CircleCISnapshotSettings.PostKeyWord;
    console.log('CircleCI SnapShot Push URL: ' + url + path);
    var querystring = require('querystring');
    var https = require('https');
    var headerContentName = appSettings.CircleCISnapshotSettings.HeaderContentName;
    var data = querystring.stringify({
        // email: email,
        // password: pwd
    });
    console.log("JWT: " + JWT);
    var options = {
        host: url,
        port: 443,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            headerContentName: JWT
        }
    };

    var req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (pushResponseData) {
            //console.log("Response body after Push: " + chunk);

        });
        res.on('end', () => {
            try {
                //console.log('Response ended');                
                callback("Response ended without error");

            } catch (e) {
                console.log(e.message);
            }
        });
    });

    req.on('error', (e) => {
        console.error(e);
        callback(e);
    });

    req.write(data);
    req.end();
}

//Push Snapshot Data to Rails
app.set('port', (process.env.PORT || 8082));
var server = app.listen(app.get('port'), function () {
    try {
        var host = server.address().address
        var port = server.address().port

        console.log("Example app listening at http://%s:%s", host, port)
    }
    catch (e) {
        console.log(e.message);
    }
})