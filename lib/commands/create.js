"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builder = void 0;
const discord_js_1 = require("discord.js");
exports.default = async (interaction, client = interaction.client) => {
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const content = interaction.options.getString('content');
    await interaction.deferReply({ ephemeral: true });
    const customCommand = {
        name,
        description,
        content
    };
    await client.redis.hSet('commands', name, JSON.stringify(customCommand));
    const newCommand = new discord_js_1.SlashCommandBuilder()
        .setName(name)
        .setDescription(description);
    await interaction.guild?.commands.create(newCommand);
    await interaction.editReply(`Command ${name} has been created!`);
};
exports.builder = new discord_js_1.SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new command')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Name of the command')
    .setRequired(true))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Description of the command')
    .setRequired(true))
    .addStringOption(option => option
    .setName('content')
    .setDescription('Content of the command')
    .setRequired(true));
