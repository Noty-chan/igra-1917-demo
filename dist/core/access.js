// Demo-only front-end gate. GitHub Pages serves static files and cannot enforce
// server-side authentication; keep this password limited to the review site.
const DEMO_USERNAME = 'client';
const DEMO_PASSWORD = '_pXrNWKNEbXu5t2iq2-AR29t';

export function requireDemoLogin() {
  const screen = document.querySelector('#login-screen');
  const app = document.querySelector('#application');
  const form = document.querySelector('#login-form');
  const username = document.querySelector('#login-username');
  const password = document.querySelector('#login-password');
  const error = document.querySelector('#login-error');

  return new Promise(resolve => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const accepted = username.value.trim().toLocaleLowerCase('en-US') === DEMO_USERNAME && password.value === DEMO_PASSWORD;
      if (!accepted) {
        error.textContent = 'Неверный логин или пароль.';
        password.select();
        return;
      }
      error.textContent = '';
      password.value = '';
      screen.hidden = true;
      app.hidden = false;
      resolve();
    });
  });
}
