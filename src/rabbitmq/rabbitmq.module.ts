import { Global, Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqController } from './rabbitmq.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROCESS_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'process_queue',
          queueOptions: { durable: false },
          prefetchCount: 10,
        },
      },
      {
        name: 'MISC_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'misc_queue',
          queueOptions: { durable: false },
          prefetchCount: 10,
        },
      },
    ]),
  ],
  controllers: [RabbitmqController],
  providers: [RabbitmqService],
  exports: [ClientsModule], // <- THIS IS NEEDED!
})
export class RabbitmqModule {}
