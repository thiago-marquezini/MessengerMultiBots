class NitroUser
{
	  constructor(NG_USER_INFORMATION, NG_BOT_INFORMATION)
	  {
	     this.NG_FBM_ACCESS_TOKEN = NG_USER_INFORMATION["token"];
	     this.NG_USER_ID		  = NG_USER_INFORMATION["id"];

	     this.FB_BOT_ID		  = NG_BOT_INFORMATION["id"];
	     this.FB_BOT_NAME	  = NG_BOT_INFORMATION["name"];

	     this.NG_RAW_USER     = NG_USER_INFORMATION;
	     this.NG_RAW_BOT      = NG_BOT_INFORMATION;
	  }

	  token()
	  {
	  	return this.NG_FBM_ACCESS_TOKEN;
	  }

	  url()
	  {
	  	return 'https://fb.nitrogram.com.br/fbot/!webhook/' + this.NG_FBM_ACCESS_TOKEN;
	  }
}


module.exports = NitroUser;