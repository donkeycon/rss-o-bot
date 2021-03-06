module.exports = {
  '$schema': 'http://json-schema.org/draft-04/schema#',
  'title': 'RSS-O-Bot Configuration File',
  'type': 'object',
  'description': 'RSS-O-Bot Configuration File (config.json)',
  'properties': {
    'nofification-methods': {
      'type': 'array',
      'description': 'Names of notification packages that should be used.',
      'items': { 'type': 'string' },
      'default': []
    },
    'interval': {
      'type': 'number',
      'description': 'The interval (in seconds) in which the Feed-URLs should be polled in.',
      'default': 600
    },
    'database': {
      'type': 'object',
      'description': 'Configuration object that defines a database to store data in.',
      'properties': {
        'name': {
          'type': 'string',
          'description': 'The name of the database'
        },
        'options': {
          'type': 'object',
          'description': 'A sequelize configuration object',
          'properties': {
            'dialect': {
              'type': 'string',
              'description': 'The dialect of the database you are connecting to. One of mysql, postgres, sqlite, mariadb and mssql.',
              'default': 'mysql'
            },
            'dialectModulePath': {
              'type': 'string',
              'description': 'If specified, load the dialect library from this path. For example, if you want to use pg.js instead of pg when connecting to a pg database, you should specify \'pg.js\' here',
              'default': null
            },
            'dialectOptions': {
              'type': 'object',
              'decription': 'An object of additional options, which are passed directly to the connection library'
            },
            'storage': {
              'type': 'string',
              'decription': 'Only used by sqlite. Defaults to \':memory:\''
            },
            'host': {
              'type': 'string',
              'decription': 'The host of the relational database.',
              'default': 'localhost'
            },
            'port': {
              'type': 'integer',
              'decription': 'The port of the relational database.'
            },
            'protocol': {
              'type': 'string',
              'decription': 'The protocol of the relational database.',
              'default': 'tcp'
            },
            'define': {
              'type': 'object',
              'decription': 'Default options for model definitions. See sequelize.define for options',
              'default': {}
            },
            'query': {
              'type': 'object',
              'decription': 'Default options for sequelize.query',
              'default': {}
            },
            'set': {
              'type': 'object',
              'decription': 'Default options for sequelize.set',
              'default': {}
            },
            'sync': {
              'type': 'object',
              'decription': 'Default options for sequelize.sync',
              'default': {}
            },
            'timezone': {
              'type': 'string',
              'decription': 'The timezone used when converting a date from the database into a JavaScript date. The timezone is also used to SET TIMEZONE when connecting to the server, to ensure that the result of NOW, CURRENT_TIMESTAMP and other time related functions have in the right timezone. For best cross platform performance use the format +/-HH:MM. Will also accept string versions of timezones used by moment.js (e.g. \'America/Los_Angeles\'); this is useful to capture daylight savings time changes.',
              'default': '+00:00'
            },
            'omitNull': {
              'type': 'boolean',
              'decription': 'A flag that defines if null values should be passed to SQL queries or not.',
              'default': false
            },
            'native': {
              'type': 'boolean',
              'decription': 'A flag that defines if native library shall be used or not. Currently only has an effect for postgres',
              'default': false
            },
            'replication': {
              'type': 'boolean',
              'decription': 'Use read / write replication. To enable replication, pass an object, with two properties, read and write. Write should be an object (a single server for handling writes), and read an array of object (several servers to handle reads). Each read/write server can have the following properties: `host`, `port`, `username`, `password`, `database`',
              'default': false
            },
            'pool': {
              'type': 'object',
              'decription': 'Should sequelize use a connection pool. Default is true',
              'default': {},
              'maxConnections': {
                'type': 'integer',
                'decription': ' '
              },
              'minConnections': {
                'type': 'integer',
                'decription': ' '
              },
              'maxIdleTime': {
                'type': 'integer',
                'decription': 'The maximum time, in milliseconds, that a connection can be idle before being released'
              },
              'validateConnection': {
                'type': 'function',
                'decription': 'A function that validates a connection. Called with client. The default function checks that client is an object, and that its state is not disconnected'
              }
            },
            'quoteIdentifiers': {
              'type': 'boolean',
              'decription': 'Set to `false` to make table names and attributes case-insensitive on Postgres and skip double quoting of them.',
              'default': true
            },
            'transactionType': {
              'type': 'string',
              'decription': 'Set the default transaction type. See `Sequelize.Transaction.TYPES` for possible options. Sqlite only.',
              'default': 'DEFERRED'
            },
            'isolationLevel': {
              'type': 'string',
              'decription': 'Set the default transaction isolation level. See `Sequelize.Transaction.ISOLATION_LEVELS` for possible options.',
              'default': 'REPEATABLE_READ'
            },
            'retry': {
              'type': 'object',
              'decription': 'Set of flags that control when a query is automatically retried.',
              'match': {
                'type': 'array',
                'decription': 'Only retry a query if the error matches one of these strings.'
              },
              'max': {
                'type': 'integer',
                'decription': 'How many times a failing query is automatically retried.  Set to 0 to disable retrying on SQL_BUSY error.'
              }
            },
            'typeValidation': {
              'type': 'boolean',
              'decription': 'Run built in type validators on insert and update, e.g. validate that arguments passed to integer fields are integer-like.',
              'default': false
            },
            'benchmark': {
              'type': 'boolean',
              'decription': 'Print query execution time in milliseconds when logging SQL.',
              'default': false
            }
          }
        }
      },
      'default': {
        'name': 'rss-o-bot',
        'options': {
          'dialect': 'sqlite',
          'storage': '~/.rss-o-bot/feeds.sqlite'
        }
      },
      'required': ['name', 'options']
    },
    'mode': {
      'type': 'string',
      'descript': 'Set the mode in which RSS-O-Bot should operate',
      'pattern': 'local|remote|server',
      'default': 'local'
    },
    'port': {
      'type': 'number',
      'description': 'The port number that should be used when in server-mode',
      'minimum': 0,
      'maximum': 65535,
      'default': 3645
    },
    'jwt-expiration': {
      'type': 'number',
      'desscription': 'The number of seconds it should take for',
      'minimum': 1,
      'default': 60
    },
    'remote': {
      'type': 'string',
      'description': 'The hostname or IP of the RSS-O-Bot server'
    }
  }
}

