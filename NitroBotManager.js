	

	const NitroDatabaseManager = require('./NitroDatabase.js');
	const NitroMessageQueue = require('./MessageQueue.js');
	const NitroSpecLayouts = require('./SpecLayouts.js');

	const BootBot = require('bootbot');
	const fetch = require('node-fetch');
		
	String.prototype.replaceAll = function(search, replacement) 
	{
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};

	class NitroBotManager
	{

		constructor() 
	  	{
	  		this.SystemDatabase = new NitroDatabaseManager();
	  		this.MessageQueuer = new NitroMessageQueue();
	  		this.SpecLayouts = new NitroSpecLayouts();

	  		this.BotsBasePort = 3000;
	  		this.MinReplyDelay = 2000;
	  		this.MaxReplyDelay = 5000;
	  		this.SystemBots = [];

	  		this.MessageQueuer.start();
	  	}

	  	Database()
	  	{
	  		return this.SystemDatabase;
	  	}

	  	ReplyTimingDelay()
	  	{
	  		return Math.floor(Math.random() * (this.MaxReplyDelay - this.MinReplyDelay + 1)) + this.MinReplyDelay;
	  	}

	  	ReloadTriggers(BotId)
	  	{
	  		this.SystemBots[BotId][5] = [];
	  		this.ResetTriggers(BotId);
	  	}

	  	ResetTriggers(BotId)
	    {
	    	return this.SystemBots[BotId][1].resetkeywords();
	    }

	    RegisterTriggers(DataRow, BotId)
	  	{
	  		for (var bqr = 0; bqr < DataRow.length; bqr++)
	    	{
	    		let JObjTrigger = JSON.parse(DataRow[bqr]["input_text"]);
		    	let JObjLength = Object.keys(JObjTrigger).length;

		    	for (var jobj = 0; jobj < JObjLength; jobj++)
		    	{
		    		this.SystemBots[BotId][5].push(JObjTrigger[jobj]);
		    	}
	    	}
	  	}

	  	BotIndexFromId(BotId)
	  	{
	  		var bId = -1;

	  		for (var bC = 0; bC < this.SystemBots.length; bC++)
	  		{
	  			if (this.SystemBots[bC][4].id == BotId)
	  			{
	  				bId = bC;
	  				break;
	  			}
	  		}

	  		return bId;
	  	}

	  	GetUserActiveBots(User)
	  	{
	  		var userbots = [];

	  		for (var ub = 0; ub < this.SystemBots.length; ub++)
	  		{
	  			if (this.SystemBots[ub][3].id == User.id)
	  			{
	  				var activebot = this.SystemBots[ub][4];

	  				var activebotinfo = { "id": activebot.id, 
	  									  "name": activebot.name, 
	  									  "port": activebot.port, 
	  									  "pageid": activebot.pageid };

	  				userbots.push();
	  			}
	  		}

	  		return  JSON.parse(JSON.stringify(userbots));
	  	}

	  	CloseBot(BotId)
	  	{
	  		this.SystemBots[BotId][1].close();
	  		unset(this.SystemBots[BotId]);

	  		return BotId;
	  	}

	  	RestartBot(BotId, UserId)
	  	{
	  		var BotIndex = this.BotIndexFromId(BotId);

	  		if (BotIndex >= 0)
	  		{
	  			if (this.SystemBots[BotIndex][2]) // If port is set, bot is online
		  		{
		  			var BotInfo = this.SystemBots[BotIndex][4];

			  		this.SystemBots[BotIndex][1].close();
			  		this.SystemBots[BotIndex][1] = new BootBot({ messagequeuer: this.MessageQueuer, 
			  												  	 accessToken: BotInfo.page_token, 
			  												  	 verifyToken: BotInfo.verify_token, 
			  												  	 appSecret: BotInfo.app_secret});

			  		this.SetupEssentials(BotIndex);

			  		this.SetupCommomReplies(BotId);
			  		this.SetupCardReplies(BotId);

					this.StartBot(BotIndex);

					return BotId;

		  		} else
		  		{
		  			return -1;
		  		}

	  		} else
	  		{
	  			// Invalid Bot Id
	  		}
	  	}

	  	StartBot(BotId)
		{
			this.SystemBots[BotId][1].start(this.SystemBots[BotId][2]);
			this.Database().query( 'UPDATE autobots_fb SET port = ? WHERE user = ? AND active = ?', [ this.SystemBots[BotId][2], this.SystemBots[BotId][3].NG_USER_ID, "1" ] );
		}

	    CreateBot(NG_USER_INFORMATION, NG_BOT_INFORMATION)
	    {
	   		var BotId = this.SystemBots.length;
	   		var BotPort = BotId + this.BotsBasePort;

	   		var UserInfo = JSON.parse(JSON.stringify(NG_USER_INFORMATION));
	   		var BotInfo  = JSON.parse(JSON.stringify(NG_BOT_INFORMATION));



	   		this.SystemBots.push([BotId + 1, 
	   							  new BootBot({ messagequeuer: this.MessageQueuer, 
	   							  				accessToken: BotInfo.page_token, 
	   							  				verifyToken: BotInfo.verify_token, 
	   							  				appSecret: BotInfo.app_secret}), 
	   							  BotPort, 
	   							  UserInfo,
	   							  BotInfo,
	   							  []]);

	   		this.SetupEssentials(BotId);

	   		this.SetupCommomReplies(BotId);
	   		this.SetupCardReplies(BotId);

			this.StartBot(BotId);

			return BotId + 1;
	    }

	    SetupGetStartedButton(BtnText, BotId)
	    {
	    	this.SystemBots[BotId][1].setGetStartedButton(BtnText);

	    	this.SystemBots[BotId][1].hear(/gif (.*)/i, (payload, chat, data) => 
	    	{
			  const query = data.match[1];
			  chat.say('Searching for the perfect gif...');
			  fetch(`http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=` + query)
			    .then(res => res.json())
			    .then(json => 
			    {
			      chat.say({
			        attachment: 'image',
			        url: json.data.image_url
			      }, 
			      {
			        typing: true
			      });
			    });
			});
	    }

	    SetupGreetingsMessage(Text, BotId)
	    {
	    	this.SystemBots[BotId][1].setGreetingText(Text);;
	    }

	    SetupBotExtensionUrl(BotId)
	    {
	    	this.SystemBots[BotId][1].setHomeUrl('https://dash.nitrogram.com.br/me');
	    }


	    SetupEssentials(BotId)
	    {
	    	var UserInfo = this.SystemBots[BotId][3];

	    	this.SetupBotExtensionUrl(BotId);

	    	// -- Get Started Button -- //
	    	this.Database().query( 'SELECT getstarted_text FROM fb_essentials WHERE token = ? LIMIT 1', UserInfo.token )
			.then( UserDataRow => 
			{
				this.SetupGetStartedButton(UserDataRow[0]["getstarted_text"], BotId);
			} );

			// -- Greetings Message -- //
	    	this.Database().query( 'SELECT greetings_text FROM fb_essentials WHERE token = ? LIMIT 1', UserInfo.token )
			.then( UserDataRow => 
			{
				this.SetupGreetingsMessage(UserDataRow[0]["greetings_text"], BotId);
			} );

			// -- Unhandled Message -- //
			this.Database().query( 'SELECT unhandled_text FROM fb_essentials WHERE token = ? LIMIT 1', UserInfo.token )
			.then( UserDataRow => 
			{
				this.SetupUnhandledTriggers(UserDataRow[0]["unhandled_text"], BotId);
			} );

			// -- Persistent Menu -- //
			this.Database().query( 'SELECT bot_menu FROM fb_essentials WHERE token = ? LIMIT 1', UserInfo.token )
			.then( UserDataRow => 
			{
				this.SetupPersistentMenu(UserDataRow[0]["bot_menu"], BotId, false);
			} );
	    }


	    SetupUnhandledTriggers(Message, BotId)
	    {

	    	this.SystemBots[BotId][1].on('message', (payload, chat) => 
			{
				 var RegisteredTrigger = false;

				 let Triggers = this.SystemBots[BotId][5];
				 let RecvText = payload.message.text;

				 for (var tgr = 0; tgr < Triggers.length; tgr++)
				 {
				 	if (RecvText == Triggers[tgr])
				 	{
				 		RegisteredTrigger = true;
				 		break;
				 	}
				 }

				 if (!(RegisteredTrigger))
				 {
				 	const BotReply = setTimeout(() => 
				    {
						chat.say(Message, { typing: true });

					}, this.ReplyTimingDelay());
				 	
				 }

			});
	    }

	  

	    SetupPersistentMenu(Menu, BotId, DisableInput)
	    {
	    	var BotMenu = JSON.parse(Menu);

	    	// Itens do Menu
			this.SystemBots[BotId][1].setPersistentMenu(
			[

			 BotMenu

			], DisableInput);

			this.SystemBots[BotId][1].on('postback:PAYBILL_PAYLOAD', (payload, chat) => 
			{
				chat.say(`I'm here to help!`, { typing: true });
			});

			this.SystemBots[BotId][1].on('postback:HISTORY_PAYLOAD', (payload, chat) => 
			{
			  	chat.say(`I'm here to help!`, { typing: true });
			});

			this.SystemBots[BotId][1].on('postback:CONTACT_INFO_PAYLOAD', (payload, chat) => 
			{
			 	chat.say(`I'm here to help!`, { typing: true });
			});

	    }


	    SetupCardReplies(BotId)
	    {
	    	var UserInfo = this.SystemBots[BotId][3];
	    	
	    	this.Database().query( 'SELECT * FROM fb_cardreplies WHERE token = ? AND botid = ?', [ UserInfo.token, BotId + 1 ] )
			.then( DataRow => 
			{
				var CRCount = DataRow.length;

				for (var iCRc = 0; iCRc < CRCount; iCRc++)
				{
			    	let cTrigger = JSON.parse(DataRow[iCRc]["input_text"]);
			    	let cTitle = DataRow[iCRc]["title"];
			    	let cSubTitle = DataRow[iCRc]["subtitle"];
			    	let cImageUrl = DataRow[iCRc]["image_url"];

			    	let cDefaultAction = JSON.parse(DataRow[iCRc]["default_action"]);
			    	let cButtons = JSON.parse(DataRow[iCRc]["buttons"]);

			    	this.SystemBots[BotId][1].hear(cTrigger, (payload, chat) => 
					{
						let cardproto = this.SpecLayouts.cards.generic;
						let sharebtn = this.SpecLayouts.buttons.share;

						cardproto.title = cTitle;
						cardproto.subtitle = cSubTitle;
						cardproto.image_url = cImageUrl;
						cardproto.default_action = cDefaultAction;
						cardproto.buttons = [ sharebtn ];

						//this.SpecLayouts.set_shareable_card(cardproto);

				        chat.say(
				        {
				        	cards: [ cardproto ],
				        	typing: true
						});

				    });
				}

			});

	        

	    }

	    SetupCommomReplies(BotId)
	    {
	    	var UserInfo = this.SystemBots[BotId][3];
	    	
	    	this.Database().query( 'SELECT * FROM fb_autoreplies WHERE token = ? AND botid = ?', [ UserInfo.token, BotId + 1 ] )
			.then( DataRow => 
			{
				var ARCount = DataRow.length;

				for (var iARc = 0; iARc < ARCount; iARc++)
				{

				  	let TriggerType = DataRow[iARc]["type"];

			    	let Trigger = JSON.parse(DataRow[iARc]["input_text"]);
			    	let MsgReply = JSON.parse(DataRow[iARc]["output_text"]);

			    	let QuickOpts = DataRow[iARc]["tags"];
			    	let Buttons = DataRow[iARc]["buttons"];

			    	let LinkUrl = DataRow[iARc]["link_url"];
				    let ImageUrl = DataRow[iARc]["image_url"];

			    	let ShowTyping = DataRow[iARc]["showtyping"];


			    	this.SystemBots[BotId][1].hear(Trigger, (payload, chat) => 
					{

						let Tag_FirstName = /{primeiro_nome}/;
						let Tag_LastName = /{segundo_nome}/;
						let Tag_BotName = /{bot_nome}/;

						let FormattedText = MsgReply[0];

						//chat.getUserProfile().then((user) => 
						//{

						    // Replace Tags
							if (FormattedText.match(Tag_FirstName))
							{ FormattedText = FormattedText.replaceAll(Tag_FirstName, "José"); }
							if (FormattedText.match(Tag_LastName))
							{ FormattedText = FormattedText.replaceAll(Tag_LastName, "Dirceu"); }
							if (FormattedText.match(Tag_BotName))
							{ FormattedText = FormattedText.replaceAll(Tag_BotName, this.SystemBots[BotId][4].name); }


							const BotReply = setTimeout(() => 
						    {
						    	if (TriggerType == "text") 
						    	{ 
						    		chat.say(FormattedText,
									{
										typing: ShowTyping
									});
						    	} 

						    	if (TriggerType == "tags") 
						    	{ 
						    		chat.say(
									{
										text: FormattedText,
										quickReplies: JSON.parse(QuickOpts),
										typing: ShowTyping
									});
						    	} 

						    	if (TriggerType == "buttons") 
						    	{ 
						    		chat.say(
									{
										text: FormattedText,
										buttons: JSON.parse(Buttons),
										typing: ShowTyping
									});
						    	}

						    	if (TriggerType == "image") 
						    	{ 
						    		chat.say(
									{
										attachment: 'image',
										url: ImageUrl,
										typing: ShowTyping
									});
						    	}

						    	if (TriggerType == "link") 
						    	{ 

						    		chat.say(LinkUrl, 
						    		{
										typing: ShowTyping
									});
						    	} 

								
							}, this.ReplyTimingDelay());

						//});

					});


					this.RegisterTriggers(DataRow, BotId);
				}
		    	

			});
	
	    }




		SetupConversations(BotId)
		{
			var UserInfo = this.SystemBots[BotId][3];

	    	// -- Special Conversations -- //
			this.Database().query( 'SELECT * FROM fb_conversations WHERE token = ?', UserInfo.token )
			.then( DataRow => 
			{
				DataRow.forEach(function(Row) 
		    	{
		    		this.SystemBots[BotId][1].hear('Quero assinar!', (payload, chat) => 
					{
						const askGender = (convo) => 
						{
						  convo.ask((convo) => 
						  {
						    const buttons = 
						    [
						      { type: 'postback', title: 'Male', payload: 'GENDER_MALE' },
						      { type: 'postback', title: 'Female', payload: 'GENDER_FEMALE' },
						      { type: 'postback', title: 'I don\'t wanna say', payload: 'GENDER_UNKNOWN' }
						    ];

						    convo.sendButtonTemplate(`Are you a boy or a girl?`, buttons);

						  }, (payload, convo, data) => 
						  {
						    const text = payload.message.text;
						    convo.set('gender', text);

						    convo.say(`Great, you are a ${text}`).then(() => askAge(convo));
						  }, 

						  [
						    {
						      event: 'postback',
						      callback: (payload, convo) => 
						      {
						        convo.say('You clicked on a button').then(() => askAge(convo));
						      }
						    },
						    {
						      event: 'postback:GENDER_MALE',
						      callback: (payload, convo) => 
						      {
						        convo.say('You said you are a Male').then(() => askAge(convo));
						      }
						    },
						    {
						      event: 'quick_reply',
						      callback: () => {}
						    },
						    {
						      event: 'quick_reply:COLOR_BLUE',
						      callback: () => {}
						    },
						    {
						      pattern: ['yes', /yea(h)?/i, 'yup'],
						      callback: () => {
						        convo.say('You said YES!').then(() => askAge(convo));
						      }
						    }
						  ]);
						};

						const askAge = (convo) => 
						{
						  convo.ask(`Final question. How old are you?`, (payload, convo, data) => 
						  {
						    const text = payload.message.text;
						    convo.set('age', text);
						    convo.say(`That's great!`).then(() => {
						      convo.say(`Ok, here's what you told me about you:
						      - Name: ${convo.get('name')}
						      - Favorite Food: ${convo.get('food')}
						      - Gender: ${convo.get('gender')}
						      - Age: ${convo.get('age')}
						      `);
						      convo.end();
						    });
						  });
						};


						const sendSummary = (convo) => 
						{
							convo.say(`Confirmado, informações do pedido:
						      - Nome: ${convo.get('name')}
						      - Pacote: ${convo.get('food')}`);

					      convo.end();
						};
					
					
						const askFavoriteFood = (convo) => 
						{
							convo.ask(`Qual pacote você gostaria de assinar? 1 ou 2 ?`, (payload, convo) => 
							{
								const text = payload.message.text;

								convo.set('food', text);
								convo.say(`Certo, você escolheu o Pacote ${text}`).then(() => sendSummary(convo));
							});
						};
						
						const round_one = (convo) => 
						{
							convo.ask(`Olá! Para começar diga-nos seu nome.`, (payload, convo) => 
							{
								const round_one_reply = payload.message.text;

								convo.set('round_one_reply', round_one_reply);

								convo.say(`Olá, seu nome é ${round_one_reply}`).then(() => askFavoriteFood(convo));
							});
						};
					
						chat.conversation((convo) => 
						{
							round_one(convo);
						});
						
					});

					// Register Triggers
		    		this.RegisterTriggers(DataRow, BotId);

		    	}); // Each Row

			}); // DB Query

		}
		
		
	}


	
module.exports = NitroBotManager;