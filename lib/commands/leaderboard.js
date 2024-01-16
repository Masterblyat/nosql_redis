"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builder = void 0;
const discord_js_1 = require("discord.js");
exports.default = async (interaction, client = interaction.client) => {
    const totalMessage = await client.redis.get('messageCounter') || 0;
    const redisKeys = await client.redis.keys('*messageCounter');
    redisKeys.splice(redisKeys.indexOf('messageCounter'), 1);
    redisKeys.splice(redisKeys.findIndex(e => e.includes(client.user.id)), 1);
    let leaderboard = await Promise.all(redisKeys.map(async (key) => {
        const userId = key.replace('messageCounter', '');
        const user = client.users.cache.get(userId) || await client.users.fetch(userId);
        const message = await client.redis.get(key);
        return { user, message };
    }));
    leaderboard = leaderboard.filter((user) => user != undefined);
    leaderboard.sort((a, b) => Number(b.message) - Number(a.message));
    leaderboard = leaderboard.slice(0, 10);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Leaderboard')
        .setDescription(`Total message: ${totalMessage}`)
        .setColor(discord_js_1.Colors.LuminousVividPink);
    leaderboard.forEach((user, index) => {
        embed.addFields({
            name: `${index + 1}. ${user.user.displayName}`,
            value: user.message + ' message' + (+user.message > 1 ? 's' : ''),
            inline: false
        });
    });
    interaction.reply({ embeds: [embed] });
};
exports.builder = new discord_js_1.SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Get the leaderboard of the server');
