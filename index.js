const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
const client = new Discord.Client()
const config = JSON.parse(fs.readFileSync(process.argv[2] == null ? 'config.json' : process.argv[2]))

const token = config.token
const userAssociation = config.userAssociation

client.on('ready', () => {
	console.log(`[${Date.now()}] ${client.user.username} (${client.user.id}) connecté`)
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
	if (userAssociation.map(a => a[0]).includes(newMember.id) || userAssociation.map(a => a[1]).includes(newMember.id)) {
		if (oldMember.voiceChannelID !== newMember.voiceChannelID) {
			const otherMember = newMember.guild.member(userAssociation.map(a => a[0]).includes(newMember.id) ? userAssociation[userAssociation.map(a => a[0]).findIndex(newMember.id)][1] : userAssociation[userAssociation.map(a => a[1]).findIndex(newMember.id)][0])
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
	if (message.channel.type == 'dm' && message.author.id == '124930356167049218' /* ComFoxx */) {
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
		} else if (message.content.startsWith('rename ')) {
			const newUsername = message.content.substring(7)
			console.log(`[${Date.now()}] Tentative de changement de pseudonyme pour ${newUsername}…`)
			client.user.setUsername(newUsername)
				.then(() => {
					message.channel.send(`J\'ai changé mon pseudonyme pour : ${newUsername}\n` +
					'Attention, Discord n\'autorise que 2 modifications de pseudonyme par heure.')
						.catch(e => console.error(`[${Date.now()}] Le message de changement de pseudonyme réussi ne peut être envoyé`))
					console.log(`[${Date.now()}] Changement de pseudonyme pour ${newUsername} réussi`)
				})
				.catch(e => {
					message.channel.send(`Je n\'ai pas réussi à changer mon pseudonyme pour : ${newUsername} :\n${e}`)
					.catch(e => console.error(`[${Date.now()}] Le message de changement de pseudonyme échoué ne peut être envoyé`))
					console.error(`[${Date.now()}] Changement de pseudonyme pour ${newUsername} échoué :\n${e}`)
				})
		} else if (message.includes('=')) {
			try {
				let params = message.content.split('=')
				let channel = client.channels.get(params[1])
				console.log(`[${Date.now()}] Tentative de déplacement de <@${params[0]}> vers ${channel.name}…`)
				channel.guild.member(params[0]).setVoiceChannel(channel)
					.then(() => {
						message.channel.send(`J'ai déplacé <@${params[0]}> vers ${channel.name}`)
						.catch(e => console.error(`[${Date.now()}] Le message de déplacement réussi ne peut être envoyé`))
						console.error(`[${Date.now()}] Déplacement de ${params[0]} vers ${channel.name} réussi`)
					})
					.catch(e => {
						message.channel.send(`Je n\'ai pas réussi à changer mon pseudonyme pour : ${newUsername} :\n${e}`)
						.catch(e => console.error(`[${Date.now()}] Le message de déplacement échoué ne peut être envoyé`))
						console.error(`[${Date.now()}] Déplacement échoué :\n${e}`)
					})
			} catch (e) {
				message.channel.send(`Je n\'ai pas réussi à déplacer :\n${e}`)
				.catch(e => console.error(`[${Date.now()}] Le message de déplacement échoué ne peut être envoyé`))
				console.error(`[${Date.now()}] Déplacement échoué :\n${e}\nRappel : *IdentifiantUtilisateur*=*IdentifiantSalonVocal*`)
			}
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
