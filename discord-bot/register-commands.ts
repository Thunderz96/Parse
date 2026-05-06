import { REST, Routes, SlashCommandBuilder } from 'discord.js'

const token = process.env.DISCORD_TOKEN!
const clientId = process.env.DISCORD_CLIENT_ID!

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment')
  process.exit(1)
}

const commands = [
  new SlashCommandBuilder()
    .setName('parse')
    .setDescription('Look up a WoW player\'s ParseGG score, P/E ratio, and carry index')
    .addStringOption((o) => o.setName('name').setDescription('Character name').setRequired(true))
    .addStringOption((o) => o.setName('realm').setDescription('Realm name (e.g. Stormrage)').setRequired(true))
    .addStringOption((o) =>
      o.setName('region')
        .setDescription('Region (default: us)')
        .setRequired(false)
        .addChoices(
          { name: 'US', value: 'us' },
          { name: 'EU', value: 'eu' },
          { name: 'TW', value: 'tw' },
          { name: 'KR', value: 'kr' },
          { name: 'OCE', value: 'oce' },
        )
    )
    .toJSON(),
]

const rest = new REST().setToken(token)

;(async () => {
  console.log('Registering slash commands...')
  await rest.put(Routes.applicationCommands(clientId), { body: commands })
  console.log('Done.')
})()
