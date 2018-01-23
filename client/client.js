(function () {
    window.apiUrl = 'http://localhost:3010/alarm'
    var lastSeenAlarm = null

    // ui elemets
    var timeInput
    var clearButton
    var infoText

    $(document).ready(() => {
        timeInput = $('input[type="time"]')
        clearButton = $('#clear-button')
        infoText = $('#info')
        setButton = $('#set-button')
        setButton.click(createAndSendAlarm)
        clearButton.click(sendNullValueForClearingAlarm)
        fetchAndUpdateAlarm();
        setInterval(fetchAndUpdateAlarm, 5000);
    })

    async function fetchAndUpdateAlarm() {
        let alarm
        try {
            alarm = await fetchAlarm()
        } catch (error) {
            handleError(error)
        }
        updateAlarmState(alarm)
    }

    async function createAndSendAlarm() {
        let timeString = timeInput.val()
        let newAlarm = createAlarmFromTimeString(timeString);
        try {
            await postAlarm(newAlarm)
        } catch (error) {
            handleError(error)
        }
        updateAlarmState(newAlarm)
    }
    async function sendNullValueForClearingAlarm() {
        try {
            await postAlarm(null)
        } catch (error) {
            handleError(error)
        }
        updateAlarmState(null)
    }


    function updateAlarmState(alarm) {
        if (!alarmsAreTheSame(alarm, lastSeenAlarm)) {
            if (alarm === null) {
                updateUiForNoAlarm()
            } else {
                updateUiForAlarm(alarm)
            }
            lastSeenAlarm = alarm
        }
    }

    function createAlarmFromTimeString(timeString) {
        let [hours, minutes] = timeString.split(":")
        hours = Number(hours)
        minutes = Number(minutes)
        return {
            hours: hours,
            minutes: minutes
        }
    }


    //network stuff
    async function fetchAlarm() {
        let response = await $.get(window.apiUrl)
        if (response === undefined)
            throw new Error('Alarm is invalid')
        return response
    }

    async function postAlarm(alarm) {
        let response = await $.ajax({
            type: "POST",
            url: window.apiUrl,
            data: JSON.stringify({ alarm: alarm }),
            contentType: 'application/json'
        });
        if (response.error) throw new Error(response.error)
    }



    function calculateTimeToSleep(alarm) {
        let dateNow = new Date()
        let hoursToSleep = 0
        let minutesToSleep = alarm.minutes - dateNow.getMinutes()
        console.log(minutesToSleep)
        if (minutesToSleep < 0) {
            minutesToSleep += 60
            hoursToSleep -= 1
        }
        hoursToSleep += alarm.hours - dateNow.getHours()
        console.log(hoursToSleep)
        if (hoursToSleep < 0) hoursToSleep += 24
        return {
            hours: hoursToSleep,
            minutes: minutesToSleep
        }
    }

    function createTimeValueFromAlarm(alarm) {
        let hours = alarm.hours + ''
        let minutes = alarm.minutes + ''
        if (hours.length === 1) hours = '0' + hours
        if (minutes.length === 1) minutes = '0' + minutes
        return '' + hours + ':' + minutes
    }

    function alarmsAreTheSame(alarm1, alarm2) {
        if (alarm1 === null && alarm2 === null) return true
        if (alarm1 === null && alarm2 !== null) return false
        if (alarm2 === null && alarm1 !== null) return false
        return (alarm1.minutes === alarm2.minutes && alarm1.hours === alarm2.hours)
    }


    // UI updating
    function updateUiForAlarm(alarm) {
        timeInput.val(createTimeValueFromAlarm(alarm))
        clearButton.attr('disabled', false)
        updateInfoTextFromAlarm(alarm)
        $('body').attr('alarm-is-set', true)
    }

    function updateUiForNoAlarm() {
        timeInput.val('')
        clearButton.attr('disabled', true)
        updateInfoTextFromAlarm(null)
        $('body').attr('alarm-is-set', false)
    }

    function updateInfoTextFromAlarm(alarm) {
        if (alarm !== null) {
            let timeToSleep = calculateTimeToSleep(alarm)
            infoText.text('You have ' + timeToSleep.hours + ' hours and ' + timeToSleep.minutes + ' minutes to sleep')
        } else
            infoText.text('Alarm is not set')
    }

    function handleError(error) {
        alert(error.message)
        window.location.reload()
    }
}())