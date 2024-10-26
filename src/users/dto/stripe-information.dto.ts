import { IsString } from "class-validator";

export class StripeInformation {
  @IsString()
  paymentMethodId: string;

  @IsString()
  priceId: string;

  @IsString()
  orderId: string;
}
