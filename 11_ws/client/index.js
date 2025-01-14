const readline = require('readline');
const axios = require('axios');
const WebSocket = require('ws');

// Конфигурация
const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

let token = null;
let wsClient = null;
let activeTimers = [];
let oldTimers = [];

// Создаём интерфейс для интерактивного ввода
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'CLI> ',
});

// Функция аутентификации WebSocket клиента
function authenticateWebSocket() {
  if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
    wsClient = new WebSocket(WS_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    wsClient.on('message', (data) => {
      const { event, payload } = JSON.parse(data);

      if (event === 'all_timers') {
        oldTimers = payload;
      } else if (event === 'active_timers') {
        activeTimers = payload;
      }
    });

    wsClient.on('open', () => {
      console.log('WebSocket connection established.');
    });

    wsClient.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    wsClient.on('close', () => {
      console.log('WebSocket connection closed.');
    });
  }
}

// Основной процесс работы
async function main() {
  console.log('Welcome to the CLI Timer App!');
  console.log('Type "help" to see available commands.');

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    // Проверяем состояние авторизации
    if (!token && input !== 'signup' && input !== 'login' && input !== 'exit' && input !== 'help') {
      console.log('You need to login first.');
      rl.prompt();
      return;
    }

    switch (input) {
      case 'help':
        console.log(`
Available commands:
  signup         - Register a new user
  login          - Log in as an existing user
  logout         - Log out of the current session
  start          - Start a new timer
  stop           - Stop an active timer
  status         - View active timers
  status old     - View old timers
  exit           - Exit the application
`);
        break;

      case 'signup':
        await signup();
        break;

      case 'login':
        await login();
        break;

      case 'logout':
        logout();
        break;

      case 'start':
        await startTimer();
        break;

      case 'stop':
        await stopTimer();
        break;

      case 'status':
        displayTimers(activeTimers);
        break;

      case 'status old':
        displayTimers(oldTimers);
        break;

      case 'exit':
        exitApp();
        return;

      default:
        console.log('Unknown command. Type "help" for a list of commands.');
    }

    rl.prompt();
  });
}

// Регистрация пользователя
async function signup() {
  const username = await question('Enter username: ');
  const password = await question('Enter password: ');

  try {
    await axios.post(`${API_URL}/signup`, { username, password });
    console.log('Signup successful. You can now log in.');
  } catch (error) {
    console.error('Error during signup:', error.response?.data || error.message);
  }
}

// Логин пользователя
async function login() {
  const username = await question('Enter username: ');
  const password = await question('Enter password: ');

  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    token = response.data.token;
    console.log('Login successful.');
    authenticateWebSocket();
  } catch (error) {
    console.error('Error during login:', error.response?.data || error.message);
  }
}

// Логаут пользователя
function logout() {
  token = null;
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
  activeTimers = [];
  oldTimers = [];
  console.log('Logged out successfully.');
}

// Запуск нового таймера
async function startTimer() {
  const description = await question('Enter timer description: ');

  try {
    await axios.post(
      `${API_URL}/timers/start`,
      { description },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Timer started.');
  } catch (error) {
    console.error('Error starting timer:', error.response?.data || error.message);
  }
}

// Остановка таймера
async function stopTimer() {
  const id = await question('Enter timer ID to stop: ');

  try {
    await axios.post(
      `${API_URL}/timers/stop`,
      { id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Timer stopped.');
  } catch (error) {
    console.error('Error stopping timer:', error.response?.data || error.message);
  }
}

// Отображение таймеров
function displayTimers(timers) {
  console.table(timers);
}

// Завершение программы
function exitApp() {
  console.log('Exiting...');
  rl.close();
  if (wsClient) {
    wsClient.close();
  }
}

// Функция для ввода данных
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Запуск основного процесса
main();

