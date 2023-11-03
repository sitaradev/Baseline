// Importing npm modules
import WhatsAppClient, { MessageMedia } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';

import chatGPTService from '../openai/openai';
import { deleteContent } from '../utils/delete';
import transcript from '../openai/transcript';
import {
  greetings,
  optionsMessage,
  options,
  bipolarTrainingPrompt,
  invalidAccountResponse,
  monthNames,
  iaCommands,
} from '../config/data.json';
import { modes } from '../config/constants';

import { UserInfo } from '../config/types';
import { AllowedUsers } from './types';

const BOT_PHONE_NUMBER = process.env.PHONE_NUMBER as string;

// User info and allowed users
const userInfo: UserInfo = {};
const allowedUsers: AllowedUsers = new Set([]);

// Helper functions
const delay = (duration: number) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};

async function logContact(contact: WhatsAppClient.Contact) {
  const contactNumber = contact.number.split('@')[0];
  const contactName = contact.name || 'Unknown';
  const currentDate = new Date();
  const formattedTime = formatDate(currentDate);
  const saveString = `${contactNumber} contacted ${contactName} at ${formattedTime}\n`;

  try {
    await fs.promises.appendFile('logs.txt', saveString);
    console.log('Contact log saved successfully');
  } catch (err) {
    console.error('Failed to save contact log:', err);
  }
}

async function registerUser(message: WhatsAppClient.Message, client: WhatsAppClient.Client) {
  const contact = await message.getContact();
  const sender = message.from;
  const contactNumber = contact.number.split('@')[0];

  console.log(`Registering new user: ${contactNumber}`);

  try {
    await fs.promises.appendFile('contacts.txt', contactNumber + '\n');
    console.log('Contact saved to contacts.txt');
  } catch (err) {
    console.error('Failed to save contact:', err);
  }

  const updatedOptions = options.map((value, index) => `${index + 1}. ${value}`);
  const finalOptionsMsg = optionsMessage + updatedOptions.join('\n');
  client.sendMessage(sender, greetings, { mentions: [contact] });

  await delay(1500);

  client.sendMessage(sender, finalOptionsMsg, { mentions: [contact] });

  userInfo[sender] = {
    mode: modes.mode_1,
    currentStage: 'begin',
  };
}

async function getClientMessage(message: WhatsAppClient.Message): Promise<string | undefined> {
  if (!message.hasMedia) {
    return message.body;
  }

  console.log("Received a media message");

  const media = await message.downloadMedia();
  if (!media || !media.mimetype.startsWith("audio/")) {
    console.log("The media is not an audio file");
    return;
  }
  
  console.log('Received an audio message');

  const audioFilesDir = path.join(__dirname, 'audio_files');
  if (!fs.existsSync(audioFilesDir)) {
    fs.mkdirSync(audioFilesDir);
    console.log('Created audio_files directory');
  }
  
  const inputPath = path.join(audioFilesDir, `${message.id._serialized}.ogg`);
  const outputPath = path.join(audioFilesDir, `${message.id._serialized}.mp3`);
  fs.writeFileSync(inputPath, media.data, { encoding: 'base64' });
  
  try {
    await transcript.convertAudioToMp3(inputPath, outputPath);
    console.log('Audio conversion to MP3 succeeded');
    
    const recognizedText = await transcript.sendAudioForTranscription(outputPath);
    if (!recognizedText) {
      console.log('Audio transcription failed');
      return;
    }

    console.log("Recognized text from audio:", recognizedText);
    await deleteContent(audioFilesDir);
    return recognizedText;
  } catch (err) {
    console.error('Error in converting or transcribing the audio:', err);
  }
}

function containsNumber(message: string) {
  return /[1-8]/.test(message);
}

async function createReply(clientMessage: string, sender: string, client: WhatsAppClient.Client, contact: WhatsAppClient.Contact) {
  const doesContainNumber = containsNumber(clientMessage);
  const selectedOption = parseInt(clientMessage, 10);

  const botMessage = await chatGPTService.getGPTResponse({
    clientMessage: doesContainNumber ? options[selectedOption - 1] : clientMessage,
    sender,
    ...(doesContainNumber && selectedOption === 2 ? { trainingPrompt: bipolarTrainingPrompt } : {}),
  });

  client.sendMessage(sender, botMessage, { mentions: [contact] });
}

function isUserRegistered(sender: string) {
  return sender in userInfo;
}

function formatDate(date: Date) {
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes} ${day} ${month}`;
}

// Main command function
export async function commands(message: WhatsAppClient.Message, client: WhatsAppClient.Client): Promise<void> {
  if (message.from.includes(BOT_PHONE_NUMBER)) {
    console.log("Received message from self, ignoring");
    return;
  }

  const contact = await message.getContact();
  const sender = message.from;

  if (allowedUsers.size > 0 && !allowedUsers.has(sender.split('@')[0])) {
    console.log('Unauthorized access attempt from:', sender);
    client.sendMessage(sender, invalidAccountResponse, { mentions: [contact] });
    return;
  }

  const clientMessage = await getClientMessage(message);
  if (!clientMessage) {
    console.log("Failed to process client message");
    return;
  }

  console.log("Processed client message:", clientMessage);

  if (!isUserRegistered(sender)) {
    console.log("User not registered, proceeding with registration");
    await registerUser(message, client);
    return;
  }

  console.log('User is already registered, proceeding with command processing');

  try {
    await logContact(contact);
  } catch (error) {
    console.error('Failed to log contact:', error);
  }

  const firstMessageWord = clientMessage.split(' ')[0];

  switch (firstMessageWord) {
    case iaCommands.reset:
      chatGPTService.conversationHistory.delete(sender);
      client.sendMessage(sender, 'Conversation reset', { mentions: [contact] });
      if (isUserRegistered(sender)) {
        delete userInfo[sender];
      }
      console.log('User state reset');
      break;

    default:
      await createReply(clientMessage, sender, client, contact);
      console.log('Reply sent to user');
  }
}
