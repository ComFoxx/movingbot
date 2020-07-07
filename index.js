const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
const client = new Discord.Client()
const config = JSON.parse(fs.readFileSync(process.argv[2] == null ? 'config.json' : process.argv[2]))

const token = config.token
const userAssociation = config.userAssociation
const admins = config.admin

var log = (info, error = false) => error ? console.error(`[${Date.now()}] ${info}`) : console.log(`[${Date.now()}] ${info}`)
var notAdmins = []

client.on('ready', () => {
	log(`${client.user.username} (${client.user.id}) connecté`)
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
	if (oldMember.channelID !== newMember.channelID) {
		if (userAssociation.map(a => a[0]).includes(newMember.id) || userAssociation.map(a => a[1]).includes(newMember.id)) {
			const otherMember = newMember.guild.member(userAssociation.map(a => a[0]).includes(newMember.id) ? userAssociation[userAssociation.map(a => a[0]).indexOf(newMember.id)][1] : userAssociation[userAssociation.map(a => a[1]).indexOf(newMember.id)][0])
			if (otherMember !== null && otherMember.voice.channelID !== null && newMember.channelID !== otherMember.voice.channelID && newMember.guild === otherMember.voice.guild) {
				log(`Tentative de déplacement de ${otherMember} vers ${newMember.channel}…`)
				otherMember.voice.setChannel(newMember.channelID, `Déplacement automatique`)
					.then(() => {
						log(`Déplacement de ${otherMember} vers ${newMember.channel} réussi`)
					})
					.catch(e => {
						if (newMember.member !== null) {
							newMember.member.send(`Je n'ai pas réussi à déplacer ${otherMember} : \`\`\`${e}\`\`\``)
								.catch(w => log(`Le message de déplacement automatique échoué n'a pas pu être envoyé :\n${w}`, true))
						}
						log(`Déplacement de ${otherMember} vers ${newMember.channel} échoué :\n${e}`, true)
					})
			}
		}
	}
})

client.on('message', async message => {
	if (message.channel.type === 'dm') {
		if (admins.includes(message.author.id)) {
			if (message.attachments.size !== 0) {
				if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(message.attachments.first().name).toLowerCase())) {
					const imageURL = message.attachments.first().proxyURL
					log(`Tentative de changement d'avatar pour ${imageURL}…`)
					client.user.setAvatar(imageURL)
						.then(() => {
							message.channel.send(`J'ai changé mon avatar pour ${imageURL}`)
								.catch(e => log(`Le message de changement d'avatar réussi n'a pas pu être envoyé :\n${e}`, true))
							log(`Changement d'avatar pour ${imageURL} réussi`)
						})
						.catch(e => {
							message.channel.send(`Je n'ai pas réussi à changer mon avatar pour ${imageURL} : \`\`\`${e}\`\`\``)
								.catch(w => log(`Le message de changement d'avatar échoué n'a pas pu être envoyé :\n${w}`, true))
							log(`Changement d'avatar pour ${imageURL} échoué :\n${e}`, true)
						})
				}
			} else if (message.content.startsWith('rename ')) {
				const newUsername = message.content.substring(7)
				log(`Tentative de changement de pseudonyme pour ${newUsername}…`)
				client.user.setUsername(newUsername)
					.then(() => {
						message.channel.send(`J'ai changé mon pseudonyme pour \`${newUsername}\`\n` +
						'Attention, Discord n\'autorise que 2 modifications de pseudonyme par heure.')
							.catch(e => log(`Le message de changement de pseudonyme réussi n'a pas pu être envoyé :\n${e}`, true))
						log(`Changement de pseudonyme pour ${newUsername} réussi`)
					})
					.catch(e => {
						message.channel.send(`Je n'ai pas réussi à changer mon pseudonyme pour \`${newUsername}\` : \`\`\`${e}\`\`\``)
							.catch(e => log(`Le message de changement de pseudonyme échoué n'a pas pu être envoyé :\n${e}`, true))
						log(`Changement de pseudonyme pour ${newUsername} échoué :\n${e}`, true)
					})
			} else if (message.content.startsWith('status ')) {
				const status = message.content.substring(7).match(/^(PLAYING|WATCHING|LISTENING) (.+)$/im)
				if (status !== null) {
					log(`Tentative de changement de statut pour le statut "${status[2]}" de type ${status[1]}…`)
					client.user.setActivity(status[2], { type: status[1] })
						.then(() => {
							message.channel.send(`J'ai changé mon statut pour \`${status[0]}\``)
								.catch(e => log(`Le message de changement de statut réussi n'a pas pu être envoyé :\n${e}`, true))
							log(`Changement de statut pour ${status[0]} réussi`)
						})
						.catch(e => {
							message.channel.send(`Je n'ai pas réussi à changer mon statut pour \`${status[0]}\` : \`\`\`${e}\`\`\``)
								.catch(e => log(`Le message de changement de statut échoué n'a pas pu être envoyé :\n${e}`, true))
							log(`Changement de statut pour ${status[0]} échoué :\n${e}`, true)
						})
				} else {
					message.channel.send(`Le statut doit débuter par PLAYING, WATCHING ou LISTENING suivi du texte du statut séparé par un espace`)
						.catch(e => log(`Le message de changement de statut impossible n'a pas pu être envoyé :\n${e}`, true))
					log(`Changement de statut impossible avec la commande "${message.content}"`)
				}
			} else if (message.content.includes('=')) {
				try {
					const params = message.content.split('=')
					const channel = await client.channels.fetch(params[1]).catch(e => {
						message.channel.send(`Je n'ai pas trouvé le salon vocal ayant pour identifiant ${params[1]} : \`\`\`${e}\`\`\``)
							.catch(w => log(`Le message de salon vocal non trouvé n'a pas pu être envoyé :\n${w}`, true))
						log(`Salon vocal ${params[1]} non trouvé`, true)
						throw e
					})
					if (channel.type !== 'voice') {
						message.channel.send(`Le salon ${channel} n'est pas un salon vocal`)
							.catch(e => log(`Le message de salon non vocal n'a pas pu être envoyé :\n${e}`, true))
						log(`Le salon ${channel} n'est pas un salon vocal`, true)
						throw `${channel} is not a voice channel`
					}
					const member = await channel.guild.members.fetch(params[0]).catch(e => {
						message.channel.send(`Je n'ai pas trouvé l'utilisateur <@${params[0]}> sur le serveur du salon ${channel} : \`\`\`${e}\`\`\``)
							.catch(w => log(`Le message d'utilisateur non trouvé n'a pas pu être envoyé :\n${w}`, true))
						log(`L'utilisateur <@${params[0]}> n'a pas été trouvé sur le serveur du salon ${channel}`, true)
						throw e
					})
					log(`Tentative de déplacement de ${member} vers ${channel}…`)
					member.voice.setChannel(channel, `Déplacement demandé par un administrateur`)
						.then(() => {
							message.channel.send(`J'ai déplacé ${member} vers ${channel}`)
								.catch(e => log(`Le message de déplacement réussi n'a pas pu être envoyé :\n${e}`, true))
							log(`Déplacement de ${member} vers ${channel} réussi`)
						})
						.catch(e => {
							message.channel.send(`Je n'ai pas réussi à déplacé ${member} vers ${channel} : \`\`\`${e}\`\`\``)
								.catch(e => log(`Le message de déplacement échoué n'a pas pu être envoyé :\n${e}`, true))
							log(`Déplacement échoué :\n${e}`, true)
						})
				} catch (e) {
					message.channel.send(`Déplacement impossible\nRappel : *IdentifiantUtilisateur*=*IdentifiantSalonVocal*`)
						.catch(w => log(`Le message de déplacement impossible n'a pas pu être envoyé :\n${w}`, true))
					log(`Déplacement impossible :\n${e}`, true)
				}
			} else {
				message.channel.send(`Désolé, je ne sais pas ce que vous voulez`)
					.catch(e => log(`Le message d'incompréhension n'a pas pu être envoyé :\n${e}`, true))
			}
		} else if (message.author.id !== client.user.id) {
			if (!notAdmins.includes(message.author.id)) {
				message.channel.send(`Je ne peux pas répondre à votre demande car vous n'êtes pas administrateur.`)
					.catch(e => log(`Le message au non-administrateur n'a pas pu être envoyé :\n${e}`, true))
				notAdmins.push(message.author.id)
			}
		}
	}
})

client.on('error', e => {
	log(`${e.name}: ${e.message}`, true)
})

client.login(token)
