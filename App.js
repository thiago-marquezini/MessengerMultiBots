
  var express = require('express');
  const request = require('request');
  var bodyParser = require('body-parser');
  const querystring = require('query-string');
  var fs = require('fs');
  var https = require('https');

  const NitroBotManager = require('./NitroBotManager.js');


  var NtBotManager = null;
  var Application = express();


  Application.use(bodyParser.json());
  Application.use(bodyParser.urlencoded({ extended: true }));
  Application.use(express.static('public'));


  Application.post('/!api/:tokenId/menu/:action', (req, res) => /* recipe_id */
  {

    let WebHookToken = req.params.tokenId;
    let WebHookAction = req.params.action;
    let WebHookBody = req.body;

      NtBotManager.Database().query( 'SELECT * FROM users WHERE token = ? LIMIT 1', WebHookToken )
      .then( UserDataRow => 
      {
        if (UserDataRow.length == 1)
        {

        }
      });

  });

  Application.post('/!api/:tokenId/recipes/:action', (req, res) => /* triggers, replies, showtyping => return recipe_id */
  {

    let WebHookToken = req.params.tokenId;
    let WebHookAction = req.params.action;
    let WebHookBody = req.body;

      NtBotManager.Database().query( 'SELECT * FROM users WHERE token = ? LIMIT 1', WebHookToken )
      .then( UserDataRow => 
      {
       
        if (UserDataRow.length == 1)
        {

        }

      });


  });








  // ----------------------- //
  // ------- STOP BOT ------ //
  // ----------------------- //
  Application.get('/!stop/:botId/:tokenId', (req, res) => 
  {
      let WebHookBotId = req.params.botId;
      let WebHookToken = req.params.tokenId;
      let WebHookUserId;

      NtBotManager.Database().query( 'SELECT * FROM users WHERE token = ? LIMIT 1', WebHookToken )
      .then( UserDataRow => 
      {
        if (UserDataRow.length == 1)
        {
            WebHookUserId = UserDataRow[0]["id"];

            NtBotManager.Database().query( 'SELECT * FROM autobots_fb WHERE user = ? AND id = ?', [ WebHookUserId, WebHookBotId ] )
            .then( BotDataRow => 
            {

              if (BotDataRow.length == 1)
              {

                let stop_bot = NtBotManager.CloseBot(WebHookBotId);

                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 'success', id: stop_bot }));

              } else
              {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 'bot_not_found' }));
              }

            });

        } else
        {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(JSON.stringify({ code: 'user_notfound' }));
        }

      } );
  });




  // ----------------------- //
  // ----- RESTART BOT ----- //
  // ----------------------- //
  Application.get('/!restart/:botId/:tokenId', (req, res) => 
  {
      let WebHookBotId = req.params.botId;
      let WebHookToken = req.params.tokenId;
      let WebHookUserId;

      NtBotManager.Database().query( 'SELECT * FROM users WHERE token = ? LIMIT 1', WebHookToken )
      .then( UserDataRow => 
      {
        if (UserDataRow.length == 1)
        {
            WebHookUserId = UserDataRow[0]["id"];

            NtBotManager.Database().query( 'SELECT * FROM autobots_fb WHERE user = ? AND id = ?', [ WebHookUserId, WebHookBotId ] )
            .then( BotDataRow => 
            {

              if (BotDataRow.length == 1)
              {

                let restart_bot = NtBotManager.RestartBot(WebHookBotId, WebHookUserId);

                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 'success', id: restart_bot }));

              } else
              {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 'bot_not_found' }));
              }

            });

        } else
        {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(JSON.stringify({ code: 'user_notfound' }));
        }

      } );
  });


  // ----------------------- //
  // ------ START BOT ------ //
  // ----------------------- //
  Application.get('/!start/:botId/:tokenId', (req, res) => 
  {   
      let WebHookBotId = req.params.botId;
      let WebHookToken = req.params.tokenId;
      let WebHookUserId;


      NtBotManager.Database().query( 'SELECT * FROM users WHERE token = ? LIMIT 1', WebHookToken )
      .then( UserDataRow => 
      {
        if (UserDataRow.length == 1)
        {
            WebHookUserId = UserDataRow[0]["id"];

            NtBotManager.Database().query( 'SELECT * FROM autobots_fb WHERE user = ? AND id = ?', [ WebHookUserId, WebHookBotId ] )
            .then( BotDataRow => 
            {

              if (BotDataRow.length == 1)
              {

                let botid = NtBotManager.CreateBot( UserDataRow[0], 
                                                    BotDataRow[0]
                                                   );

                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 'success', id: botid }));

              } else
              {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({ code: 'bot_not_found' }));
              }

            });

        } else
        {
          res.setHeader('Content-Type', 'application/json');
          res.status(200).send(JSON.stringify({ code: 'user_notfound' }));
        }

      } );
  
  });



  // ----------------------- //
  // ----- BOTS WEBHOOK ---- //
  // ----------------------- //
  Application.post('/!webhook/:tokenId', (req, res) => 
  {  
 
    let WebHookToken = req.params.tokenId;
    let WebHookBody = req.body;

    if (WebHookBody.object === 'page') 
    {

      let PageId = WebHookBody.entry[0].id;

      NtBotManager.Database().query( 'SELECT port FROM autobots_fb WHERE page_id = ? LIMIT 1', PageId )
      .then( UserDataRow => 
      {
          var options = 
          {
            url: 'http://localhost:' + UserDataRow[0]["port"] + '/webhook',
            method: "POST",
            headers: { "content-type": "application/json", },
            json: WebHookBody
          };

          request.post(options, function(e, h, b)
          {
            if (!(e)) { res.status(200).send(b); } else { res.status(200).send(e); }
          });

      } );

    } else 
    {
      console.log("Unknown request:" + JSON.stringify(WebHookBody));
      res.sendStatus(200);
    }

  });


  // ----------------------- //
  // ----- BOTS WEBHOOK ---- //
  // ----------------------- //
  Application.get('/!webhook/:tokenId', (req, res) => 
  {
    let WebHookToken = req.params.tokenId;
    let WebHookQuery = req.query;
    let ReqQueryString = querystring.stringify(WebHookQuery);

    NtBotManager.Database().query( 'SELECT fb_bot_port FROM users WHERE token = ? LIMIT 1', WebHookToken )
    .then( UserDataRow => 
    {
        request.get({url:'http://localhost:' + UserDataRow[0]["fbotport"] + '/webhook?' + ReqQueryString}, function(e, h, b)
        {
          if (!(e)) { res.status(200).send(b); } else { res.status(200).send(e); }
        });

    } );

  });






if (module === require.main) 
{
	
  // SSL
  https.createServer(
  {
      //ca: fs.readFileSync(__dirname + '/nitrogram.com.br.cert'),
      key: fs.readFileSync(__dirname + '/nitrogram.com.br.key'),
      cert: fs.readFileSync(__dirname + '/nitrogram.com.br.cert')
  }
  , Application).listen(8080, function() 
  {
      console.log('-> NitroBots Initialized on ports: [Server: 8080, Bots: 3000~4000]');
      NtBotManager = new NitroBotManager();

  });

  /*
  const server = Application.listen(process.env.PORT || 8080, () => 
  {
    const port = server.address().port;
    console.log(`HTTP Application is LIVE on ${port}.`);
    
	  NtBotManager = new NitroBotManager();
	
  });
  */
  
}

module.exports = Application;
