const SegmentAnalytics = require('analytics-node')
const Url = require('url-parse')
const sha256 = require('js-sha256').sha256

const hash = str => str === null ? null : Buffer.from(sha256.digest(str)).toString('hex')
const domain = str => new Url(str).hostname

class Analytics {
  constructor (client) {
    this.client = client
  }

  _track (data = {}, id) {
    if (this.client) {
      data.anonymousId = id || '3box'
      data.properties.time = Date.now()
      return this.client.track(data)
    } else {
      return false
    }
  }
}

class AnalyticsNode extends Analytics {
  // trackOpenDB (address, duration) {
  //   let data = {}
  //   data.event = 'open_db'
  //   data.properties = { address: address, duration: duration }
  //   this._track(data)
  // }

  trackPinDB (did, newAccount) {
    let data = {}
    data.event = 'pin_db'
    data.properties = { new_account: newAccount }
    this._track(data, hash(did))
  }

  // backwards compatible, pindb for dbs with address links not in rootstore
  trackPinDBAddress (address) {
    let data = {}
    data.event = 'pin_db_address'
    data.properties = { address_hash: hash(address) }
    this._track(data, hash(address))
  }

  trackSyncDB (odbAddress) {
    let data = {}
    data.event = 'sync_db'
    data.properties = { address: odbAddress }
    this._track(data)
  }

  trackInfraMetrics () {
    let data = {}
    data.event = 'infra_metrics'
    data.properties = {
      resident_memory_usage: process.memoryUsage().rss / 1024 / 1024,
      heap_total_memory: process.memoryUsage().heapTotal / 1024 / 1024,
      heap_used_memory: process.memoryUsage().heapUsed / 1024 / 1024
    }
    this._track(data)
  }

  trackSpaceUpdate (address, spaceName, did) {
    let data = {}
    data.event = 'space_update'
    data.properties = { address, space: spaceName }
    this._track(data, hash(did))
    this.trackSpaceUpdateByApp(address, spaceName) // Temporary, to get uniques on spaceNames
  }

  trackSpaceUpdateByApp (address, spaceName) {
    let data = {}
    data.event = 'space_update_app'
    data.properties = { address, space: spaceName }
    this._track(data, spaceName)
  }

  trackPublicUpdate (address, did) {
    let data = {}
    data.event = 'public_update'
    data.properties = { address }
    this._track(data, hash(did))
  }

  trackPrivateUpdate (address, did) {
    let data = {}
    data.event = 'private_update'
    data.properties = { address }
    this._track(data, hash(did))
  }

  // TODO differentiate types of updates
  trackRootUpdate (did) {
    let data = {}
    data.event = 'root_update'
    data.properties = { }
    this._track(data, hash(did))
  }

  trackThreadUpdate (address, space, name) {
    let data = {}
    data.event = 'thread_update'
    data.properties = { address, space, name }
    this._track(data)
  }
}

class AnalyticsAPI extends Analytics {
  trackListSpaces (address, status, origin) {
    let data = {}
    data.event = 'api_list_spaces'
    data.properties = { address: address, status, origin: domain(origin) }
    this._track(data, domain(origin))
  }

  trackGetConfig (address, status, origin) {
    let data = {}
    data.event = 'api_get_config'
    data.properties = { address: address, status, origin: domain(origin) }
    this._track(data, domain(origin))
  }

  trackGetThread (address, status, origin) {
    let data = {}
    data.event = 'api_get_thread'
    data.properties = { address: address, status, origin: domain(origin) }
    this._track(data, domain(origin))
  }

  trackGetSpace (address, name, spaceExisted, status, origin) {
    let data = {}
    data.event = 'api_get_space'
    data.properties = { address: address, name: name, profile_existed: spaceExisted, status, origin: domain(origin) }
    this._track(data, domain(origin))
  }

  trackGetProfile (address, profileExisted, status, origin) {
    let data = {}
    data.event = 'api_get_profile'
    data.properties = { address: address, profile_existed: profileExisted, status, origin: domain(origin) }
    this._track(data, domain(origin))
  }

  trackGetProfiles (status, origin) {
    let data = {}
    data.event = 'api_get_profiles'
    data.properties = { status, origin: domain(origin) }
    this._track(data, domain(origin))
  }
}

module.exports = (writeKey, active = true) => {
  const client = writeKey && active ? new SegmentAnalytics(writeKey) : null
  return {
    api: new AnalyticsAPI(client),
    node: new AnalyticsNode(client)
  }
}
