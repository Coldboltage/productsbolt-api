import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { WebpageUtilsModule } from '../webpage-utils/webpage-utils.module';
import { ListAlertTools } from './alert.tools';
import { DiscordModule } from '../discord/discord.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert]),
    UserModule,
    ProductModule,
    WebpageUtilsModule,
    DiscordModule,
  ],
  controllers: [AlertController],
  providers: [AlertService, ListAlertTools],
  exports: [AlertService],
})
export class AlertModule { }
