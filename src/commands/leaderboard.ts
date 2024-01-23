import { CommandInteraction, Colors } from "discord.js";
import { Client } from "../utils/Types";
import { Constants } from "../utils/Constants";
import { SlashCommandBuilder, EmbedBuilder } from "@discordjs/builders";

export default async (interaction: CommandInteraction, client: Client = interaction.client) => {
    const collectionLeaderboard = client.mongo.db(Constants.MONGO_DB).collection("global_leaderboard");
    const totalMessage = await collectionLeaderboard.countDocuments();
    const allElements = await collectionLeaderboard.find().toArray(); // [{userId: string, date: number}]

    // add user to leaderboard
    let leaderboard: any[] = await Promise.all(allElements.map(async (key) => {
        const user = client.users.cache.get(key.userId) || await client.users.fetch(key.userId);
        return {
            ...key,
            user
        }
    }));

    //convert leaderboard to [{userId: string, messageCount: number, user: User}]
    leaderboard = leaderboard.map((user) => {
        const messageCount = allElements.filter((key) => key.userId == user.userId).length;
        return {
            userId: user.userId,
            message: messageCount,
            user: user.user
        }
    });

    //remove duplicate
    leaderboard = leaderboard.filter((user, index) => leaderboard.findIndex((user2) => user2.userId == user.userId) == index);

    leaderboard.sort((a, b) => Number(b.message) - Number(a.message));

    leaderboard = leaderboard.slice(0, 10);

    const embed = new EmbedBuilder()
        .setTitle('Leaderboard')
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
    .setName('leaderboard')
    .setDescription('Get the leaderboard of the bot');