import { Global, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqController } from './rabbitmq.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HEADFUL_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'headful_queue',
          queueOptions: { durable: false },
          prefetchCount: 10,
        },
      },
      {
        name: 'HEADLESS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'headless_queue',
          queueOptions: { durable: false },
          prefetchCount: 10,
        },
      },
      {
        name: 'SITEMAP_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'sitemap_queue',
          queueOptions: { durable: false },
          prefetchCount: 1,
        },
      },
    ]),
  ],
  controllers: [RabbitmqController],
  providers: [RabbitmqService],
  exports: [ClientsModule], // <- THIS IS NEEDED!
})
export class RabbitmqModule { }
