const menuToggle = document.querySelector('.menu-toggle');
const menuSwitch = document.querySelector('.menu-switch');
const menu = document.querySelector('.menu');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('active');
    menuToggle.classList.toggle('on');
    menuSwitch.classList.toggle('on');
});

menuSwitch.addEventListener('click', () => {
    menu.classList.toggle('active');
    menuSwitch.classList.toggle('on');
    menuToggle.classList.toggle('on');
})