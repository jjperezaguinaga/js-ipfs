/* eslint max-nested-callbacks: ["error", 8] */
/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const Stream = require('stream')
const IPFSFactory = require('../../utils/factory-core')
const factory = new IPFSFactory()

describe('floodsub', () => {
  let nodeOffline
  let nodeUnstarted
  let nodeStarted

  let subscription
  let floodsub

  const topic = 'nonscents'
  const message = 'Some message'

  before((done) => {
    factory.spawnNode((err, ipfsOff) => {
      expect(err).to.not.exist
      ipfsOff.goOffline((err) => {
        expect(err).to.not.exist
        nodeOffline = ipfsOff
        factory.spawnNode((err, ipfs) => {
          expect(err).to.not.exist
          nodeStarted = ipfs
          factory.spawnNode((err, ipfs) => {
            expect(err).to.not.exist
            nodeUnstarted = ipfs
            done()
          })
        })
      })
    })
  })

  after((done) => {
    factory.dismantle(() => done())
  })

  describe('Floodsub API', () => {
    describe('start', () => {
      it('throws if offline', () => {
        expect(() => nodeOffline.floodsub.start()).to.throw
      })

      it('success', () => {
        nodeStarted.floodsub.start((err, _floodsub) => {
          expect(err).to.not.exist
          expect(_floodsub).to.exist
          floodsub = _floodsub
        })
      })
    })

    describe('subscribe', () => {
      it('throws if offline', () => {
        expect(() => nodeOffline.floodsub.subscribe()).to.throw
      })

      it('throws if not started', () => {
        expect(() => nodeUnstarted.floodsub.subscribe(topic)).to.throw
      })

      it('throws without a topic', () => {
        expect(() => nodeStarted.floodsub.subscribe()).to.throw
      })

      it('success', (done) => {
        nodeStarted.floodsub.subscribe(topic, (err, stream) => {
          expect(err).to.not.exist
          expect(stream.readable).to.eql(true)
          expect(typeof stream._read).to.eql('function')
          expect(typeof stream.cancel).to.eql('function')
          expect(stream instanceof Stream).to.eql(true)

          subscription = stream

          const nodeSubs = floodsub.getSubscriptions()
          expect(nodeSubs.length).to.eql(1)
          done()
        })
      })
    })

    describe('publish', () => {
      it('throws if offline', () => {
        expect(() => nodeOffline.floodsub.publish()).to.throw
      })

      it('throws if not started', () => {
        expect(() => nodeUnstarted.floodsub.publish(topic, message)).to.throw
      })

      it('throws without a topic', () => {
        expect(() => nodeStarted.floodsub.publish()).to.throw
      })

      it('throws without data', () => {
        expect(() => nodeStarted.floodsub.publish(topic)).to.throw
      })

      it('success', (done) => {
        const published = true

        subscription.on('data', () => done())

        nodeStarted.floodsub.publish(topic, message, () => {
          expect(published).to.eql(true)
        })
      })
    })

    describe('unsubscribe', () => {
      it('throws if offline', () => {
        expect(() => nodeOffline.floodsub.unsubscribe()).to.throw
      })

      it('throws if not started', () => {
        expect(() => nodeUnstarted.floodsub.unsubscribe(topic)).to.throw
      })

      it('throws without a topic', () => {
        expect(() => nodeStarted.floodsub.unsubscribe()).to.throw
      })

      it('success', (done) => {
        nodeStarted.floodsub.unsubscribe(topic, (err) => {
          expect(err).to.not.exist
          const nodeSubs = floodsub.getSubscriptions()
          expect(nodeSubs.length).to.eql(0)
          done()
        })
      })
    })
  })
})
