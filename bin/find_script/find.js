const fs = require('fs')
const path = require('path')
require('colors');

const Bar = require('./utils/Bar')


const bar = new Bar({
    total: 0,
    message: `search progress [:bar]`,
    type: 'clean' || 'classic',
});

String.prototype.multiMatch = function (regex) {
    let str = this, pos = 0;
    const matchStack = []
    while (true) {
        const matched = str.match(regex);
        if (!matched) break;
        const [value] = matched;
        const { index } = matched;
        pos += matched.index;
        matchStack.push({
            index: pos,
        })
        pos += value.length;
        str = str.substr(index + value.length)
    }
    return matchStack;
}

function searchInString(str, keyword) {
    let _str = str;
    const result = _str.multiMatch(new RegExp(keyword, "i"));
    if (result.length) {
        let newStr = ''
        let lastSuffixIndex = 0
        for (let _case of result) {
            let prefix = str.substr(lastSuffixIndex, _case.index - lastSuffixIndex)
            let word = str.substr(_case.index, keyword.length)
            lastSuffixIndex = _case.index + keyword.length
            newStr += `${prefix}${word.green}`
        }
        newStr += str.substr(lastSuffixIndex)
        return newStr;
    }
    return undefined;
}
/* 
console.log(searchInString("searchhaha search lol.txt", "search"))
process.exit()
 */
function padValue(pads, fill = ' ') {
    let size = (pads[pads.length - 1] && pads[pads.length - 1]) || 0
    let strArr = new Array(size).fill(fill)
    for (let d of pads) {
        strArr[d] = '|';
    }
    let value = `${strArr.join('')}${pads.length > 0 ? "_".repeat(2) : ""}`
    return value;
}

/**
 * 
 * @param {string[]} param0 
 * @param {string} param0[0] path for the current file/folder
 * @param {string} param0[1] file name
 * @param {string} keyword search keyword
 * @param {Object} extra 
 * @param {Array} extra.nested parents stack
 * @return {Boolean} return if the file is matched or not
 */
const findR = async ([filePath, fileName], keyword, { nested }) => {
    try {
        const _nested = nested;
        const stats = fs.statSync(filePath)
        let q = searchInString(fileName, keyword);
        if (q) {
            bar.tick()
        }
        if (!stats.isDirectory()) {
            if (q) {
                _nested.push(q)
            }
            return !!q;
        }
        const files = await new Promise(resolve => {
            fs.readdir(filePath, (err, files) => {
                resolve(files && files.sort((a, b) => {
                    const _a = a.toLowerCase()
                    const _b = b.toLowerCase()
                    if (_a > _b) return 1
                    if (_a < _b) return -1
                    return 0
                }))
            })
        })
        if(!files) return false;
        const newNested = []
        newNested.q = q || fileName
        _nested.push(newNested)
        let found = !!q
        bar.total += files.length;
        for (let file of files) {
            let currPath = path.join(filePath, file)
            let found0 = await findR([currPath, file], keyword, {
                nested: newNested,
            })
            if (!found) found = found0
        }
        if (!found) {
            _nested.pop()
        }
        return found
    } catch (error) {
        // console.log(error)
    }
}

const print = (stack, { pads, end }) => {
    const newPads = [...pads]
    let padding = padValue(newPads)
    let q
    if (!Array.isArray(stack)) { //if not directory
        q = stack;
        console.log(padding + q)
        return
    }
    if (end) {
        newPads.pop()
    }
    q = stack.q;
    if (q) {
        console.log(padding + q)
        newPads.push((padding.length + q.stripColors.length) - 1)
    }
    for (let i = 0; i < stack.length; i++) {
        const el = stack[i]
        print(el, { pads: newPads, end: i === stack.length - 1 })
    }
}

const find = async (filePath, { keyword }) => {
    const globalStack = []
    const defaultNames = {
        '/': 'root:'
    }
    filePath = path.resolve(filePath);
    const fileName = defaultNames[filePath] || path.basename(filePath)
    await findR([filePath, fileName], keyword, {
        nested: globalStack,
    })
    bar.clear()
    if (!globalStack.length) {
        console.log('Empty Set!')
    }
    console.log()
    print(globalStack, { pads: [] })
    console.log()
    bar.done()
}

module.exports = find;