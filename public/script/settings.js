const old_password_toggle = document.getElementById('old_password_toggle');
const old_password = document.getElementById('old_password');

old_password_toggle.addEventListener('click', function (e) {
    // toggle the type attribute
    const type = old_password.getAttribute('type') === 'password' ? 'text' : 'password';
    old_password.setAttribute('type', type);
    // toggle the eye slash icon
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
})

const new_password_toggle = document.getElementById('new_password_toggle');
const new_password = document.getElementById('new_password');

new_password_toggle.addEventListener('click', function (e) {
    // toggle the type attribute
    const type = new_password.getAttribute('type') === 'password' ? 'text' : 'password';
    new_password.setAttribute('type', type);
    // toggle the eye slash icon
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
})

const confirm_password_toggle = document.getElementById('confirm_password_toggle');
const confirm_password = document.getElementById('confirm_password');

confirm_password_toggle.addEventListener('click', function (e) {
    // toggle the type attribute
    const type = confirm_password.getAttribute('type') === 'password' ? 'text' : 'password';
    confirm_password.setAttribute('type', type);
    // toggle the eye slash icon
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
})