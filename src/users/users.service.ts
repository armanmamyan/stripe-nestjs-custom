import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { StripeService } from '@/stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private stripeService: StripeService,
  ) {}

  async create(createUser: Partial<User>): Promise<User> {
    return await this.usersRepository.save(new User(createUser));
  }

  async findUser(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
      select: [
        'avatar',
        'email',
        'id',
        'name',
        'surName',
        'username',
        'stripeCustomerId',
      ],
    });
  }

  async findByStripeCustomerId(customer: string): Promise<Partial<User>> {
    return await this.usersRepository.findOne({
      where: { stripeCustomerId: customer },
      select: [
        'avatar',
        'email',
        'id',
        'name',
        'surName',
        'username',
        'stripeCustomerId',
      ],
    });
  }

  // Get all user information
  async findOne(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async updateData(userEmail, data) {
    return await this.usersRepository.update({ email: userEmail }, data);
  }

  async createSubscription(
    user: User,
    paymentMethodId: string,
    priceId: string,
  ): Promise<any> {
    try {
      const customerId = user.stripeCustomerId;

      // Attach the payment method
      await this.stripeService.attachPaymentMethod(customerId, paymentMethodId);

      // Create the subscription
      const subscription = await this.stripeService.createSubscription(
        customerId,
        priceId,
      );

      await this.usersRepository.update(
        { id: user.id },
        { subscriptionId: subscription.id },
      );

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  async processPayment(
    user: User,
    paymentMethodId: string,
    priceId: string,
    orderId: string,
  ): Promise<Stripe.Invoice> {
    try {
      const customerId = user.stripeCustomerId;

      await this.stripeService.attachPaymentMethod(customerId, paymentMethodId);

      // Create the payment manually
      const manualPayment = await this.stripeService.processPayment(
        customerId,
        priceId,
        orderId,
      );

      await this.usersRepository.update(
        { id: user.id },
        { subscriptionId: manualPayment.id },
      );

      return manualPayment;
    } catch (error) {
      throw error;
    }
  }
}
