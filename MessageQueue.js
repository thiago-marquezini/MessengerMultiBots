
const NitroDatabaseManager = require('./NitroDatabase.js');
var crypto = require('crypto');
var moment = require('moment');

class NitroMessageQueue
{

	constructor()
	{
		// Queue Settings
		this.ThreadLoopInterval = 10000;
		this.MaxProcessingItens = 10;
		this.IntervalThread = 0;
		this.QueueCounter = 0;
		this.LastQueueLength = 0;
		this.QueueTargetDb = 0;

		// Database
		this.QueueTargetDb = new NitroDatabaseManager();

		// Storage Objects
		this._OnQueueObjs = [];
		this.OnQueueObjs = [];

		// Queue flags
		this.ProcessingQueue = false;

		// Queue Attachment Message Prototype
		this.AttachmentMessageProto =  {
								"quid": "",
							    "sender": { "id": "" },
							    "recipient": { "id": "" },
							    "timestamp": "",
							    "keyword": "",
							    "is_echo": "",
							    "message":  { "mid":"", 
							    		  	  "seq":"", 
							    		  	  "attachments": []
							    			}
							 };

		// Queue Message Prototype
		this.MessageProto =  {
								"quid": "",
							    "sender": { "id": "" },
							    "recipient": { "id": "" },
							    "timestamp": "",
							    "keyword": "",
							    "is_echo": "",
							    "message":  { "mid":"", 
							    		  	  "seq":"", 
							    		  	  "text":"" 
							    			}
							 };

		// Queue Message Delivery Prototype
		this.DeliveryProto = {
								"quid": "",
							    "sender": { "id": "" },
							    "recipient": { "id": "" },
							    "timestamp": "",
							    "delivery": { "mids":[], 
							    			  "watermark":"",
							    		  	  "seq":""
							    			}
							 };

		// Queue Message Read Prototype
		this.ReadProto =     {
								"quid": "",
							 	"sender": { "id": "" },
							    "recipient": { "id": "" },
							    "timestamp": "",
							    "read": { "watermark":"","seq":""}
						     };
	}

	stop()
	{
		clearInterval(this.IntervalThread);
	}

	database()
	{
		return this.QueueTargetDb;
	}

	queueitemaction(item)
	{
		if (item.account_linking)
		{
			/*
			{
			  "sender":
			  {
			    "id":"USER_ID"
			  },
			  "recipient":
			  {
			    "id":"PAGE_ID"
			  },
			  "timestamp":1234567890,
			  "account_linking":
			  {
			    "status":"linked", // or 'unlinked'
			    "authorization_code":"PASS_THROUGH_AUTHORIZATION_CODE"
			  }
			}
			*/    
		}

		if (item.message)
		{

			this.database().query( 'SELECT id FROM fb_activity WHERE sender = ? AND recipient = ? AND timestamp = ?', [ item.sender.id, item.recipient.id, item.timestamp ] )
			.then( DataRow => 
			{
				if (DataRow.length == 0)
				{
					var message = JSON.stringify(item.message);
					var jmessage = JSON.parse(message);

					var additemvals =  { sender: item.sender.id, 
										 recipient: item.recipient.id,
										 timestamp: item.timestamp,
										 receivedat: moment().format('yyyy-mm-dd hh:mm:ss');,
										 keyword: item.keyword,
										 event: 'message',
										 echo: item.is_echo,
										 mid: crypto.createHash('md5').update(item.message.mid).digest("hex"),
										 seq: item.message.seq,
										 text: (jmessage.text !== null) ? jmessage.text : '0',
										 status: '0'
								  	   };

					this.database().query("INSERT INTO fb_activity SET ?", additemvals);
				}
			});
		}


		if (item.delivery)
		{

			if (item.delivery.mids.length)
			{

				for (var im = 0; im < item.delivery.mids.length; im++)
				{
					let HashMid = crypto.createHash('md5').update(item.delivery.mids[im]).digest("hex");

					this.database().query( 'SELECT * FROM fb_activity WHERE mid = ? LIMIT 1', [ HashMid ] )
					.then( DataRow => 
					{
						if (DataRow.length == 1)
						{
							var additemvals =  { sender: item.sender.id, 
										 		 recipient: item.recipient.id,
										 		 mid: HashMid,
										 		 watermark: item.delivery.watermark
									   		   };

							this.database().query("INSERT INTO fb_activity_tracker SET ?", additemvals);

							var ActivityMid = DataRow[0]["mid"];
							this.database().query("UPDATE fb_activity SET status = ? WHERE mid = ?", [ "1", ActivityMid ]);

						} else
						{
							this.insertevent(item);
						}

					});

				}

			}
			
			
		}

		if (item.read)
		{

			this.database().query( 'SELECT watermark, mid FROM fb_activity_tracker WHERE watermark = ? LIMIT 1', [ item.read.watermark ] )
			.then( DataRow => 
			{
				if (DataRow.length == 1)
				{

					var ActivityWatermark = DataRow[0]["watermark"];
					var ActivityMid = DataRow[0]["mid"];

					this.database().query( 'SELECT * FROM fb_activity WHERE mid = ? LIMIT 1', [ ActivityMid ] )
					.then( DataRow => 
					{
						if (DataRow.length == 1)
						{
							var ActivityMid = DataRow[0]["mid"];
							this.database().query("UPDATE fb_activity SET status = ?, watermark = ? WHERE mid = ?", [ "2", ActivityWatermark, ActivityMid ]);
							this.database().query("DELETE FROM fb_activity_tracker WHERE watermark = ?", [ ActivityWatermark ]);
						}

					});

				} else
				{
					this.insertevent(item);
				}

			});
		}

	}

	start()
	{
		this.IntervalThread = setInterval(() => 
		{
		  	// Setup queue vars
		  	var ProcessedQuIds = [];
		  	this.ProcessingQueue = true;
		  	this.LastQueueLength = this.QueueCounter;

		  	// Adjust Round Length
		  	if (this.LastQueueLength >= this.MaxProcessingItens) { this.LastQueueLength = this.MaxProcessingItens; }

		  	if (this.LastQueueLength > 0)
		  	{
			  	// Process Itens
				for (var cObj = 0; cObj < this.LastQueueLength; cObj++)
				{
					// Process functions
					this.queueitemaction(this.OnQueueObjs[cObj]);

					// Add to processed list for deletion and decrease queue counter
					ProcessedQuIds.push(this.OnQueueObjs[cObj].quid);
					this.QueueCounter--;
				}
		  	}

			// Remove processed itens from queue
			this.remove(ProcessedQuIds);

			// Finish queue processing
			this.ProcessingQueue = false;

			// Get values from alternative database
		  	for (var cObj = 0; cObj < this._OnQueueObjs.length; cObj++)
			{
				this.OnQueueObjs.push(this._OnQueueObjs[cObj]);
			}

			// Reset alternative database
			this._OnQueueObjs = [];

 
		}, this.ThreadLoopInterval);
	}

	loadproto(proto)
	{
		return JSON.parse(JSON.stringify(proto));
	}

	insertmessage(event, keyword, is_echo = "false")
	{
		if (event.message)
		{
			var proto = this.loadproto(this.MessageProto);

			this.QueueCounter++;
			proto.quid = this.QueueCounter;

			proto.sender.id = event.sender.id;
			proto.recipient.id = event.recipient.id;
			proto.timestamp = event.timestamp;
			proto.keyword = keyword;
			proto.is_echo = is_echo;
			proto.message.mid = event.message.mid;
			proto.message.seq = event.message.seq;
			proto.message.text = event.message.text;

			if (!(this.ProcessingQueue))
			{ this.OnQueueObjs.push(proto); 
			} else { this._OnQueueObjs.push(proto);  }
			
		}
	}

	insertevent(event)
	{

		if (event.delivery)
		{
			var proto = this.loadproto(this.DeliveryProto);

			this.QueueCounter++;
			proto.quid = this.QueueCounter;

			proto.sender.id = event.sender.id;
			proto.recipient.id = event.recipient.id;
			proto.timestamp = event.timestamp;
			proto.delivery.mids = event.delivery.mids;
			proto.delivery.seq = event.delivery.seq;
			proto.delivery.watermark = event.delivery.watermark;

			if (!(this.ProcessingQueue))
			{ this.OnQueueObjs.push(proto); 
			} else { this._OnQueueObjs.push(proto);  }
		}

		if (event.read)
		{
			var proto = this.loadproto(this.ReadProto);

			this.QueueCounter++;
			proto.quid = this.QueueCounter;

			proto.sender.id = event.sender.id;
			proto.recipient.id = event.recipient.id;
			proto.timestamp = event.timestamp;
			proto.read.seq = event.read.seq;
			proto.read.watermark = event.read.watermark;

			if (!(this.ProcessingQueue))
			{ this.OnQueueObjs.push(proto); 
			} else { this._OnQueueObjs.push(proto);  }
		}
	}

	remove(quidlist)
	{
		var RmC = 0;
		for (var iObj = 0; iObj < quidlist.length; iObj++)
		{
			for (var dObj = 0; dObj < this.OnQueueObjs.length; dObj++)
			{
				if (this.OnQueueObjs[dObj].quid == quidlist[iObj])
				{
					this.OnQueueObjs.splice(dObj, 1);
					RmC++;

					break;
				}
			}
		}
	}

}

module.exports = NitroMessageQueue;