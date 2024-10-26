import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config.schema';
import { typeOrmAsyncConfig } from './config/typeorm.config';
import { StripeModule } from '@golevelup/nestjs-stripe';
import { AppService } from './app.service';
import { StripeCustomModule } from './stripe/stripe.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`],
      validationSchema: configValidationSchema,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    AuthModule,
    UsersModule,
    StripeModule.forRoot(StripeModule, {
      apiKey: process.env.STRIPE_SECRET,
      webhookConfig: {
        stripeSecrets: {
          accountTest: process.env.STRIPE_WEBHOOK_SECRET,
          connectTest: process.env.STRIPE_WEBHOOK_SECRET,
        },
        controllerPrefix: '/stripe/webhook',
        requestBodyProperty: 'rawBody',
      },
    }),
    StripeCustomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
