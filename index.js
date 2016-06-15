var through = require('through')
var compiler = require('./lib/compiler')

compiler.loadConfig()

module.exports = function vueify (file, options) {
  if (!/.vue$/.test(file)) return through()
  compiler.applyConfig(options)

  var data = ''
  var stream = through(write, end)

  function dependency(file) {
    stream.emit('file', file)
  }

  function write(buf) {
    data += buf
  }

  function end () {
    stream.emit('file', file)
    compiler.on('dependency', dependency)

    compiler.compile(data, file, function(error, result) {
      compiler.removeListener('dependency', dependency)
      if (error) {
        stream.emit('error', error)
        // browserify doesn't log the stack by default...
        console.error(error.stack.replace(/^.*?\n/, ''))
      }
      stream.queue(result)
      stream.queue(null)
    })
  }

  return stream
}

// expose compiler
module.exports.compiler = compiler
