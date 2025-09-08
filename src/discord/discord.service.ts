import { Injectable } from '@nestjs/common';
import { CreateDiscordDto } from './dto/create-discord.dto';
import { UpdateDiscordDto } from './dto/update-discord.dto';

@Injectable()
export class DiscordService {
  async sendAlert(message = 'test', url = 'test-url') {
    const payload = {
      username: 'Alan Alerts', // webhook display name
      avatar_url: 'https://i.imgur.com/e1QkPXh.jpeg', // webhook avatar image
      content: `<@135427259396784128> ${message} - ${url ? `${url}` : ''}`,
    };

    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify(payload),
    });
  }
}
