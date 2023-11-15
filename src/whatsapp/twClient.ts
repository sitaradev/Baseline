import express from 'express';
import bodyParser from 'body-parser';
import WhatsAppClient from '../utils/twClient/index';
import { commands } from './twCommands';
import type { RawMessage } from '../utils/twClient';

const client = new WhatsAppClient.Client();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post("/callback", (req:any, res:any) => {
    res.sendStatus(200)
})

app.post("/incoming", (req:any) => {
    const message:RawMessage = req.body;
    const clientMessage = new WhatsAppClient.Message(message);
    commands(clientMessage, client);
})

app.listen(4000, () => {
    console.log('Application has started.');
})

export default client;