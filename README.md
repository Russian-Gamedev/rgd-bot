<div align='center'>
<img src='https://assets.rgd.chat/banner.jpg'  alt='rgd logo'>

# Russian GameDev Bot

[![Discord Link](https://dcbadge.limes.pink/api/server/5kZhhWD)](https://discord.gg/5kZhhWD)

</div>

## Разработка

После клонирования проекта и установки зависимостей с помощью `bun i`, запустите бота разработки:

> Мы используем _[bun](https://bun.com)_ для разработки

```bash
bun start:dev
```

Для работы необходим PostgreSQL и Redis, их можно установить самостоятельно установить, или же воспльзоваться командой для запуска в докере

```bash
bun compose:dev
```

Так же стоит скопировать файл `.env.example` в `.env.development` и заполнить их данными.
