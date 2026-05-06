import 'dotenv/config'
import {
  Client,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js'

const token = process.env.DISCORD_TOKEN
const baseUrl = process.env.PARSEGG_BASE_URL || 'http://localhost:3000'

if (!token) {
  console.error('Missing DISCORD_TOKEN — copy discord-bot/.env.example to .env and fill it in')
  process.exit(1)
}

interface PlayerData {
  profile: {
    name: string; realm: string; region: string; class: string; spec: string
    itemLevel: number; mythicPlus: { score: number }; raidProgress: { summary: string }
    profileUrl: string
  }
  score: {
    overall: number; pe: number; forwardPe: number; carryIndex: number
    avgParse: number; verdict: string; verdictLabel: string; changePercent: number
    role: string; isProgressionProfile: boolean
  }
}

const VERDICT_COLORS = {
  INVITE: Colors.Green,
  BENCH:  0xffa726,
  DECLINE: Colors.Red,
}

const CLASS_EMOJIS: Record<string, string> = {
  'Death Knight': '💀', 'Demon Hunter': '👁️', Druid: '🌿',
  Evoker: '🐉', Hunter: '🏹', Mage: '❄️', Monk: '☯️',
  Paladin: '⚔️', Priest: '✨', Rogue: '🗡️', Shaman: '⚡',
  Warlock: '🔥', Warrior: '🛡️',
}

async function fetchPlayer(name: string, realm: string, region: string): Promise<PlayerData> {
  const url = `${baseUrl}/api/player?region=${region}&realm=${encodeURIComponent(realm)}&name=${encodeURIComponent(name)}`
  const res = await fetch(url)
  const json = await res.json() as PlayerData & { error?: string }
  if (!res.ok || json.error) throw new Error(json.error || 'Player not found')
  return json
}

function buildEmbed(d: PlayerData): EmbedBuilder {
  const { profile, score } = d
  const emoji = CLASS_EMOJIS[profile.class] ?? '⚔️'
  const verdictColor = VERDICT_COLORS[score.verdict as keyof typeof VERDICT_COLORS] ?? Colors.Grey
  const changeSign = score.changePercent >= 0 ? '+' : ''
  const trendArrow = score.changePercent > 2 ? '▲' : score.changePercent < -2 ? '▼' : '●'

  const peWarning = score.pe > 2.5 ? ' ⚠️' : score.pe < 0.8 ? ' 💎' : ''
  const carryWarning = score.carryIndex > 65 ? ' 🚩' : score.carryIndex > 35 ? ' ⚠️' : ' ✅'
  const progNote = score.isProgressionProfile ? ' *(prog-adjusted)*' : ''

  return new EmbedBuilder()
    .setColor(verdictColor)
    .setTitle(`${emoji} ${profile.name}-${profile.realm} (${profile.region.toUpperCase()})`)
    .setDescription(`**${profile.spec} ${profile.class}** · ${profile.itemLevel} ilvl · ${profile.raidProgress.summary}`)
    .setURL(profile.profileUrl || null as unknown as string)
    .addFields(
      {
        name: `Player Score  ${trendArrow} ${changeSign}${score.changePercent.toFixed(1)}%`,
        value: `**${score.overall}** / 1000`,
        inline: true,
      },
      {
        name: 'Verdict',
        value: `**${score.verdictLabel}** (${score.verdict})`,
        inline: true,
      },
      { name: '​', value: '​', inline: true },
      {
        name: `P/E Ratio${peWarning}`,
        value: `**${score.pe.toFixed(2)}**`,
        inline: true,
      },
      {
        name: 'Forward P/E',
        value: `**${score.forwardPe.toFixed(2)}**`,
        inline: true,
      },
      {
        name: `Carry Index${carryWarning}${progNote}`,
        value: `**${score.carryIndex}** / 100`,
        inline: true,
      },
      {
        name: 'Avg Parse',
        value: score.avgParse > 0 ? `**${score.avgParse}th** pct` : 'No WCL data',
        inline: true,
      },
      {
        name: 'M+ Score',
        value: profile.mythicPlus.score > 0 ? `**${profile.mythicPlus.score.toFixed(0)}**` : 'None',
        inline: true,
      },
      { name: '​', value: '​', inline: true },
    )
    .setFooter({ text: 'ParseGG • P/E > 2.5 = overvalued • Carry > 65 = suspicious' })
    .setTimestamp()
}

async function handleParse(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply()

  const name = interaction.options.getString('name', true)
  const realm = interaction.options.getString('realm', true)
  const region = interaction.options.getString('region') || 'us'

  try {
    const data = await fetchPlayer(name, realm, region)
    const embed = buildEmbed(data)
    await interaction.editReply({ embeds: [embed] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await interaction.editReply(`❌ **Error:** ${msg}`)
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once('clientReady', () => {
  console.log(`ParseGG bot ready — logged in as ${client.user?.tag}`)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName === 'parse') {
    await handleParse(interaction)
  }
})

client.login(token)
