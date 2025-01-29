/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { configModule } from './config.module';
import { UserModule } from './User/user.module';
import { ReservationModule } from './Reservation/reservation.module';
import { OrderModule } from './Order/order.module';
import { AuthModule } from './Auth/auth.module';
import { JWTModule } from './jwt.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './Auth/Guard/auth.guard';
import { SendGridModule } from './SendGrid/sendGrid.module';
import { ProductModule } from './Product/product.module';

@Module({
  imports: [
    configModule,
    UserModule,
    ReservationModule,
    OrderModule,
    AuthModule,
    JWTModule,
    SendGridModule,
    ProductModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
