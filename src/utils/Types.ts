import { Client as DiscordClient } from 'discord.js';
import { RedisClientType } from 'redis';

export interface Client extends DiscordClient {

    redis?: RedisClientType;

}

