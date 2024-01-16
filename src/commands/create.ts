import { CommandInteraction, SlashCommandBuilder, CommandInteractionOptionResolver } from 'discord.js'
import { Client } from '../utils/Types'

export default async (interaction: CommandInteraction, client: Client = interaction.client) => {
    const name = (interaction.options as CommandInteractionOptionResolver).getString('name') as string;
    const description = (interaction.options as CommandInteractionOptionResolver).getString('description') as string;
    const content = (interaction.options as CommandInteractionOptionResolver).getString('content') as string;

    await interaction.deferReply({ ephemeral: true });

    const customCommand = {
        name,
        description,
        content
    };
    
    //défini la valeur d'un champ spécifique dans une clé de hachage Redis 
    await client.redis.hSet('commands', name, JSON.stringify(customCommand));

    const newCommand = new SlashCommandBuilder()
        .setName(name)
        .setDescription(description);

    await interaction.guild?.commands.create(newCommand);

    await interaction.editReply(`Command ${name} has been created!`);
    
}

export const builder = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new command')
    .addStringOption(
        option => option
        .setName('name')
        .setDescription('Name of the command')
        .setRequired(true)
    )
    .addStringOption(
        option => option
        .setName('description')
        .setDescription('Description of the command')
        .setRequired(true)
    )
    .addStringOption(
        option => option
        .setName('content')
        .setDescription('Content of the command')
        .setRequired(true)
    );