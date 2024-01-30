import { ApplicationCommandOptionType, Client as DiscordClient, InteractionType, ApplicationCommandType, Message, Partials } from "discord.js";
import { readdirSync } from "fs";
import { Client } from "./utils/Types";
import { createClient } from "redis";
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { Constants } from "./utils/Constants";
import { Mongo } from "./utils/Types";

config()
//initialise un client Discord avec intents
const client: Client = new DiscordClient({
    intents: ["GuildMembers", "GuildMessages", "Guilds", "MessageContent"]
});

//connection client discord avec la bdd redis & MongoDB
client.redis = createClient({
    url: "redis://" + Constants.REDIS_HOST + ":" + Constants.REDIS_PORT + "/" + Constants.REDIS_DB,
});
client.mongo = new MongoClient("mongodb://" + Constants.MONGO_HOST + ":" + Constants.MONGO_PORT);

//Chargement des commandes Discord :
client.on("ready", async () => {
    const commands = readdirSync(__dirname + "/commands").map((file) => file.split(".")[0]);
    for (const cmd of commands) {
        client.application?.commands.create(require(__dirname + "/commands/" + cmd).builder);
        delete require.cache[require.resolve("./commands/" + cmd)];
    }
    //Nettoyage des anciennes commandes Discord :
    for (const discordCmd of (await client.application!.commands.fetch({force: true, cache: false})).values()) {
        if (!commands.includes(discordCmd.name)) {
            await discordCmd.delete();
            console.log("Deleted " + discordCmd.name + " command");
        }
    }
    //Gestion des erreurs Redis :
    client.redis.on("error", (err) => {
        console.error("Redis error : " + err);
        process.exit(1);
    });
    //Connexion au serveur Redis :
    client.redis.connect();

    await new Promise((resolve) => {
        client.redis.on("ready", () => {
            console.log("Redis ready !");
            resolve(true);
        });
    });
    //Connexion au serveur MongoDB :
    await client.mongo.connect();
    console.log('Mongo ready !');

    //Initialisation du compteur de messages :
    if (!(await client.redis.exists("messageCounter"))) await client.redis.set("messageCounter", 0);

    //Affichage des Ready :
    console.log("Ready, " + client.user?.tag + " !");

    console.log([...(await client.application!.commands.fetch({force: true, cache: false})).values()].reduce((acc, e) => {acc[e.name] = Object.keys(ApplicationCommandType).filter(e => isNaN(+e))[(+e.type)-1]; return acc}, {}));
})

//Vérification du type d'interaction :
client.on("interactionCreate", async (interaction) => {
    if (interaction.guildId && interaction.guildId != "") await client.guilds.fetch(interaction.guildId);
    if (interaction.type === InteractionType.ApplicationCommand) {

        const customCommands = await client.mongo.db(Constants.MONGO_DB).collection('custom_commands').find({
            name: interaction.commandName
        }).toArray();

        //chercher une commande personnalisée spécifique dans le tableau customCommands
        const command = customCommands.find(e => e.name == interaction.commandName);

        //Vérification de la présence de la commande personnalisée :
        if (command) {

            //Réponse à l'interaction avec la commande personnalisée :
            console.log(interaction.user.tag + " used " + interaction.commandName + " custom command");
            try {
                await interaction.reply({ content: command.content, ephemeral: true });
            } catch (e) {
                try {
                    await interaction.editReply({ content: command.content });
                    //Affichage des informations de débogage :
                } catch (e) {
                    console.error("Error : " + e);
                }
            }
            return;
        }


        console.log(interaction.user.tag + " used /" + interaction.commandName + interaction.options.data.map(e => " " + ((e.type != ApplicationCommandOptionType.Subcommand) && (e.type != ApplicationCommandOptionType.SubcommandGroup) ? e.name + "=" + e.value : e.name)).join(""));
        delete require.cache[require.resolve("./commands/" + interaction.commandName)];
        try {
            await require("./commands/" + interaction.commandName).default(interaction);
        } catch (e) {
            console.error("Error : " + e);
            try {
                await interaction.reply({ content: "An error occured while executing this command!", ephemeral: true });
            } catch (e) {
                try {
                    await interaction.editReply({ content: "An error occured while executing this command!" });
                } catch (e) {}
            }
        }
    }
    // Log de l'utilisation de la commande dans la console.
    if (interaction.type === InteractionType.MessageComponent) {
        console.log(interaction.user.tag + " used " + interaction.customId + " button");
        // Suppression du cache du module correspondant à la commande.
        delete require.cache[require.resolve("./buttons/" + interaction.customId)];
        try {
            // Exécution de la commande correspondante.
            await require("./buttons/" + interaction.customId).default(interaction);
        } catch (e) {
            console.error("Error : " + e);

            try {
                // En cas d'erreur, tentative d'envoi d'un message d'erreur en réponse éphémère.
                await interaction.reply({ content: "An error occured while executing this command!", ephemeral: true });
            } catch (e) {
                try {
                    // En cas d'échec de l'envoi, tentative de modification de la réponse existante avec un message d'erreur.
                    await interaction.editReply({ content: "An error occured while executing this command!" });
                } catch (e) {}
            }
        }
    }
})

client.on("messageCreate", async (message: Message) => {
    try {
        if (message.author.bot === true) return;
        await client.redis.incr('messageCounter');
        
        // Increment for redis
        if (!(await client.redis.exists(message.author.id + 'messageCounter'))) await client.redis.set(message.author.id + 'messageCounter', 0);
        await client.redis.incr(message.author.id + 'messageCounter');

        // Increment for mongo
        const collection = client.mongo.db(Constants.MONGO_DB).collection("global_leaderboard");
        await collection.insertOne({userId: message.author.id, date: message.createdAt} as Mongo['LEADERBOARD']);
        
        
    } catch (e) {
        console.error(e);
    }
});

//edit with your token
client.login(process.env.TOKEN);

