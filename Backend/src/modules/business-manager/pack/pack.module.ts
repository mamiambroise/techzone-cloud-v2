import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Pack } from '../entities/pack.entity';
import { PackVersion } from '../entities/pack-version.entity';
import { PackController } from './pack.controller';
import { PackService } from './pack.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pack, PackVersion]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('app.jwtSecret'),
        signOptions: { expiresIn: config.get('app.jwtExpiresIn', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PackController],
  providers: [PackService],
  exports: [PackService],
})
export class PackModule {}
