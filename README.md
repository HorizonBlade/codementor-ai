# CodeMentor AI 🧠✨

**CodeMentor AI** is a premium desktop application built with **Electron + React + Monaco Editor + Zustand**, acting as your personal interactive programming mentor. 

The app generates algorithmic and practical coding challenges across various difficulty levels, compiles and executes your code locally in a sandbox, and provides intelligent Socratic reviews using AI. Instead of spoiling the solution with copy-paste code, the AI mentor guides you conceptually through hints and thought-provoking questions.

---

## 🌟 Features (English)

### 1. Intelligent Task Generator
* **Flexible parameters**: Choose programming language, topic (Arrays, Strings, Hash Tables, Stacks, Queues, Trees, Graphs, Dynamic Programming, etc.), and task style (algorithmic or practical).
* **5 difficulty levels**: From *Newbie* to *Expert*, awarding XP and calculating recommended completion times.
* **Challenge options**: Race against the clock with custom timers and configure limits on available hints.
* **Duplicate prevention**: Tracks the history of your last 50 tasks and employs smart negative prompting (with temperature `0.7`) combined with client-side verification loop to guarantee you never see the same task twice.

### 2. Local Code Execution Sandbox
* Runs code locally via `child_process` — no network overhead, completely secure, and does not consume any LLM tokens.
* Out-of-the-box compilation, execution, and log outputs (stdout, stderr, and compilation errors) for:
  * **Python** (via `python` interpreter)
  * **JavaScript** (via `node` runtime)
  * **TypeScript** (run on the fly via `npx tsx`)
  * **Go** (`go run`)
  * **C#** (via `dotnet-script`)
  * **C++ / Java / Rust** (automatic pre-compilation using `g++`, `javac`, and `rustc` inside the OS temp directory, with automatic cleanup of binaries).
* Built-in 15-second execution timeout protection to prevent infinite loops from hanging the system.

### 3. Socratic AI Review & Assistant Chat
* **Pedagogical feedback**: Provides a score (0 to 100), comments, time complexity ($O(N)$), and space complexity analysis compared to the optimal approach.
* **Interactive Chat Assistant**: A small collapsible chat window in the corner allows you to ask questions about the task, algorithms, or syntax. The AI uses pedagogical guidelines to explain concepts without giving away the final code.
* **Bypass reasoning latency**: Automatically disables OpenRouter thinking/reasoning phases (via `"reasoning": { "enabled": false }` payload tuning) for ultra-fast task generation and token efficiency.
* **JSON Auto-Repair Engine**: Custom backend logic cleans markdown code fences, closes unclosed braces and brackets (recovers truncated responses), escapes newlines/tabs, and removes trailing commas to ensure stable parsing even on lightweight or free models.

### 4. API Key Pool Manager with Failover
* Load multiple OpenRouter API keys in the settings panel.
* Selects keys using a **Round-Robin** algorithm.
* Automatically handles API errors (such as `429 Rate Limit` or auth issues) by rotating keys or flagging failed keys with a 60-second recovery timeout.
* Built-in presets for free models (Llama, Qwen, Gemma) and easy connectivity testing.

### 5. Full Bilingual Localization (EN / RU)
* Toggle the entire user interface (menus, progress tracking, stats, settings) instantly between English and Russian.
* Contextual LLM instructions: When Russian is selected, the generated tasks (description, examples, hints) and Socratic feedback are written exclusively in high-quality, natural Russian without mixing languages.

### 6. Personal Profile & Statistics
* Track solved tasks categorized by difficulty.
* Earn XP, maintain a daily activity streak, and view a visual GitHub-style activity heat map.
* Filter and review past attempts in the interactive history table.

---

## 🛠️ Technology Stack

* **Frontend**: React (Functional Components, Hooks), Lucide React (Icons).
* **Styling**: Vanilla CSS, Space Dark Theme (glassmorphism UI, glowing neon accents, and smooth micro-animations).
* **State Management**: Zustand (persisted settings, task history, active challenges, and output buffers).
* **Editor**: `@monaco-editor/react` (syntax highlighting, line numbers, and indentation).
* **Backend**: Node.js inside Electron (IPC channels, filesystem, child processes).
* **Testing**: Vitest unit testing framework.
* **Data Storage**: Local JSON-based files stored in the user's secure OS AppData directory.

---

## 🚀 Quick Start

### Prerequisites
Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher)
* Compiler/interpreter for your preferred language (e.g., `python` for Python, `g++` for C++, `go` for Go) if you want to execute code locally.

### Installation & Run
1. Clone the repository:
   ```bash
   git clone https://github.com/HorizonBlade/codementor-ai.git
   cd codementor-ai
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application in developer mode:
   ```bash
   npm run dev
   ```

### Running Tests
To run the Vitest unit tests:
```bash
npm run test
```

### Packaging the Application
To build a production bundle (`dist/index.html`) and package the app for your OS:
```bash
npm run build
```

---

## 🔒 Security
All API keys, code solutions, settings, and stats are stored **strictly locally** on your machine. All API calls are made directly to the OpenRouter gateway without passing through third-party servers.

---

## 📄 License
This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** - see the [LICENSE](file:///C:/Users/lazer/Documents/codementor-ai/LICENSE) file for details.

---
---

# CodeMentor AI (На русском) 🧠✨

**CodeMentor AI** — это настольное приложение премиум-класса, разработанное на связке **Electron + React + Monaco Editor + Zustand**, которое выступает в роли вашего персонального интерактивного наставника по программированию. 

Приложение генерирует практические задачи различной сложности, локально компилирует и запускает ваш код прямо на компьютере, а затем отправляет его на интеллектуальный разбор ИИ-наставнику по методу Сократа — помогая вам найти решение с помощью наводящих вопросов и подсказок, без прямого спойлера готового кода.

---

## 🌟 Основные возможности (На русском)

### 1. Интеллектуальный генератор задач (Task Generator)
* **Параметры генерации**: Выбор языка программирования, темы (Массивы, Строки, Хеш-таблицы, Стеки, Очереди, Деревья, Графы, Динамическое программирование и др.) и стиля задачи (алгоритмический или прикладной).
* **5 уровней сложности**: От *Новичка (Newbie)* до *Эксперта (Expert)* с начислением XP и расчётом рекомендуемого времени.
* **Дополнительные настройки**: Испытания на время с таймером обратного отсчёта и ограничение числа доступных подсказок.
* **Защита от повторов**: Приложение отслеживает последние 50 сгенерированных задач и использует метод негативного промптинга (с температурой `0.7`) совместно с фоновым циклом валидации, гарантируя, что задачи никогда не будут повторяться.

### 2. Локальный запуск и песочница (Local Runner)
* Выполнение кода происходит локально на вашем компьютере через `child_process` без отправки в сеть и без затрат токенов.
* Поддерживается автоматическая компиляция, запуск и вывод логов (stdout/stderr/ошибки компиляции) для следующих языков:
  * **Python** (интерпретатор `python`)
  * **JavaScript** (рантайм `node`)
  * **TypeScript** (запуск на лету через `npx tsx`)
  * **Go** (`go run`)
  * **C#** (через `dotnet-script`)
  * **C++ / Java / Rust** (автоматическая предварительная компиляция через `g++`, `javac`, `rustc` во временную папку ОС с последующим автоматическим удалением бинарных файлов).
* Ограничение времени выполнения в 15 секунд для предотвращения бесконечных циклов в коде.

### 3. Интерактивный разбор ИИ и Чат-помощник (Socratic AI Review)
* **Педагогический разбор**: Оценка решения (от 0 до 100), текстовый отзыв, оценка временной ($O(N)$) и пространственной сложности вашего решения по сравнению с оптимальным.
* **Встроенный чат-ассистент**: Небольшое окно чата в углу экрана позволяет задавать любые вопросы по условию задачи, синтаксису или алгоритмам. Помощник объясняет концепции наводящими вопросами и не выдает готовое решение.
* **Отключение задержек рассуждения**: Автоматическое отключение долгой фазы рассуждений ИИ-моделей (через параметры запроса `"reasoning": { "enabled": false }`) для мгновенного получения ответов и экономии токенов.
* **Система авто-ремонта JSON**: Встроенная система очистки ответов ИИ на бэкенде автоматически вырезает JSON-объект, закрывает обрезанные скобки (при нехватке токенов у ИИ), экранирует неявные переносы строк/табуляции и исправляет висячие запятые, гарантируя стабильную работу на любых моделях.

### 4. Ротация API-ключей и Пресеты (Key Manager)
* Поддержка пула API-ключей OpenRouter с алгоритмом **Round-Robin** (выбор следующего ключа при запросах).
* Автоматическая обработка сетевых ошибок (`rate-limits`, сбои авторизации) с переключением на резервный рабочий ключ.
* Встроенный авто-роутер бесплатных моделей **`openrouter/free`** и готовые пресеты для популярных свободных моделей с возможностью быстрого тестирования соединения.

### 5. Полная двуязычная локализация (RU / EN)
* Мгновенное переключение интерфейса (меню, формы, настройки, графики) между русским и английским языками.
* Локализация бэкенд-инструкций: если выбран русский язык, сгенерированные задачи (описание, примеры, подсказки) и ответы наставника приходят исключительно на русском языке, без англо-русской смеси в тексте.

### 6. Личный кабинет и статистика (Progress)
* Отслеживание количества решённых задач по уровням сложности.
* Система накопления опыта (XP) и отслеживания серии дней активности (Streak) с сохранением лучшего результата.
* Календарь активности (Activity Heatmap) и интерактивная таблица истории попыток.
* Сохранение всех данных локально на диске через `electron-store`.

---

## 🛠️ Технологический стек

* **Frontend**: React (Functional Components, Hooks), Lucide React (иконки).
* **Стилизация**: CSS-переменные, космическая тёмная тема (Glassmorphic UI, неоновые свечения, плавные анимации переходов).
* **Состояние**: Zustand (хранение настроек, истории, текущей задачи и результатов).
* **Редактор**: `@monaco-editor/react` (подсветка синтаксиса, нумерация строк, автоформатирование).
* **Бэкенд**: Node.js в Electron (IPC-каналы, файловая система `fs`, выполнение команд `child_process`).
* **Тестирование**: фреймворк Vitest.
* **База данных**: Локальные JSON-файлы конфигурации в каталоге AppData пользователя.

---

## 🚀 Быстрый запуск

### Требования
Убедитесь, что на вашем компьютере установлены:
* [Node.js](https://nodejs.org/) (версии 18 или выше)
* Компилятор/интерпретатор для вашего любимого языка программирования (например, `python` для Python или `g++` для C++), если вы хотите использовать локальный запуск кода.

### Установка
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/HorizonBlade/codementor-ai.git
   cd codementor-ai
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите приложение в режиме разработчика:
   ```bash
   npm run dev
   ```

### Запуск тестов
Для запуска тестов Vitest выполните:
```bash
npm run test
```

### Сборка дистрибутива
Для сборки готового `.exe` (для Windows) или пакета под вашу ОС выполните:
```bash
npm run build
```

---

## 🔒 Безопасность
Все ваши API-ключи, история решений и настройки хранятся **исключительно локально** на вашем компьютере в защищённой папке данных приложения. Запросы отправляются напрямую на сервер шлюза OpenRouter без посредничества сторонних серверов.

---

## 📄 Лицензия
Этот проект распространяется под свободной лицензией **GNU General Public License v3.0 (GPL-3.0)**. Вы можете использовать и изменять код, но любые производные продукты обязаны сохранять авторство и распространяться под аналогичной открытой лицензией. Подробности смотрите в файле [LICENSE](file:///C:/Users/lazer/Documents/codementor-ai/LICENSE).
