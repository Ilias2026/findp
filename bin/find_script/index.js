const yargs = require("yargs")
const { hideBin } = require('yargs/helpers')
const find = require('./find')

const argv = yargs(hideBin(process.argv)).parse()

if (argv._.length < 1) {
    console.log('too few arguments')
    process.exit(1)
} else if (!argv.dir && !argv.d && !argv._[1]) {
    console.log('no directory or file specified')
    process.exit(1)
}

find(argv.d || argv.dir || argv._[1], {
    keyword: argv._[0]
})