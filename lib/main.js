"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const redis_1 = require("redis");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const client = new discord_js_1.Client({
    intents: ["GuildMembers", "GuildMessages", "Guilds", "MessageContent"]
});
client.redis = (0, redis_1.createClient)({
    url: "redis://localhost:6379/0"
});
client.on("ready", async () => {
    const commands = (0, fs_1.readdirSync)(__dirname + "/commands").map((file) => file.split(".")[0]).filter(e => !e.startsWith("_"));
    for (const cmd of commands) {
        client.application?.commands.create(require(__dirname + "/commands/" + cmd).builder);
        delete require.cache[require.resolve("./commands/" + cmd)];
    }
    for (const discordCmd of (await client.application.commands.fetch({ force: true, cache: false })).values()) {
        if (!commands.includes(discordCmd.name)) {
            await discordCmd.delete();
            console.log("Deleted " + discordCmd.name + " command");
        }
    }
    client.redis.on("error", (err) => {
        console.error("Redis error : " + err);
    });
    client.redis.connect();
    await new Promise((resolve) => {
        client.redis.on("ready", () => {
            console.log("Redis ready !");
            resolve(true);
        });
    });
    if (!(await client.redis.exists("messageCounter")))
        await client.redis.set("messageCounter", 0);
    console.log("Ready, " + client.user?.tag + " !");
    console.log([...(await client.application.commands.fetch({ force: true, cache: false })).values()].reduce((acc, e) => { acc[e.name] = Object.keys(discord_js_1.ApplicationCommandType).filter(e => isNaN(+e))[(+e.type) - 1]; return acc; }, {}));
});
client.on("interactionCreate", async (interaction) => {
    if (interaction.guildId && interaction.guildId != "")
        await client.guilds.fetch(interaction.guildId);
    if (interaction.type === discord_js_1.InteractionType.ApplicationCommand) {
        console.log(interaction.user.tag + " used /" + interaction.commandName + interaction.options.data.map(e => " " + ((e.type != discord_js_1.ApplicationCommandOptionType.Subcommand) && (e.type != discord_js_1.ApplicationCommandOptionType.SubcommandGroup) ? e.name + "=" + e.value : e.name)).join(""));
        delete require.cache[require.resolve("./commands/" + interaction.commandName)];
        try {
            await require("./commands/" + interaction.commandName).default(interaction);
        }
        catch (e) {
            console.error("Error : " + e);
            try {
                await interaction.reply({ content: "An error occured while executing this command!", ephemeral: true });
            }
            catch (e) {
                try {
                    await interaction.editReply({ content: "An error occured while executing this command!" });
                }
                catch (e) { }
            }
        }
    }
    if (interaction.type === discord_js_1.InteractionType.MessageComponent) {
        const customCommands = await client.redis.hGetAll("commands");
        if (customCommands[interaction.customId]) {
            console.log(interaction.user.tag + " used " + interaction.customId + " button");
            try {
                await interaction.reply({ content: customCommands[interaction.customId], ephemeral: true });
            }
            catch (e) {
                try {
                    await interaction.editReply({ content: customCommands[interaction.customId] });
                }
                catch (e) { }
            }
            return;
        }
        console.log(interaction.user.tag + " used " + interaction.customId + " button");
        delete require.cache[require.resolve("./buttons/" + interaction.customId)];
        try {
            await require("./buttons/" + interaction.customId).default(interaction);
        }
        catch (e) {
            console.error("Error : " + e);
            try {
                await interaction.reply({ content: "An error occured while executing this command!", ephemeral: true });
            }
            catch (e) {
                try {
                    await interaction.editReply({ content: "An error occured while executing this command!" });
                }
                catch (e) { }
            }
        }
    }
});
client.on("messageCreate", async (message) => {
    try {
        if (message.author.bot === true)
            return;
        await client.redis.incr('messageCounter');
        if (!(await client.redis.exists(message.author.id + 'messageCounter')))
            await client.redis.set(message.author.id + 'messageCounter', 0);
        await client.redis.incr(message.author.id + 'messageCounter');
    }
    catch (e) {
        console.error(e);
    }
});
//edit with your token
client.login(process.env.TOKEN);
