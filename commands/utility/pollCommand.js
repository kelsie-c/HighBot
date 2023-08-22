import { SlashCommandBuilder } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pollResponse')
        .setDescription('Creates an embedded poll and automatically reacts with default or custom emojis.'),

    async execute(interaction) {
        await interaction.reply('Test')
    },
}