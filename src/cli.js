#!/usr/bin/env node

/**
 * @file
 *
 * cli
 * The executable configured by the package.
 */

const { Observable: O } = require('rxjs/Rx')
const Immutable = require('immutable')
const debug = require('debug')('rss-o-bot')

const H = require('./lib/helpers')
const Errors = require('./lib/errors')
const { throwO, NO_PRIVATE_KEY_FOUND, NO_REMOTE_CONFIGURED } = Errors
const initStore = require('./lib/store')(H)
const Notify = require('./lib/notify')(H)
const opml = require('./lib/opml')(H)
const remote = require('./lib/remote')(H)
const pollFeeds = require('./lib/pollFeeds')(H)
const Server = require('./lib/server')(H, Errors)
const genKeys = require('./lib/gen-keys')(H, Errors)

/* Pure modules */
const Config = require('./lib/config')(H)
const Argv = require('./lib/argv')

const commands = [
  [
    'add',
    args => !!args.get(0),
    state =>
      O.of(state).switchMap(H.setUpEnv(initStore))
        .switchMap(([store, config, url, ...filters]) =>
          store.insertFeed(url, filters.map(H.transformFilter))
            .switchMap(feed =>
              pollFeeds.queryFeed(store)(feed)
                .defaultIfEmpty(feed.get('id'))
            )
            .switchMap(store.findById)
        )

        .map(f => [f])
        .switchMap(H.printFeeds)
  ],
  [
    'rm',
    args => !!args.get(0),
    state =>
      O.of(state).switchMap(H.setUpEnv(initStore))
        .switchMap(([{ removeFeed }, config, id]) => removeFeed(id))
  ],
  [
    'list',
    true,
    state =>
      O.of(state).switchMap(H.setUpEnv(initStore))
        .switchMap(([{ listFeeds }]) => listFeeds())
        .switchMap(H.printFeeds)
  ],
  [
    'poll-feeds',
    true,
    state =>
      O.of(state).switchMap(H.setUpEnv(initStore))
        .switchMap(([store, config]) =>
          require('.')
            .pollFeeds(Notify(config))(store, true)
        )
  ],
  [
    'test-notification',
    true,
    state =>
      Notify(state.get('configuration'))('Test', state.get('arguments').first() || 'test', 'Test Title')
  ],
  [
    'import',
    (args) => !!args.get(0),
    state =>
      O.of(state).switchMap(H.setUpEnv(initStore))
        .map(([store]) => store)
        // TODO: Perform readFile here instead of inside opml.import
        .switchMap(opml.import(state.get('arguments').first()))
        .switchMap(H.printFeeds)
  ],
  [
    'export',
    true,
    state =>
      O.of(state).switchMap(H.setUpEnv(initStore))
        .map(([ store ]) => store)
        .switchMap(opml.export)
  ],
  [
    ['run'],
    true,
    state => O.create(o => {
      require('.')(state)
    })
  ],
  [
    ['-h', '--help', 'help'],
    true,
    state =>
      O.of(state)
        .switchMap(H.buildMan)
        .map(({ synopsis }) => `${synopsis}Please refer to \`man rss-o-bot\`, \`rss-o-bot --manual\` or the README for further instructions.`)
  ],
  [
    ['-m', '--manual', '--man', 'manual'],
    true,
    state =>
      O.of(state)
        .switchMap(H.buildMan)
        .map(({ raw }) => raw)
  ],
  [
    ['-v', '--version', 'version'],
    true,
    state => O.create(o => {
      const packageInfo = require('../package.json')
      o.next(`RSS-o-Bot Version: ${packageInfo.version}`)
      o.complete()
    })
  ],
  [
    'build-man',
    true,
    state =>
      O.of(state)
        .switchMap(() => H.mkdirDeep(`${__dirname}/../dist/docs`))
        .switchMap(H.buildMan)
        .switchMap(({ man }) => H.writeFile(`${__dirname}/../dist/docs/rss-o-bot.1`, man))
        .map(() => 'Man built'),
    true
  ],
  [
    'ping',
    true,
    state => {
      if (state.get('mode') === 'local') {
        return throwO(NO_REMOTE_CONFIGURED)
      } else if (state.get('mode') === 'remote') {
        const privK = state.get('privateKey')
        if (!privK) return throwO(NO_PRIVATE_KEY_FOUND)
        debug('Sending ping.')
        return remote.send(
          privK,
          H.getRemoteUrl(state.get('configuration'))
        )({ command: 'ping', args: [] })
      } else if (state.get('mode') === 'server') {
        return O.of('pong')
      }
    },
    H.scope.SHARED
  ],
  [
    'gen-keys',
    true,
    state => {
      /* Generate a key pair */
      const serverUrl = H.getRemoteUrl(state.get('configuration'))
      return (
        genKeys(state.get('configuration'))
          .switchMap(() => getKeys(state))
          /* Send the public key to the server */
          .do(() => debug(`Sending public key to ${serverUrl}`))
          .switchMap(([, pubK]) => remote.send(
            null,
            serverUrl,
            /* Do it insecurely */
            true
          )(pubK.toString()))
          .map((res) =>
            res.output
              ? 'Keys generated and public key transmitted to server.'
              : Errors.create(res.error)
          )
      )
    },
    H.scope.LOCAL
  ]
]

const runCommand = state => {
  const mode = state.get('mode')
  const config = state.get('configuration')
  /* Execute the command locally */
  if (mode === 'local' || H.shouldRunOnRemote(state.get('scope'))) {
    debug('Running command locally.')
    return state.get('command')(state)
  /* Send to a server */
  } else if (mode === 'remote') {
    debug('Sending command as remote')
    return (
      H.readFile(H.privateKeyPath(config))
        .switchMap(privK =>
          remote.send(privK, H.getRemoteUrl(config))({
            command: state.get('command'),
            arguments: state.get('arguments').toJS()
          })
        )
    )
  } else if (mode === 'server') {
    /* Ignore any command passed, since there's only
     * `run` on the server.
     */
    return Server.run(commands)(state)
  } else {
    throw new Error(`Unexpected state mode is set to ${mode}`)
  }
}

const getKeys = state => {
  const config = state.get('configuration')
  return O.combineLatest(
    /* If a keyfile can't be opended, simply assume it isn't there */
    H.readFile(H.privateKeyPath(config)).catch(() => O.of(undefined)),
    H.readFile(H.publicKeyPath(config)).catch(() => O.of(undefined))
  )
}

const runCLI = (
  argv = process.argv,
  configLocations = Config.locations,
  config
) =>
  O.of(argv)
    /* Extract arguments */
    .map(Argv.extractArguments)
    /* Get config */
    .switchMap(state =>
      (config
        ? O.of(Immutable.fromJS(config)).map(Config.applyDefaults)
        : Config.readConfig(state.getIn(['switches', 'config']) || configLocations)
      )
        .map(Config.applyOverrides(state.get('switches')))
        .map(c => state.set('configuration', c))
    )
    /* Define mode */
    .map(state =>
      state.set(
        'mode',
        state.getIn(['configuration', 'remote'])
          ? 'remote'
          : state.getIn(['configuration', 'mode'])
      )
    )
    .map(H.getCommand(commands))
    .switchMap(state =>
      state.get('mode') === 'server' ||
      state.get('mode') === 'remote'
        ? getKeys(state).map(([priv, pub]) =>
          state
            .set('publicKey', pub)
            .set('privateKey', priv)
        )
        : O.of(state)
    )
    /* Run command */
    .switchMap(runCommand)

module.exports = runCLI

if (!process.env['RSS_O_BOT_TESTING_MODE']) {
  runCLI()
    .subscribe(
      console.log,
      Errors.log
    )
}

