import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { StripeService } from './stripe/stripe.service';
import Stripe from 'stripe';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private stripeService: StripeService,
    private userService: UsersService,
  ) {}

  @Post('/stripe/webhook')
  async handleWebhook(
    @Req() req,
    @Headers('stripe-signature') signature: string,
  ) {
    let event;

    try {
      event = this.stripeService.constructEventFromWebhook(
        req?.rawBody,
        signature,
      );
    } catch (err) {
      throw new BadRequestException(
        `⚠️  Error verifying webhook signature: ${err.message}`,
      );
    }

    switch (event.type) {
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;
      case 'customer.subscription.paused':
        await this.handleSubscriptionPaused(event);
        break;
      case 'customer.subscription.resumed':
        await this.handleSubscriptionResumed(event);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event);
        break;
      case 'invoice.upcoming':
        await this.handleInvoiceUpcoming(event);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;

    const user = await this.userService.findByStripeCustomerId(customerId);
    if (user) {
      //  Notify User that payment succeeded
    } else {
      console.error(`User not found for customerId: ${customerId}`);
    }
  }

  private async handlePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    const user = await this.userService.findByStripeCustomerId(customerId);
    if (user) {
      // Notify the user about the failed payment
    } else {
      console.error(`User not found for customerId: ${customerId}`);
    }
  }

  private async handleSubscriptionResumed(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    // Update your database to mark the subscription as active
    // subscription.customer as string,
    // 'active',
  }

  private async handleSubscriptionPaused(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    // Update your database to mark the subscription as paused
    // subscription.customer as string,
    // 'paused',
  }

  private async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    // Update your database to mark the user as unsubscribed
    //   subscription.customer as string,
    //   'canceled',
  }

  private async handleInvoiceUpcoming(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    // Optionally notify the user about the upcoming invoice
    // invoice.customer as string,
    // invoice.amount_due,
    // invoice.due_date,
  }
}
