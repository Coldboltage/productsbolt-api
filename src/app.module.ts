import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './product/product.module';
import { ShopModule } from './shop/shop.module';
import { WebpageModule } from './webpage/webpage.module';
import { UserModule } from './user/user.module';
import { AlertModule } from './alert/alert.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ShopProductModule } from './shop-product/shop-product.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BlackListUrlModule } from './blacklist-url/blacklist-url.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { EbayModule } from './ebay/ebay.module';
import { WebpageUtilsModule } from './webpage-utils/webpage-utils.module';
import { SitemapModule } from './sitemap/sitemap.module';
import 'dotenv/config';
import { McpModule } from '@rekog/mcp-nest';
import { DiscordModule } from './discord/discord.module';
import { ConfigModule } from '@nestjs/config';
import { WebpageCacheModule } from './webpage-cache/webpage-cache.module';
import { CandidatePageModule } from './candidate-page/candidate-page.module';
import { CandidatePageCacheModule } from './candidate-page-cache/candidate-page-cache.module';
import { ShopListingModule } from './shop-listing/shop-listing.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot({
      cronJobs: process.env.ENABLE_JOBS === 'true' ? true : false,
    }),
    EventEmitterModule.forRoot(),
    ProductModule,
    ShopModule,
    WebpageModule,
    UserModule,
    AlertModule,
    ShopProductModule,
    BlackListUrlModule,
    RabbitmqModule,
    EbayModule,
    WebpageUtilsModule,
    SitemapModule,
    McpModule.forRoot({
      name: 'productsbolt-mcp',
      version: '0.0.1',
      // defaults: SSE + Streamable HTTP + STDIO enabled
      // SSE endpoints: GET /sse (stream), POST /messages (calls)
    }),
    DiscordModule,
    WebpageCacheModule,
    CandidatePageModule,
    CandidatePageCacheModule,
    ShopListingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
