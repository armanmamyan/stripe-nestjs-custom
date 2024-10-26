import { JwtAuthGuard } from '@/auth/strategy/jwt-auth.guard';
import { GetUser } from '@/users/decorators/get-user.decorator';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { User } from '@/users/entities/user.entity';

@Controller('stripe')
@UseGuards(JwtAuthGuard)
@ApiTags('User Auth')
@ApiSecurity('JWT-auth')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Get('/stripe/validate-stripe')
  async validateStripeUserPais(@GetUser() user: User) {
    return await this.stripeService.validateStripeAccount(user);
  }
}
