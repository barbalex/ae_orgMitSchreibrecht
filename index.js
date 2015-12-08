'use strict'

const couchPass = require('./couchPass.json')
const url = `http://${couchPass.user}:${couchPass.pass}@127.0.0.1:5984`
const nano = require('nano')(url)
const adb = nano.db.use('ae')

let docsWritten = 0

function bulkSave (docs) {
  let bulk = {}
  bulk.docs = docs
  adb.bulk(bulk, function (error, result) {
    if (error) return console.log('error after bulk:', error)
    docsWritten = docsWritten + docs.length
    console.log('docsWritten', docsWritten)
  })
}

adb.view('objects', 'objects', {
  'include_docs': true
}, (error, body) => {
  if (error) return console.log(error)
  let docs = []
  let docsPrepared = 0
  body.rows.forEach((row, rowIndex) => {
    const doc = row.doc
    // if lr, add org
    if (doc.Gruppe && doc.Gruppe === 'Lebensräume') doc['Organisation mit Schreibrecht'] = 'FNS Kt. ZH'
    if (doc.Eigenschaftensammlungen) {
      doc.Eigenschaftensammlungen.forEach((es, index) => {
        doc.Eigenschaftensammlungen[index]['Organisation mit Schreibrecht'] = 'FNS Kt. ZH'
      })
    }
    if (doc.Beziehungssammlungen) {
      doc.Beziehungssammlungen.forEach((es, index) => {
        doc.Beziehungssammlungen[index]['Organisation mit Schreibrecht'] = 'FNS Kt. ZH'
      })
    }
    docs.push(doc)
    if ((docs.length > 600) || (rowIndex === body.rows.length - 1)) {
      docsPrepared = docsPrepared + docs.length
      console.log('docsPrepared', docsPrepared)
      // save 600 docs
      bulkSave(docs.splice(0, 600))
    }
  })
})
