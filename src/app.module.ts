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
import databaseConfig from './config/database/database.config';
import { databaseSchema } from './config/database/database.schema';
import { databaseValidationSetup } from './config/validation';
import { discordSchema } from './config/discord/discord.schema';
import { utilsSchema } from './config/utils/utils.schema';
import { OpenTelemetryModule } from 'nestjs-otel';
import { rabbitmqSchema } from './config/rabbitmq/rabbitmq.schema';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ShopProductBacklistUrlModule } from './shop-product-backlist-url/shop-product-backlist-url.module';
import { SitemapUrlModule } from './sitemap-url/sitemap-url.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CurrencyModule } from './currency/currency.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validate: (config) => {
        const validatedDatabase = databaseValidationSetup(
          config,
          databaseSchema,
        );
        const validatedDiscord = databaseValidationSetup(config, discordSchema);
        const utilsValidated = databaseValidationSetup(config, utilsSchema);
        const rabbitmqValidated = databaseValidationSetup(
          config,
          rabbitmqSchema,
        );
        return {
          ...validatedDatabase,
          ...validatedDiscord,
          ...utilsValidated,
          ...rabbitmqValidated,
        };
      },
    }),
    PrometheusModule.register({
      defaultLabels: { app: 'productsbolt' },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TYPEORM_HOST,
      port: 5432,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10000,
        },
      ],
    }),
    McpModule.forRoot({
      name: 'productsbolt-mcp',
      version: '0.0.1',
      instructions: `Productsbolt tracks product prices across many shops. Entities: Product, Shop, ShopProduct (joins Shop+Product), Webpage (a URL for a ShopProduct). Typical flow: search product → list shopProducts/webpages → fetch latest price/stock → optionally create alerts. Please always check the product listing`,
      guards: [JwtAuthGuard, ThrottlerGuard],
      // defaults: SSE + Streamable HTTP + STDIO enabled
      // SSE endpoints: GET /sse (stream), POST /messages (calls)
    }),
    DiscordModule,
    WebpageCacheModule,
    CandidatePageModule,
    CandidatePageCacheModule,
    ShopListingModule,
    OpenTelemetryModule.forRoot(),
    ShopProductBacklistUrlModule,
    SitemapUrlModule,
    AuthModule,
    CurrencyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
