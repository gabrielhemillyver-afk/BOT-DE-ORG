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

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

const filas = {}
const mediadores = []
const perfis = {}

client.once('ready', () => {
console.log('BOT ONLINE')
})

client.on('interactionCreate', async interaction => {

if (!interaction.isChatInputCommand()) return

// /configurar
if (interaction.commandName === 'configurar') {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
return interaction.reply({
content: 'Sem permissão'
})
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

if (!interaction.guild.roles.cache.find(r => r.name === cargo)) {

await interaction.guild.roles.create({
name: cargo
})
}
}

// CATEGORIAS
const categoriaFilas = await interaction.guild.channels.create({
name: '🎮 FILAS',
type: ChannelType.GuildCategory
})

const categoriaApostas = await interaction.guild.channels.create({
name: '💸 APOSTAS',
type: ChannelType.GuildCategory
})

const categoriaSS = await interaction.guild.channels.create({
name: '🛡️ SS',
type: ChannelType.GuildCategory
})

// CANAIS
const canais = [
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
'4x4-emulador',
'fila-mediadores',
'solicitacao-ss'
]

for (const nome of canais) {

let categoria = categoriaFilas.id

if (nome === 'solicitacao-ss') {
categoria = categoriaSS.id
}

const canal = await interaction.guild.channels.create({
name: nome,
type: ChannelType.GuildText,
parent: categoria
})

// FILAS
if (
nome.includes('1x1') ||
nome.includes('2x2') ||
nome.includes('3x3') ||
nome.includes('4x4')
) {

const embed = new EmbedBuilder()
.setTitle('🎮 FILA')
.setDescription('Clique abaixo para entrar na fila.')
.setThumbnail(interaction.guild.iconURL())
.setColor('#00ff88')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId(`fila_${nome}`)
.setLabel('Entrar')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId(`sair_${nome}`)
.setLabel('Sair')
.setStyle(ButtonStyle.Danger)
)

await canal.send({
embeds: [embed],
components: [row]
})
}
}

interaction.reply({
content: 'Servidor configurado'
})
}

// /limpar
if (interaction.commandName === 'limpar') {

const mensagens = await interaction.channel.messages.fetch()

await interaction.channel.bulkDelete(mensagens)

interaction.reply({
content: 'Canal limpo'
})
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
.setTitle('💸 CONFIRMAÇÃO')
.setDescription(`
Jogadores:

<@${jogadores[0]}>
<@${jogadores[1]}>

Confirme para iniciar.
`)
.setThumbnail(interaction.guild.iconURL())
.setColor('#00ff88')

const row = new ActionRowBuilder()
.addComponents(
new ButtonBuilder()
.setCustomId('confirmar')
.setLabel('Confirmar')
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId('cancelar')
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
if (interaction.customId === 'cancelar') {

interaction.reply({
content: 'Aposta cancelada'
})

setTimeout(() => {
interaction.channel.delete()
}, 3000)
}

// CONFIRMAR
if (interaction.customId === 'confirmar') {

const mediador = mediadores[0]

const embed = new EmbedBuilder()
.setTitle('✅ APOSTA INICIADA')
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
.setCustomId('sala')
.setLabel('Fornecer Sala')
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId('finalizar')
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

const embed = new EmbedBuilder()
.setTitle('💸 PAGAMENTO')
.setDescription(`
Chave PIX:
11999999999
`)
.setThumbnail(interaction.guild.iconURL())
.setColor('#00ff88')

interaction.reply({
embeds: [embed]
})
}

// SALA
if (interaction.customId === 'sala') {

const embed = new EmbedBuilder()
.setTitle('🎮 SALA')
.setDescription(`
ID: 123456

Senha: 123
`)
.setThumbnail(interaction.guild.iconURL())
.setColor('#00ff88')

interaction.reply({
embeds: [embed]
})
}

// FINALIZAR
if (interaction.customId === 'finalizar') {

interaction.reply({
content: 'Aposta finalizada'
})

setTimeout(() => {
interaction.channel.delete()
}, 5000)
}
})

// COMANDOS TEXTO
client.on('messageCreate', async message => {

if (message.author.bot) return

// .p
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

// .ssmob
if (message.content === '.ssmob') {

const canal = message.guild.channels.cache.find(
c => c.name === 'solicitacao-ss'
)

if (canal) {

const embed = new EmbedBuilder()
.setTitle('🚨 SOLICITAÇÃO SS MOBILE')
.setDescription(`${message.author}`)
.setColor('#ff0000')

canal.send({
embeds: [embed]
})
}
}

// .ssemu
if (message.content === '.ssemu') {

const canal = message.guild.channels.cache.find(
c => c.name === 'solicitacao-ss'
)

if (canal) {

const embed = new EmbedBuilder()
.setTitle('🚨 SOLICITAÇÃO SS EMULADOR')
.setDescription(`${message.author}`)
.setColor('#ff0000')

canal.send({
embeds: [embed]
})
}
}
})

client.login(process.env.TOKEN)
