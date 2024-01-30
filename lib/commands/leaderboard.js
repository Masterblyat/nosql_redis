"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builder = void 0;
const discord_js_1 = require("discord.js");
const Constants_1 = require("../utils/Constants");
const builders_1 = require("@discordjs/builders");
exports.default = async (interaction, client = interaction.client) => {
    const collectionLeaderboard = client.mongo.db(Constants_1.Constants.MONGO_DB).collection("global_leaderboard");
    const totalMessage = await collectionLeaderboard.countDocuments();
    const allElements = await collectionLeaderboard.find().toArray(); // [{userId: string, date: number}]
    // add user to leaderboard
    let leaderboard = await Promise.all(allElements.map(async (key) => {
        const user = client.users.cache.get(key.userId) || await client.users.fetch(key.userId);
        return {
            ...key,
            user
        };
    }));
    //convert leaderboard to [{userId: string, messageCount: number, user: User}]
    leaderboard = leaderboard.map((user) => {
        const messageCount = allElements.filter((key) => key.userId == user.userId).length;
        return {
            userId: user.userId,
            message: messageCount,
            user: user.user
        };
    });
    //remove duplicate
    leaderboard = leaderboard.filter((user, index) => leaderboard.findIndex((user2) => user2.userId == user.userId) == index);
    leaderboard.sort((a, b) => Number(b.message) - Number(a.message));
    leaderboard = leaderboard.slice(0, 10);
    const embed = new builders_1.EmbedBuilder()
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
exports.builder = new builders_1.SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Get the leaderboard of the bot');
