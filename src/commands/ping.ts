import { CommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Client } from '../utils/Types'

export default async (interaction: CommandInteraction, client: Client = interaction.client) => {

    interaction.reply('Pong!');

}

export const builder = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping!');