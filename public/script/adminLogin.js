const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const signupLink = document.querySelector('.signup-link');
const loginLink = document.querySelector('.login-link');

signupLink.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
})

loginLink.addEventListener('click', () => {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
})