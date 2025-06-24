import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';
import { WebpageModule } from '../webpage/webpage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert]),
    UserModule,
    ProductModule,
    WebpageModule,
  ],
  controllers: [AlertController],
  providers: [AlertService],
})
export class AlertModule { }
