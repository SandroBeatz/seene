---
version: 1.0
date: 2026-04-17
---

# Theme & CSS Variables

> Version 1.0 · 2026-04-17

## Overview

Nuxt UI v3 определяет набор семантических CSS-переменных (`--ui-*`) и автоматически регистрирует для них Tailwind-утилиты. Это означает, что вместо `text-(--ui-text-muted)` нужно писать просто `text-muted` — Tailwind знает об этом алиасе благодаря `@nuxt/ui` в `main.css`.

`theme.css` — справочный файл, не импортируется. Источник истины — `app/assets/css/main.css`.

---

## Architecture

Цепочка разрешения цвета:

```
color="primary"  →  --ui-color-primary-{n}  →  --color-gold-{n}  →  #d6b97a
```

Nuxt UI при инициализации читает `app.config.ts` и создаёт мост:
```
--ui-color-primary-{n}  →  var(--color-gold-{n})
--ui-color-neutral-{n}  →  var(--color-warm-{n})
```

Семантические переменные (`--ui-text-muted`, `--ui-bg-elevated` и т.д.) задаются вручную в `:root` и `.dark` в `main.css` — они ссылаются на `--ui-color-neutral-*`.

Tailwind-утилиты (`text-muted`, `bg-elevated`) — это короткие алиасы, которые `@nuxt/ui` добавляет в Tailwind-конфиг при импорте. Никакой ручной регистрации не нужно.

---

## Configuration

### Цветовые шкалы (`@theme static` в `main.css`)

Определяются один раз и дают доступ к Tailwind-классам вида `bg-gold-500`, `text-warm-200`:

| Шкала   | Назначение                          | Пример класса   |
|---------|-------------------------------------|-----------------|
| `gold`  | Primary / brand accent              | `bg-gold-500`   |
| `olive` | Secondary accent (`color="olive"`)  | `text-olive-600`|
| `warm`  | Neutral (текст, фон, рамки)         | `bg-warm-100`   |

### Семантические переменные (`:root` / `.dark` в `main.css`)

Переопределяются при необходимости изменить дефолты Nuxt UI.

**Текст**

| CSS-переменная        | Утилита           | Светлая тема | Тёмная тема  |
|-----------------------|-------------------|--------------|--------------|
| `--ui-text-dimmed`    | `text-dimmed`     | warm-500     | warm-600     |
| `--ui-text-muted`     | `text-muted`      | warm-600     | warm-500     |
| `--ui-text-toned`     | `text-toned`      | warm-700     | warm-400     |
| `--ui-text`           | `text-default`    | warm-900     | warm-200     |
| `--ui-text-highlighted` | `text-highlighted` | warm-900  | white        |
| `--ui-text-inverted`  | `text-inverted`   | white        | warm-900     |

**Фон**

| CSS-переменная     | Утилита       | Светлая тема | Тёмная тема  |
|--------------------|---------------|--------------|--------------|
| `--ui-bg`          | `bg-default`  | warm-100     | warm-950     |
| `--ui-bg-muted`    | `bg-muted`    | warm-50      | warm-900     |
| `--ui-bg-elevated` | `bg-elevated` | warm-50      | warm-800     |
| `--ui-bg-accented` | `bg-accented` | warm-200     | warm-700     |
| `--ui-bg-inverted` | `bg-inverted` | warm-900     | white        |

**Рамки**

| CSS-переменная          | Утилита           | Светлая тема | Тёмная тема  |
|-------------------------|-------------------|--------------|--------------|
| `--ui-border`           | `border-default`  | warm-300     | warm-800     |
| `--ui-border-muted`     | `border-muted`    | warm-200     | warm-900     |
| `--ui-border-accented`  | `border-accented` | warm-300     | warm-700     |
| `--ui-border-inverted`  | `border-inverted` | warm-900     | white        |

**Прочие**

| CSS-переменная      | Назначение                            |
|---------------------|---------------------------------------|
| `--ui-primary`      | Акцентный цвет (кнопки, focus-ring)   |
| `--ui-radius`       | Базовый радиус, масштабирует `rounded-*` |

---

## Usage

### ✅ Правильно — короткие утилиты

```html
<p class="text-muted">Вторичный текст</p>
<div class="bg-elevated border border-default rounded-lg">...</div>
<span class="text-dimmed">Подсказка</span>
<div class="bg-accented text-highlighted">...</div>
```

### ❌ Неправильно — прямое обращение к переменной в классе

```html
<!-- Не делать так: -->
<p class="text-(--ui-text-muted)">...</p>
<div class="bg-(--ui-bg-elevated)">...</div>
```

Прямой синтаксис `text-(--ui-text-muted)` работает в Tailwind v4, но он многословен и не нужен — алиасы уже зарегистрированы Nuxt UI.

### Цвета бренда в классах (шкалы, не семантика)

```html
<!-- Когда нужен конкретный оттенок, а не семантическая роль: -->
<span class="text-gold-600">Золотой акцент</span>
<div class="bg-olive-100 dark:bg-olive-900">Оливковый фон</div>
```

### Компонентные props vs. CSS-классы

Для компонентов Nuxt UI используй `color` prop, не класс:

```html
<!-- ✅ -->
<UButton color="primary" />
<UBadge color="olive" />

<!-- ❌ — класс не пробрасывается внутрь компонента -->
<UButton class="bg-primary" />
```

---

## File Structure

```
app/assets/css/
├── main.css     # Источник истины: @theme static, :root, .dark — всё сюда
└── theme.css    # Справочник (НЕ импортируется). Содержит --seene-* переменные — устаревшие, не использовать

app/
└── app.config.ts  # ui.theme.colors — регистрирует olive как цвет компонентов
```
