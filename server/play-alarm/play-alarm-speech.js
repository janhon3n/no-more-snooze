$(document).ready(() => {
    console.log('moi')
    loadWeatherText()
    loadNewsText()
    initSpeech()
})

var speechStarted = false

var weatherText = null
var newsText = null

function initSpeech() {
    speechSynthesis.getVoices()
    speechSynthesis.onvoiceschanged = () => {
        if (!speechStarted)
            setupUtter()
    }
}
function setupUtter() {
    let voices = speechSynthesis.getVoices()
    speechStarted = true
    let utter = new SpeechSynthesisUtterance()
    utter.voice = voices.filter((v) => {
        return (v.name === 'Google UK English Male')
    })[0]
    utter.rate = 0.9
    utter.volume = 0.8
    setTimeout(() => {
        fireSpeech(utter)
    }, 5*60000)
}

function fireSpeech(utter) {
    let text = 'Good morning sir. '
    let now = moment()
    text += 'Today is ' + now.format('dddd') + ' the ' + now.format('Do') + ' of ' + now.format('MMMM') + '. '
    text += 'The time is ' + now.format('LT') + '. '
    if (weatherText !== null) text += weatherText
    if (newsText !== null) text += newsText
    console.log(text)
    utter.text = text
    speechUtteranceChunker(utter, {
        chunkLength: 120
    });
}


// text loading
async function loadWeatherText() {
    $.simpleWeather({
        location: 'Turku, FI',
        woeid: '',
        unit: 'c',
        success: (weather => {
            weatherText = 'It is ' + weather.temp + ' degrees outside and ' + weather.currently.toLowerCase() + '. '
        })
    })
}

async function loadNewsText() {
    let text = "In the news today. "
    $.get('./newsapi', (data) => {
        let news = JSON.parse(data)
        news.articles.forEach((article) => {
            text += article.title + '. '
        })
        newsText = text.split("'").join("")
    })
}

function startMusic() {

}


var speechUtteranceChunker = function (utt, settings, callback) {
    settings = settings || {};
    var newUtt;
    var txt = (settings && settings.offset !== undefined ? utt.text.substring(settings.offset) : utt.text);
    if (utt.voice && utt.voice.voiceURI === 'native') { // Not part of the spec
        newUtt = utt;
        newUtt.text = txt;
        newUtt.addEventListener('end', function () {
            if (speechUtteranceChunker.cancel) {
                speechUtteranceChunker.cancel = false;
            }
            if (callback !== undefined) {
                callback();
            }
        });
    }
    else {
        var chunkLength = (settings && settings.chunkLength) || 160;
        var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
        var chunkArr = txt.match(pattRegex);

        if (chunkArr[0] === undefined || chunkArr[0].length <= 2) {
            //call once all text has been spoken...
            if (callback !== undefined) {
                callback();
            }
            return;
        }
        var chunk = chunkArr[0];
        newUtt = new SpeechSynthesisUtterance(chunk);
        var x;
        for (x in utt) {
            if (utt.hasOwnProperty(x) && x !== 'text') {
                newUtt[x] = utt[x];
            }
        }
        newUtt.addEventListener('end', function () {
            if (speechUtteranceChunker.cancel) {
                speechUtteranceChunker.cancel = false;
                return;
            }
            settings.offset = settings.offset || 0;
            settings.offset += chunk.length - 1;
            speechUtteranceChunker(utt, settings, callback);
        });
    }

    if (settings.modifier) {
        settings.modifier(newUtt);
    }
    console.log(newUtt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
    //placing the speak invocation inside a callback fixes ordering and onend issues.
    setTimeout(function () {
        newUtt.voice = speechSynthesis.getVoices()[4]
        newUtt.rate = 0.85
        speechSynthesis.speak(newUtt);
    }, 0);
};