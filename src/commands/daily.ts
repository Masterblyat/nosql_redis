import { CommandInteraction, SlashCommandBuilder, EmbedBuilder, Colors } from 'discord.js'
import { Client } from '../utils/Types'

export default async (interaction: CommandInteraction, client: Client = interaction.client) => {

    const totalMessage = await client.redis.get('messageCounter') || 0;
    
    const redisKeys = await client.redis.keys('*messageCounter');

    redisKeys.splice(redisKeys.indexOf('messageCounter'), 1);

    let leaderboard = await Promise.all(redisKeys.map(async (key) => {
        const userId = key.replace('messageCounter', '');

        const user = client.users.cache.get(userId) || await client.users.fetch(userId);
        const message = await client.redis.get(key);
        return { user, message };
    }));

    leaderboard = leaderboard.filter((user) => user != undefined);

    leaderboard.sort((a, b) => Number(b.message) - Number(a.message));

    leaderboard = leaderboard.slice(0, 10);

    const embed = new EmbedBuilder()
        .setTitle('Daily Leaderboard')
        .setDescription(`Total message: ${totalMessage}`)
        .setColor(Colors.LuminousVividPink);

    leaderboard.forEach((user, index) => {
        embed.addFields({
            name: `${index + 1}. ${user.user.displayName}`,
            value: user.message + ' message' + (+user.message > 1 ? 's' : ''),
            inline: false
        });
    });

    interaction.reply({ embeds: [embed] });

}

export const builder = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Get the daily leaderboard of the bot');