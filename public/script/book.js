const vno = document.getElementById('vehicleNo');
const date = document.getElementById('date');
const time = document.getElementById('time');
const duration = document.getElementById('duration');
function vnoFunc() {
    if (vno.value) {
        vno.parentElement.classList.add('active')
    }
    else {
        vno.parentElement.classList.remove('active')
    }
}
function dateFunc() {
    if (date.value) {
        date.parentElement.classList.add('active')
    }
    else {
        date.parentElement.classList.remove('active')
    }
}
function timeFunc() {
    if (time.value) {
        time.parentElement.classList.add('active')
    }
    else {
        time.parentElement.classList.remove('active')
    }
}

duration.addEventListener('change', () => {
    if (duration.value) {
        duration.parentElement.classList.add('active')
    }
    else {
        duration.parentElement.classList.remove('active')
    }
})