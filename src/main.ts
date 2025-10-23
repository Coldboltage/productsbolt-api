import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import 'dotenv/config'; // This loads .env automatically

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  await app.listen(3000, '0.0.0.0');
}
bootstrap();

process.on('SIGINT', () => {
  console.error('Received SIGINT (Ctrl+C) — shutting down gracefully');
  process.report.writeReport(); // writes diagnostics/report.json
  process.exit(130);
});
