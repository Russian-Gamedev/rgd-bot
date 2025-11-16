<div align='center'>

# Russian GameDev Bot

[![Discord Link](https://bot.rgd.chat/embed/invite/TGZ4CDxWRC/banner)](https://discord.gg/TGZ4CDxWRC)

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
