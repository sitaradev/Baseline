import twilio from 'twilio';

if (!process.env.MESSAGING_SERVICE_ID) {
  console.error("Missing required environment variables");
  process.exit(1);
}

export type RawMessage = {
    From: string
    Body: string
    ProfileName: string
    ButtonPayload: string
}

class ClientMessage {
  
    from = '';
    message = '';
    contact = {
        number: '',
        name: ''
    };
    buttonAction = '';

    constructor(message: RawMessage){
      this.from = message.From
      this.message = message.Body
      this.contact = {
        number: message.From.substr(message.From.indexOf('whatsapp:+')),
        name: message.ProfileName
      }
      this.buttonAction = message.ButtonPayload
    }
  
    getClientMessage(){
      return this.message;
    }
  
    getContact(){
        return this.contact;
    }

}

type Content = {
  body?: string;
  contentSid?: string;
  contentVariables?: string;
}

export class Client {

  client:any

  constructor(accountSid:string, authToken: string){
    this.client = twilio(accountSid, authToken);
  }

  sendMessage(chatId: string, content: string | Content, extra: any ){

    const _content = typeof content == 'string' ? { body : content} : content
    
    return this.client.messages.create({
      from: process.env.MESSAGING_SERVICE_ID, 
      to: chatId,
      ..._content,
    })
  }
}

const WhatsAppClient = {
  Message: ClientMessage,
  Client: Client
}

export type Message = ClientMessage
export type Contact = {
  number: string,
  name: string
}

export default WhatsAppClient 