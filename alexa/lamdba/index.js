
'use strict';
var http = require('https'); 


exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
         
     if (event.session.application.applicationId !== "amzn1.ask.skill.645f001e-5ea6-49b3-90ef-a0d9c0ef25a1") {
         context.fail("Invalid Application ID");
      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }
        
        if (event.session.user.accessToken == undefined) {
                var cardTitle = "Welcome to AI Face Lock"
                var speechOutput = "Your axcount is not linked, to start using this skill, please use the companion app to authenticate on Amazon"
                buildSpeechletResponse(cardTitle, speechOutput, "", true);

        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    var cardTitle = "Welcome to AI Face Lock"
    var speechOutput = "Welcome to AI Face Lock"
    callback(session.attributes,
        buildSpeechletResponse(cardTitle, speechOutput, "", false));
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == 'AILockIntent') {
        handleTrackRequest(intent, session, callback);
    }
    else if(intentName == 'AMAZON.HelpIntent')
    {
        callback(session.attributes, buildSpeechletResponseWithoutCard("Please follow hackter.io guide and build out the Face Lock and unlock your bolt, afterwards, just ask face lock to unlock the deadbolt", "", false));
        //buildSpeechletResponseWithoutCard("Please follow hackter.io guide and build out the Face Lock and unlock your bolt", "", false);
    }
    else if (intentName =='AMAZON.CancelIntent' || intentName == 'AMAZON.StopIntent')
    {
        callback(session.attributes, buildSpeechletResponseWithoutCard("Exiting AI Face Lock", "", true));

        //buildSpeechletResponseWithoutCard("Exiting AI Face Lock", "", false);
    }
    else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

function handleTrackRequest(intent, session, callback) {
    
    var url = "https://murmuring-bayou-68628.herokuapp.com/"; //you can use your own
                http.get(url, function(res){ 
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log('BODY: ' + chunk);
                        var chunk = JSON.parse(chunk);
                        

                                
                        if(parseInt(chunk.faceid) == 0)
                        {
                            var urlalexa = "https://murmuring-bayou-68628.herokuapp.com/pubnub"; //you can use your own
                            http.get(urlalexa, function(res1){ 
                                res1.setEncoding('utf8');
                                res1.on('data', function (chunk1) {
                                    console.log('BODY: ' + chunk1);
                                })})
                            callback(session.attributes, buildSpeechletResponseWithoutCard("Face lock doesn't recognize any user around", "", "true"));

                        }
                        else if (parseInt(chunk.distance) == 0 || parseInt(chunk.breahting) == 0)
                        {
                                                        var urlalexa = "https://murmuring-bayou-68628.herokuapp.com/pubnub"; //you can use your own
                            http.get(urlalexa, function(res1){ 
                                res1.setEncoding('utf8');
                                res1.on('data', function (chunk1) {
                                    console.log('BODY: ' + chunk1);
                                })})
                            callback(session.attributes, buildSpeechletResponseWithoutCard("Walabot is not detecting people's presence", "", "true"));
                        }
                        else
                        {   
                            var urlalexa = "https://murmuring-bayou-68628.herokuapp.com/alexa"; //you can use your own
                            http.get(urlalexa, function(res1){ 
                                res1.setEncoding('utf8');
                                res1.on('data', function (chunk1) {
                                    console.log('BODY: ' + chunk1);
                                })})
                            callback(session.attributes, buildSpeechletResponseWithoutCard("Unlocking deadbolt...", "", "true"));
                        }

                    })
                }).on('error', function (e) { 
                        callback(session.attributes, buildSpeechletResponseWithoutCard("There was a problem Connecting to your AI Lock", "", "true"));
                })
    //callback(session.attributes, buildSpeechletResponseWithoutCard("test", "", "true"));
    
    //callback(session.attributes, buildSpeechletResponseWithoutCard("Face lock doesn't see you around", "", "true"));
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
