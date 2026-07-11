declare module 'africastalking' {
  interface SmsSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SmsRecipient {
    number: string;
    status: string;
    messageId: string;
    cost: string;
  }

  interface SmsSendResponse {
    SMSMessageData: {
      Message: string;
      Recipients: SmsRecipient[];
    };
  }

  interface AfricasTalkingServices {
    SMS: {
      send(options: SmsSendOptions): Promise<SmsSendResponse>;
    };
  }

  function AfricasTalking(credentials: { apiKey: string; username: string }): AfricasTalkingServices;

  export = AfricasTalking;
}
