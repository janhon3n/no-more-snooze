const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment')
const server = express()

server.use(bodyParser.json())
server.use(cors())

var alarm = {
    hours: 8,
    minutes: 15
}

server.get('/alarm', (request, response) => {
    response.json(alarm)
})

server.post('/alarm', (request, response, next) => {
    let postedAlarm = request.body.alarm
    if (postedAlarm === null) alarm = null
    else {
        try {
            validateAlarm(postedAlarm)
            alarm = postedAlarm
            response.json(alarm)
        } catch (error) {
            next(error)
        }
    }
})

server.listen(3010, () => {
    console.log("Listening on port 3010")
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
    response.json({error:error.message})
})