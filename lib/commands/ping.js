"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builder = void 0;
const discord_js_1 = require("discord.js");
exports.default = async (interaction, client = interaction.client) => {
    interaction.reply('Pong!');
};
exports.builder = new discord_js_1.SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping!');
