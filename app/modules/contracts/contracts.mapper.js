const { _ } = require('@cowellness/cw-micro-service')()

function addressMap (obj) {
  if (obj && obj.length) return obj[0].fulladdress
  return obj
}

function busAddressMap (key) {
  return (obj) => {
    if (obj && obj.length) {
      const ind = obj.findIndex((i) => { return i.type === key })
      if (ind > -1) return obj[ind].fulladdress
    }
    return obj
  }
}

function placeOfBithMap (obj) {
  if (obj) {
    return obj.city + '(' + obj.country + ')'
  }
  return obj
}

function dateOfBirthMap (obj) {
  if (obj) {
    return obj.substring(6) + '-' + obj.substring(4, 6) + '-' + obj.substring(0, 4)
  }
  return obj
}

function idMap (key) {
  return (obj) => {
    if (obj && obj.length) {
      const ind = obj.findIndex((i) => { return i.key === key })
      if (ind > -1) return obj[ind].value
    }
    return obj
  }
}

function emailMap (obj) {
  if (obj && obj.length) {
    return obj.map((o) => {
      return o.email
    }).toString()
  }
  return obj
}

function mobileMap (obj) {
  if (obj && obj.length) {
    return obj.map((o) => {
      return o.prefixNumber + o.phoneNumber
    }).toString()
  }
  return obj
}

function directorMap (obj) {
  if (obj && obj.length) {
    return obj.map((o) => {
      return o.rightProfileId.person.firstname + ' ' + o.rightProfileId.person.lastname
    }).toString()
  }

  return obj
}

class contractParties {
  constructor (business, individual) {
    this.bus = business
    this.ind = individual
    this.isTranformed = false
    // transformation logic mapping
    this.mapping = [{ key: 'source.name', prop: 'person.firstname', type: 'IN', needProcessing: false, value: undefined },
      { key: 'source.surname', prop: 'person.lastname', type: 'IN', needProcessing: false, value: undefined },
      { key: 'source.address', prop: 'person.addresses', type: 'IN', needProcessing: true, process: addressMap, value: undefined },
      { key: 'source.place-of-birth', prop: 'person.birth', type: 'IN', needProcessing: true, process: placeOfBithMap, value: undefined },
      { key: 'source.date-of-birth', prop: 'person.birth.date', type: 'IN', needProcessing: true, process: dateOfBirthMap, value: undefined },
      { key: 'source.personal-identification-number', prop: 'ids', type: 'IN', needProcessing: true, process: idMap('pin'), value: undefined },
      { key: 'source.personal-tax-number', prop: 'ids', type: 'IN', needProcessing: true, process: idMap('tin'), value: undefined },
      { key: 'source.email', prop: 'person.emails', type: 'IN', needProcessing: true, process: emailMap, value: undefined },
      { key: 'source.mobile-phone', prop: 'person.mobilePhones', type: 'IN', needProcessing: true, process: mobileMap, value: undefined },
      { key: 'source.landline-phone', prop: 'person.phones', type: 'IN', needProcessing: true, process: mobileMap, value: undefined },
      { key: 'destination.company-name', prop: 'company.name', type: 'BU', needProcessing: false, value: undefined },
      { key: 'destination.address-legal', prop: 'company.addresses', type: 'BU', needProcessing: true, process: busAddressMap('legal'), value: undefined },
      { key: 'destination.address-operative', prop: 'company.addresses', type: 'BU', needProcessing: true, process: busAddressMap('operative'), value: undefined },
      { key: 'destination.VAT-code-ID', prop: 'ids', type: 'BU', needProcessing: true, process: idMap('vat'), value: undefined },
      { key: 'destination.Fiscal-code-ID', prop: 'ids', type: 'BU', needProcessing: true, process: idMap('fiscal'), value: undefined },
      { key: 'destination.email', prop: 'company.emails', type: 'BU', needProcessing: true, process: emailMap, value: undefined },
      { key: 'destination.mobile-phone', prop: 'company.mobilePhones', type: 'BU', needProcessing: true, process: mobileMap, value: undefined },
      { key: 'destination.landline-phone', prop: 'company.phones', type: 'BU', needProcessing: true, process: mobileMap, value: undefined },
      { key: 'destination.directors', prop: 'directors', type: 'BU', needProcessing: true, process: directorMap, value: undefined }]
  }

  /**
   * transform data mapping to value
   */
  transform () {
    if (!this.bus || !this.ind) throw new Error('Business object or individual object is undefined')
    const internalMap = (obj, i) => { try { return obj[i] } catch { return null } }
    this.mapping.forEach((item) => {
      if (item.prop && item.prop.length) {
        const dataPointer = (item.type === 'BU' ? item.prop.split('.').reduce(internalMap, this.bus) : item.prop.split('.').reduce(internalMap, this.ind))
        if (item.needProcessing && item.process) {
          item.value = item.process(dataPointer)
        } else {
          item.value = dataPointer
        }
      }
    })
    this.isTranformed = true
  }

  /**
   * variable to text replacement based on mapping
   * @param {string} template
   */
  compile (template) {
    if (!this.isTranformed) this.transform()
    if (this.mapping && this.mapping.length) {
      this.mapping.forEach(item => {
        if (item.prop && item.prop.length) {
          const regEx = new RegExp(_.escapeRegExp(`[[${item.key}]]`), 'gi')
          const tagRegEx = new RegExp(`<span data-field="${item.key}"((?!<span).)+/span>`, 'gi')
          template = template.replace(tagRegEx, item.value)
          template = template.replace(regEx, item.value)
        }
      })
    }

    return template
  }
}

module.exports = contractParties
