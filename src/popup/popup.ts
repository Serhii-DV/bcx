import 'src/utils/console';

console.log('Running popup');

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('clickMeBtn');
  const messageDiv = document.getElementById('message');

  button?.addEventListener('click', () => {
    if (messageDiv) {
      messageDiv.textContent = 'Button clicked! 🎉';
    }
  });
});
