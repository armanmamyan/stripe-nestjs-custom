import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './controllers/user.controller';
import { UserAuthController } from './controllers/user.auth.controller';
import { AuthModule } from 'src/auth/auth.module';
import { StripeCustomModule } from '@/stripe/stripe.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    forwardRef(() => StripeCustomModule),
  ],
  providers: [UsersService],
  controllers: [UserController, UserAuthController],
  exports: [UsersService],
})
export class UsersModule {}
