import { User } from '@/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private WEBHOOK_SERCRET;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.WEBHOOK_SERCRET = process.env.STRIPE_WEBHOOK_SERCRET;
    this.stripe = new Stripe(process.env.STRIPE_SECRET);
  }

  // Creates Customer enables a unique identifier for each user in Stripe's system, 
  // allowing you to securely store and manage user-specific information like payment methods, subscriptions, and transaction history
  async createStripeCustomer(email: string) {
    return this.stripe.customers.create({ email });
  }

  async validateStripeAccount(user:User) {
    const customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await this.createStripeCustomer(user.email);
      await this.userRepository.update({ id: user.id }, { stripeCustomerId: customer.id });
      const createIntent = await this.createSetupIntent(customer.id)
      return {
        validationId: createIntent.client_secret
      };
    }

    // Expiration Process:
    // If a user initiates a SetupIntent or PaymentIntent but doesn't complete it (e.g., closes the browser), 
    // the intent stays in a pending state like requires_confirmation or requires_action.
    // After 24 hours of inactivity, Stripe automatically expires the intent by setting its status to canceled.
    // Implications:

    // If the user returns within 24 hours, you can attempt to reuse the existing intent by retrieving it from
    //  Stripe and checking its status.
    // However, reusing intents can be complex due to potential state changes or partial completions.
    const createIntent = await this.createSetupIntent(customerId)
    
    return {
      validationId: createIntent.client_secret,
    };
  }

  // Get The Payment Method ID created in client side and attach it to Stripe Customer
  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set it as the default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async processPayment(
    customerId: string,
    priceId: string,
    extraDetailsToIncludeInInvoice: any
  ): Promise<Stripe.Invoice> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);

      // Manually creating Invoice for payment
      await this.stripe.invoiceItems.create({
        customer: customerId,
        amount: price.unit_amount,
        currency: price.currency,
        description: price.nickname,
      });
      const createInvoice = await this.stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        auto_advance: true,
        days_until_due: 1,
        pending_invoice_items_behavior: 'include',
        metadata: {
          ...extraDetailsToIncludeInInvoice,
        },
      });

      return await this.stripe.invoices.pay(createInvoice.id);
    } catch (error) {
      throw error;
    }
  }

  async retrieveCustomer(customerId: string) {
    return this.stripe.customers.retrieve(customerId);
  }

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    return await this.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
  }

  constructEventFromWebhook(payload: any, signature: string) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.WEBHOOK_SERCRET);
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
}
