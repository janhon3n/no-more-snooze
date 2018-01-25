const config = require('./config.json');
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const request = require('request');
const winAudio = require('win-audio');
const moment = require('moment')
const server = express()
const childProcess = require('child_process'); 
const port = 3010

var speaker = winAudio.speaker

server.use(bodyParser.json())
server.use(cors())
server.use('/play-alarm-public/', express.static('play-alarm'))

var alarm = null
var alarmTimeout
var volumeIncreaseInterval
var volumeIncreasesLeft = 0

server.get('/alarm', (request, response) => {
    response.json(alarm)
})

server.get('/play-alarm', (request, response) => {
    response.sendFile(__dirname+'/play-alarm/play-alarm.html')
})

server.get('/newsapi', (req, res) => {
    request(config.newsApiUrl, (error, response, body) => {
        res.send(body)
    })
})

server.post('/alarm', (request, response, next) => {
    let postedAlarm = request.body.alarm
    if (postedAlarm === null) alarm = null
    else {
        try {
            validateAlarm(postedAlarm)
            setUpAlarm(postedAlarm)
            response.json(alarm)
        } catch (error) {
            next(error)
        }
    }
})

server.listen(port, () => {
    console.log('Listening on port 3010')
})


function validateAlarm(alarm) {
    if (alarm === undefined || alarm === null ||
        alarm.hours === undefined ||
        alarm.minutes === undefined)
        throw new Error('Alarm or one of its properties is undefined')
    if (typeof (alarm.hours) !== 'number' ||
        !Number.isInteger(alarm.hours) ||
        alarm.hours < 0 || alarm.hours > 23)
        throw new Error('The hours are not valid')
    if (typeof (alarm.minutes) !== 'number' ||
        !Number.isInteger(alarm.minutes) ||
        alarm.minutes < 0 || alarm.minutes > 60)
        throw new Error('The minutes are not valid')
}

server.use((error, request, response, next) => {
    console.log('Error has occured D:')
    console.log(error)
    console.log(request)
    response.json({ error: error.message })
})


function setUpAlarm(alarmToSet) {
    alarm = alarmToSet // store alarm to memory
    clearTimeout(alarmTimeout)
    let millisecondsBeforeAlarm = calculateMillisecondsToAlarm(alarmToSet)
    let durationToAlarm = moment.duration(millisecondsBeforeAlarm)
    console.log('Setting alarm at ' + alarmToSet.hours + ':'
        + (alarmToSet.minutes < 10 ?
            '0' + alarmToSet.minutes : alarmToSet.minutes) + '.')
    console.log('Time before alarm: ' + durationToAlarm.hours() + ' hours and ' + durationToAlarm.minutes() + ' minutes.')
    setTimeout(playAlarm, millisecondsBeforeAlarm)
}


function calculateMillisecondsToAlarm(alarm) {
    let alarmMoment = moment().set('hour', alarm.hours)
        .set('minute', alarm.minutes)
    if (alarmMoment.isBefore(moment()))
        alarmMoment.add(1, 'days')
    return alarmMoment.diff(moment())
}

function playAlarm() {
    speaker.set(15)
    speaker.unmute()
    volumeIncreasesLeft = 5
    volumeIncreaseInterval = setInterval(() => {
        if(volumeIncreasesLeft-- > 0)
            speaker.increase(5)
        else
            clearInterval(volumeIncreaseInterval)
        }, 60000)
    childProcess.exec('start chrome --app=http://localhost:3010/play-alarm');
}