This is the migration of current whatsapp bot functinality to twilio based whats app bot. 

## Messaging Service -

As for the sender on Twilio, we are utilizing the messaging service available at Twilio Messaging Service, with the number +447897037185 configured as the sender in the service.

## Incoming Messages handler - 

To facilitate the reception of messages through Twilio, We've developed a REST APIs in
src/whatsapp/twClient.ts file and configured it as the incoming message webhook on Twilio.

You can update the webhook url on this page -
https://console.twilio.com/us1/service/sms/MG34baca07a010672ee5c8e6190ea70965/sms-serv[…]FMG34baca07a010672ee5c8e6190ea70965%3Fx-target-region%3Dus1

## Message Templates COnfiguration -

For the menu and greeting content, We've created templates on the Twilio side, and in the code, Its being sent using the template ID. You can review and edit the templates https://console.twilio.com/us1/develop/sms/services?frameUrl=%2Fconsole%2Fsms%2Fservices%3Fx-target-region%3Dus1. 

For the theme menu template we've assigned a unique id to each menu. That id is comes in the 
incoming message paylod when user select any menu item. We've defined the repective AI prompt
for each menu item selection in src/config/prompt.ts file.


## Important files - 

1. Twilio Client - src/utils/twClient/index.ts
2. Initialization and Webhooks - src/whatsapp/twClient.ts
3. Message handling logic - src/whatsapp/twCommands.ts
