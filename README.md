<div align='center'>
<img src='https://assets.rgd.chat/banner.jpg'  alt='rgd logo'>

# Russian GameDev Bot

[![Discord Link](https://dcbadge.vercel.app/api/server/5kZhhWD)](https://discord.gg/5kZhhWD)

</div>

## Разработка

После клонирования проекта и установки зависимостей с помощью `pnpm i`, запустите бота разработки:

> Мы используем _[pnpm](https://github.com/pnpm/pnpm)_ для разработки

```bash
pnpm start:dev
```

Для работы необходим PostgreSQL и Redis, их можно установить самостоятельно установить, или же воспльзоваться командой для запуска в докере

```bash
pnpm compose:dev
```

Так же стоит скопировать файл `.env.example` в `.development.env` и заполнить их данными.
