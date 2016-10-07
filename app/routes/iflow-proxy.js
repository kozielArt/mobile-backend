module.exports = function(baseUrl){
    var request = require('request');
    
    if(baseUrl.indexOf('/', baseUrl.length - 1) !== -1)
        baseUrl = baseUrl.substr(0, baseUrl.length - 1);
    
    var process = function(req, res, next){
        console.log('Proxying: ', req.method, new Array(10 - req.method.length).join(' '));
        var restUrl = baseUrl + req.originalUrl;

        try {
            request({
                url: restUrl,
                method: req.method,
                body: req.rawBody,
                headers: req.headers
            }, function (error, response, body){
                if(!error){
                    var newRes = res.status(response.statusCode);
                    //przepisanie nagłówków z oryginalnej odpowiedzi
                    for(var headerName in response.headers){
                        newRes = newRes.set(headerName, response.headers[headerName]);
                    }
                    newRes.send(body);
                }else{
                    console.log('Error: ', error);
                    res.status(500).send(error);
                }
                next();
            });
        } catch (err) {
            console.log('Exception caught: ', err);
            res.status(500).send(err);
            next();
        }
    };
    
    return function(req, res, next) {
        var restUrl = baseUrl + req.originalUrl;
        console.log('GOT : ', req.method, new Array(10 - req.method.length).join(' '), restUrl);
        req.setEncoding('utf8');
        console.log('1');
        req.rawBody = '';
        req.on('data', function(chunk) {
            //dopisywanie fragmentów body do pola rawBody
            req.rawBody += chunk;
        });
        req.on('end', function(){
            //całe żądanie doszło - przetwarzamy
            process(req, res, next);
        });
    };
    
};