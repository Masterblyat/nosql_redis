import { Client as DiscordClient } from 'discord.js';
import { RedisClientType } from 'redis';
import { MongoClient } from 'mongodb';

export interface Client extends DiscordClient {

    redis?: RedisClientType;
    mongo?: MongoClient;

}

export interface Mongo {
    LEADERBOARD: {
        date: Date
        userId: string
    }
}
