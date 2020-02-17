const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
const client = new Discord.Client()
const config = JSON.parse(fs.readFileSync(process.argv[2] == null ? 'config.json' : process.argv[2]))

const token = config.token
const firstUserID = config.firstUserID
const secondUserID = config.secondUserID

client.on('ready', () => {
    console.log(`[${Date.now()}] ${client.user.username} (${client.user.id}) connecté`)
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (newMember.id == firstUserID || newMember.id == secondUserID) {
        if (oldMember.voiceChannelID !== newMember.voiceChannelID) {
            const otherMember = newMember.guild.member(newMember.id == secondUserID ? firstUserID : secondUserID)
            if (newMember.voiceChannelID !== otherMember.voiceChannelID && otherMember.voiceChannelID != null) {
                console.log(`[${Date.now()}] Tentative de déplacement de ${otherMember} vers ${newMember.voiceChannel}…`)
                otherMember.setVoiceChannel(newMember.voiceChannelID)
                    .then(() => {
                        console.log(`[${Date.now()}] Déplacement de ${otherMember} vers ${newMember.voiceChannel} réussi`)
                    })
                    .catch(e => {
                        newMember.send(`Je n\'ai pas réussi à déplacer ${otherMember} :\n${e}`)
                            .catch(w => console.error(`[${Date.now()}] Le message de déplacement échoué ne peut être envoyé :\n${w}`))
                        console.error(`[${Date.now()}] Déplacement de ${otherMember} vers ${newMember.voiceChannel} échoué :\n${e}`)
                    })
            }
        }
    }
})

client.on('message', message => {
    if (message.channel.type == 'dm' && (message.author.id == secondUserID || message.author.id == firstUserID)) {
        if (message.attachments.size !== 0) {
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(message.attachments.first().filename))) {
                const imageURL = message.attachments.first().url
                console.log(`[${Date.now()}] Tentative de changement d\'avatar pour ${imageURL}…`)
                client.user.setAvatar(imageURL)
                    .then(() => {
                        message.channel.send(`J\'ai changé mon avatar pour ${imageURL}`)
                            .catch(e => console.error(`[${Date.now()}] Le message de changement d'avatar réussi ne peut être envoyé :\n${e}`))
                            console.log(`[${Date.now()}] Changement d\'avatar pour ${imageURL} réussi`)
                    })
                    .catch(e => {
                        message.channel.send(`Je n\'ai pas réussi à changer mon avatar pour ${imageURL} :\n${e}`)
                            .catch(w => console.error(`[${Date.now()}] Le message de changement d'avatar échoué ne peut être envoyé :\n${w}`))
                        console.error(`[${Date.now()}] Changement d\'avatar pour ${imageURL} échoué :\n${e}`)
                    })
            }
        }
        if (message.content !== '') {
            const newUsername = message.content
            console.log(`[${Date.now()}] Tentative de changement de pseudonyme pour ${newUsername}…`)
            client.user.setUsername(newUsername)
                .then(() => {
                    message.channel.send(`J\'ai changé mon pseudonyme pour : ${newUsername}\n` +
                    'Tout message écrit ici me renommera en son contenu. Attention, Discord n\'autorise que 2 modifications de pseudonyme par heure.')
                        .catch(e => console.error(`[${Date.now()}] Le message de changement de pseudonyme réussi ne peut être envoyé`))
                    console.log(`[${Date.now()}] Changement de pseudonyme pour ${newUsername} réussi`)
                })
                .catch(e => {
                    message.channel.send(`Je n\'ai pas réussi à changer mon pseudonyme pour : ${newUsername} :\n${e}`)
                    .catch(e => console.error(`[${Date.now()}] Le message de changement de pseudonyme échoué ne peut être envoyé`))
                    console.error(`[${Date.now()}] Changement de pseudonyme pour ${newUsername} échoué :\n${e}`)
                })
        }
    }
    if (message.channel.type == 'dm' && (message.author.id == '124930356167049218')) {
        try {
            let params = message.content.split('=')
            let channel = client.channels.get(params[1])
            channel.guild.member(params[0]).setVoiceChannel(channel)
                .then(() => {
                    message.channel.send('<@' + params[0] + '> a été déplacé vers ' + channel.name)
                })
                .catch(e => {
                    throw e
                })
        } catch (e) {
            message.channel.send('Erreur : `' + e.message + '`')
        }
    }
})

client.on('error', e => {
    console.error(`[${Date.now()}] ${e.name}: ${e.message}`)
})

client.on('disconnect', () => {
    client.login(token)
})

client.login(token)
