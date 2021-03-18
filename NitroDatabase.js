var mysql = require('mysql');

class NitroDatabaseManager
{
	constructor()
	{
		this.ConnectionPool  = mysql.createPool(
		{
			connectionLimit : 50,
			host            : '172.106.11.140',
			port			: '3306',
			user            : 'nitrogra_mbots',
			password        : 'fm76WWY',
			database        : 'nitrogra_mbots'
		});
	}


	query( sql, args ) 
	{
		return new Promise( ( resolve, reject ) => 
		{
			this.ConnectionPool.getConnection(function(err, connection) 
			{

				connection.query( sql, args, ( err, rows ) => 
				{
					if ( err ) return reject( err );

					connection.release();
					resolve( rows );
				} );

			});

		} );
	}
};

module.exports = NitroDatabaseManager;