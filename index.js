require('dotenv').config();
import { Client, Collection, Events, GatewayIntentBits, MessageEmbed } from 'discord.js';
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS, GatewayIntentBits.Guilds"]});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `There was an error while executing this command!`, ephemeral: true});
        } else {
            await interaction.reply({ content: `There was an error while executing this command!`, ephemeral: true});
        }
    }
});

client.on('ready', () => {
    console.log('Logged in as ${client.user.tag}!')
});

//prefix: !poll
//question: {question}
//options: [option 1]
//emoji: (:emoji)
//roles: ^@role^
//ex: To find out if your community prefers donuts, cake, or ice cream, the command would be:
// !poll {Which is best?} [Donuts] [Cake] [Ice Cream] (:doughnut:) (:cake:) (:icecream:) ^@snackpeeps^ ^@dessertmoms^
client.on('messageCreate', msg => {
    const author = msg.author.id;
    const command = msg.content.slice(0, 5);
    if (command === '!poll') {
        // isolate the query
        const query = msg.content.slice(6);
        const qLength = query.indexOf('}');
        // get the question
        const pollQuestion = query.slice(1, qLength);
        // isolate the parameters
        const params = query.slice(qLength + 2);
        
        // get the indicies of param start & end
        const optionsStart = [];
        const optionsEnd = [];
        const emojiStart = [];
        const emojiEnd = [];
        const emojiLetters = ["<\:hg_A:877245614600093726>", "<\:hg_B:877245614797225994>", "<\:hg_C:877245614918877184>", "<\:hg_D:877245615107637309>", "<\:hg_E:877245615342485564>", "<\:hg_F:877245617154441316>", "<\:hg_G:877245617234116628>", "<\:hg_H:877245617276067910>", "<\:hg_I:877245618014269500>", "<\:hg_J:877245618341441536>", "<\:hg_K:877245618442084372>", "<\:hg_L:877245618433712199>", "<\:hg_M:877245618110754838>", "<\:hg_N:877245618404339722>", "<\:hg_O:877245618467246100>", "<\:hg_P:877245618471444490>", "<\:hg_Q:879606348642394144>", "<\:hg_R:879606348692717599>", "<\:hg_S:877245618169450507>", "<\:hg_T:879606493731758092>", "<\:hg_U:879606494365093919>", "<\:hg_V:879606495203983390>", "<\:hg_W:879606495858286662>", "<\:hg_X:879606495933767680>", "<\:hg_Y:879606495786975264>", "<\:hg_Z:879606495950561280>"];
        
        const roles = [];
        for (let i = 0; i < params.length; i ++) {
            if (params.charAt(i) === "[") {
                optionsStart.push(i + 1);
            }
            if (params[i] === "]") {
                optionsEnd.push(i);
            }
            if (params[i] === "(") {
                emojiStart.push(i + 1);
            }
            if (params[i] === ")") {
                emojiEnd.push(i);
            }
            if (params[i] === "@") {
                roles.push(i);
            }
        }

        // get options array
        const options = [];
        for (let i = 0; i < optionsStart.length; i++) {
            let option = params.slice(optionsStart[i], optionsEnd[i]);
            options.push(option);
        }

        // get emoji array
        const emojis = [];
        if (emojiStart.length === 0) {
            for (i = 0; i < options.length; i++) {
                emojis.push(emojiLetters[i]);
            }
        } else {
            for (let i = 0; i < emojiStart.length; i++) {
                let emoji = params.slice(emojiStart[i], emojiEnd[i]);
                emojis.push(emoji);
            }
        }

        // get roles array
        const rolePings = ["<@&880622141031202877>"];
        if (roles.length > 0) {
            const rolesFinal = [];
            const rolesString = params.slice(roles[0]);
            const newRoles = rolesString.split(" ");
            for (i = 0; i < newRoles.length; i++) {
                const newString = newRoles[i].replace(/[`^]/gi, '');
                rolesFinal.push(newString);
            }

            for (i = 0; i < rolesFinal.length; i++) {
                rolePings.push(rolesFinal[i]);
            }
        }

        let allOptions = "\u200B\n";
        for (i = 0; i < options.length; i++) {
            allOptions = allOptions + emojis[i] + `\xa0\xa0\xa0` + options[i] + ` \n`;
        }

        const allRoles = rolePings.join(" ");

        const poll = pollQuestion.toString();

        const embed = new MessageEmbed()
            .setColor('#92D2F6')
            .addField(`${poll}`, `${allOptions}`, false)
        msg.delete(msg.id);
        msg.channel.send({embeds: [embed]})
            .then(function(message) {
                for (i = 0; i < emojis.length; i++) {
                    message.react(`${emojis[i]}`)
                }
                msg.channel.send(`_Asked by:_ \xa0<@${author}> | ${allRoles}`);
            }).catch(function(err) {
                console.error(err)
            });

    }
});

client.login(process.env.CLIENT_TOKEN);

// How to use the HighPoll bot:

// There are 3 key things the bot needs to create the poll - the command, the question, and the choices.
// The command is always !poll and it MUST be the first thing in your message.
// The question should always be surrounded by curly braces, ex: {your question here}
// You may have up to 26 choices. The choices should always be surrounded by square braces and separated by spaces, ex: [option 1] [option 2] [option 3]
// ** note: do NOT use parentheses (), carats ^, or square braces [] inside the square braces used for the choices: :x: [option (1)] [option [2]] [option ^3]
// If you'd like to use standard emojis instead of the Highgarden Letters, put them inside parentheses, ex: (🍩) (🍰) (🍦)
// ** note: make sure you add the emojis in the order you'd like them to appear

// If you enter the command correctly, your message will dissappear and the bot will create the poll.

// For the best experience, copy & paste the templates below and replace the placeholders with your content:

// Uses Highgarden letters as emojis
// !poll {question} [choice1] [choice2] [choice3]

// Uses emojis you choose
// !poll {question} [choice1] [choice2] [choice3] (🍩) (🍰) (🍦)