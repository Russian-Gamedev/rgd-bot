import 'reflect-metadata';
//import '@sapphire/plugin-scheduled-tasks';
//import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-api';
import '@sapphire/plugin-api/register';
import '@sapphire/plugin-logger';
import '@sapphire/plugin-logger/register';
import '@kaname-png/plugin-sentry/register';

process.env.NODE_ENV ??= 'development';
