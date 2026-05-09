require('dotenv').config()

const {
Client,
GatewayIntentBits,
PermissionsBitField,
ChannelType,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require('discord.js')

const mongoose = require('mongoose')

const QRCode = require('qrcode')

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MONGO ONLINE'))

const filas = {}
const mediadores = []
const perfis = {}

client.once('ready', () => {
console.log('BOT ONLINE')
})

client.on('messageCreate', async message => {

if (message.author.bot) return

// !ORG
if (message.content === '!org') {

if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
return message.reply('Sem permissão')
}

// CARGOS
const cargos = [
'DONO',
'SUB DONO',
'CEO',
'GERENTE',
'DIRETOR',
'DIR SS',
'ADM',
'SUP',
'SS',
'MEDIADOR'
]

for (const cargo of cargos) {

if (!message.guild.roles.cache.find(r => r.name === cargo)) {

await message.guild.roles.create({
name: cargo
})
}
}

// CATEGORIAS
const categoriaFilas = await message.guild.channels.create({
name: '🎮 FILAS',
type: ChannelType.GuildCategory
})

const categoriaApostas = await message.guild.channels.create({
name: '💸 APOSTAS',
type: ChannelType.GuildCategory
})

const categoriaSS = await message.guild.channels.create({
name: '🛡️ SS',
type: ChannelType.GuildCategory
})

const categoriaMedia = await message.guild.channels.create({
name: '🎧 MEDIAÇÃO',
type: ChannelType.GuildCategory
})

// CANAIS FILAS
const filasOrg = [
'1x1-mobile',
'2x2-mobile',
'3x3-mobile',
'4x4-mobile',

'1x1-misto',
'2x2-misto',
'3x3-misto',
'4x4-misto',

'1x1-emulador',
'2x2-emulador',
'3x3-emulador',
'4x4-emulador'
]

for (const fila of filasOrg) {

const canal = await message.guild.channels.create({
name: fila,
type: ChannelType.GuildText,
parent: categoriaFilas.id
})

const embed = new EmbedBuilder()
.setTitle('🎮 FILA DE APOSTA')
.setDescription(`
Clique abaixo para entrar na fila.
`)
.setThumbnail(message.guild.iconURL())
.setColor('#00ff88')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId(`fila_${fila}`)
.setLabel('Entrar')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`sair_${fila}`)
.setLabel('Sair')
.setStyle(ButtonStyle.Danger)
)

await canal.send({
embeds: [embed],
components: [row]
})
}

// CANAIS MEDIAÇÃO
await message.guild.channels.create({
name: 'fila-mediadores',
type: ChannelType.GuildText,
parent: categoriaMedia.id
})

await message.guild.channels.create({
name: 'pagamentos',
type: ChannelType.GuildText,
parent: categoriaMedia.id
})

// CANAIS SS
await message.guild.channels.create({
name: 'solicitacao-ss',
type: ChannelType.GuildText,
parent: categoriaSS.id
})

message.reply('ORG CONFIGURADA')
}

// .P
if (message.content.startsWith('.p')) {

const user = message.mentions.users.first() || message.author

if (!perfis[user.id]) {
perfis[user.id] = {
wins: 0,
loses: 0
}
}

const perfil = perfis[user.id]

const embed = new EmbedBuilder()
.setTitle(`📊 PERFIL`)
.setDescription(`
Usuário:
${user}

Vitórias:
${perfil.wins}

Derrotas:
${perfil.loses}
`)
.setThumbnail(user.displayAvatarURL())
.setColor('#00ff88')

message.reply({
embeds: [embed]
})
}

// SSMOB
if (message.content === '.ssmob') {

const canal = message.guild.channels.cache.find(
c => c.name === 'solicitacao-ss'
)

if (canal) {

const embed = new EmbedBuilder()
.setTitle('🚨 SOLICITAÇÃO SS MOBILE')
.setDescription(`
Player:
${message.author}
`)
.setColor('#ff0000')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId('aceitar_ss')
.setLabel('Aceitar')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId('wo_ss')
.setLabel('W.O')
.setStyle(ButtonStyle.Danger),

new ButtonBuilder()
.setCustomId('limpo_ss')
.setLabel('Limpo')
.setStyle(ButtonStyle.Primary)
)

canal.send({
embeds: [embed],
components: [row]
})
}
}

// SSEMU
if (message.content === '.ssemu') {

const canal = message.guild.channels.cache.find(
c => c.name === 'solicitacao-ss'
)

if (canal) {

const embed = new EmbedBuilder()
.setTitle('🚨 SOLICITAÇÃO SS EMULADOR')
.setDescription(`
Player:
${message.author}
`)
.setColor('#ff0000')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId('aceitar_ss')
.setLabel('Aceitar')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId('wo_ss')
.setLabel('W.O')
.setStyle(ButtonStyle.Danger),

new ButtonBuilder()
.setCustomId('limpo_ss')
.setLabel('Limpo')
.setStyle(ButtonStyle.Primary)
)

canal.send({
embeds: [embed],
components: [row]
})
}
}

// !LIMPAR
if (message.content === '!limpar') {

const mensagens = await message.channel.messages.fetch()

await message.channel.bulkDelete(mensagens)

message.channel.send('Canal limpo')
}
})

// BOTÕES
client.on('interactionCreate', async interaction => {

if (!interaction.isButton()) return

// ENTRAR FILA
if (interaction.customId.startsWith('fila_')) {

const fila = interaction.customId

if (!filas[fila]) {
filas[fila] = []
}

if (filas[fila].includes(interaction.user.id)) {

return interaction.reply({
content: 'Você já está na fila',
ephemeral: true
})
}

filas[fila].push(interaction.user.id)

interaction.reply({
content: 'Entrou na fila',
ephemeral: true
})

// MATCH
if (filas[fila].length >= 2) {

const jogadores = filas[fila].splice(0, 2)

const canal = await interaction.guild.channels.create({
name: `aposta-${Date.now()}`,
type: ChannelType.GuildText,
permissionOverwrites: [
{
id: interaction.guild.id,
deny: [PermissionsBitField.Flags.ViewChannel]
},
...jogadores.map(id => ({
id,
allow: [PermissionsBitField.Flags.ViewChannel]
}))
]
})

const embed = new EmbedBuilder()
.setTitle('💸 APOSTA ENCONTRADA')
.setDescription(`
${jogadores.map(id => `<@${id}>`).join('\n')}

Confirmem abaixo.
`)
.setThumbnail(interaction.guild.iconURL())
.setColor('#00ff88')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId('confirmar_aposta')
.setLabel('Confirmar')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId('cancelar_aposta')
.setLabel('Cancelar')
.setStyle(ButtonStyle.Danger)
)

canal.send({
content: jogadores.map(id => `<@${id}>`).join(' '),
embeds: [embed],
components: [row]
})
}
}

// CANCELAR
if (interaction.customId === 'cancelar_aposta') {

interaction.reply({
content: 'Aposta cancelada'
})

setTimeout(() => {
interaction.channel.delete()
}, 3000)
}

// CONFIRMAR
if (interaction.customId === 'confirmar_aposta') {

const mediador = mediadores[0]

const embed = new EmbedBuilder()
.setTitle('✅ APOSTA CONFIRMADA')
.setDescription(`
Mediador:
${mediador ? `<@${mediador}>` : 'Nenhum disponível'}
`)
.setThumbnail(interaction.guild.iconURL())
.setColor('#00ff88')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId('pix')
.setLabel('Enviar PIX')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId('fornecer_sala')
.setLabel('Fornecer Sala')
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId('finalizar_aposta')
.setLabel('Finalizar')
.setStyle(ButtonStyle.Danger)
)

interaction.channel.send({
embeds: [embed],
components: [row]
})

interaction.reply({
content: 'Aposta iniciada',
ephemeral: true
})
}

// PIX
if (interaction.customId === 'pix') {

const chavePix = '11999999999'

const qr = await QRCode.toDataURL(chavePix)

const embed = new EmbedBuilder()
.setTitle('💸 PAGAMENTO')
.setDescription(`
Chave PIX:

${chavePix}
`)
.setImage(qr)
.setColor('#00ff88')

interaction.reply({
embeds: [embed]
})
}

// FORNECER SALA
if (interaction.customId === 'fornecer_sala') {

const embed = new EmbedBuilder()
.setTitle('🎮 SALA')
.setDescription(`
ID:
123456

SENHA:
123
`)
.setColor('#00ff88')

interaction.reply({
embeds: [embed]
})
}

// FINALIZAR
if (interaction.customId === 'finalizar_aposta') {

interaction.reply({
content: 'Aposta finalizada'
})

setTimeout(() => {
interaction.channel.delete()
}, 5000)
}

// ACEITAR SS
if (interaction.customId === 'aceitar_ss') {

interaction.reply({
content: 'SS ACEITO'
})
}

// WO
if (interaction.customId === 'wo_ss') {

interaction.reply({
content: 'W.O aplicado'
})
}

// LIMPO
if (interaction.customId === 'limpo_ss') {

interaction.reply({
content: 'Player limpo'
})
}
})

client.login(process.env.TOKEN)
