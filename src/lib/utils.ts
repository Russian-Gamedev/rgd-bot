import { exec } from 'child_process';

export const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const execAsync = (command: string) => {
  return new Promise<string>((res) => {
    exec(command, (_err, stdout) => {
      res(stdout.trim());
    });
  });
};
