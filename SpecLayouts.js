

	class NitroSpecLayouts
	{
	
		constructor()
		{

			this.cards = 
			{
				generic:
				{
		            title: "",
		            subtitle: "",
		            image_url: "",
		            default_action: { type: "web_url",
			        				  url: ""
			        			    },
		            buttons: []
		        }
			};

			this.buttons = 
			{
				call:
				{
		            type:"phone_number",
		            title:"",
		            payload:"+5512997228280"
		         },

				login:
		        {
		            type: "account_link",
		            url: ""
		        },

		        share:
		        {
		        	type: "element_share",
		        	/*
		        	share_contents: 
		        	{ 
		        		attachment: 
		        		{
		        			type: "template",
		        			payload: 
		        			{
		        				template_type: "generic",
		        				elements: 
		        				[
			        				{
			        					title: "<TEMPLATE_TITLE>",
			        					subtitle: "<TEMPLATE_SUBTITLE>",
			        					image_url: "<IMAGE_URL_TO_DISPLAY>",
			        					default_action:
			        					{
			        						type: "web_url",
			        						url: "<WEB_URL>"
			        					},
			        					buttons: 
			        					[
				        					{
				        						type: "web_url",
				        						url: "<BUTTON_URL>", 
				        						title: "<BUTTON_TITLE>"
				        					}
			        					]
			        				}
		        				]
		        			}
		        		}
		        	}
		        	*/
		        }
			};

		}

		generic()
		{
			return this.cards.generic;
		}

	}

	module.exports = NitroSpecLayouts;