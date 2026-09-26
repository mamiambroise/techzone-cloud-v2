import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { Public } from './iam/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check — route publique explicitement déclarée.
   * Aucune authentification requise.
   */
  @Get('health')
  @Public()
  getHealth() {
    return this.appService.getHealth();
  }

  /**
   * Route racine — publique (health équivalent).
   */
  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }
}