import { Controller, Get, Res } from '@nestjs/common';
import { type Response } from 'express';
import * as path from 'path';

const assets = path.resolve(__dirname, '../assets');

@Controller()
export class AppController {
  @Get('favicon.ico')
  favicon(@Res() res: Response) {
    return res.sendFile(assets + '/icon.webp');
  }
}
