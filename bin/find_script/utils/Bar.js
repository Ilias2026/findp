require('colors')
const f = (args, ...kwargs) => {
    const _args = args.map(a => a.replace(/(\n\s+)|(\n)/g, ''))
    return _args.map((str, index) => {
        return `${str}${kwargs[index] || ""}`
    }).join('')
}

const types = {
    clean: {
        full: '█',
        empty: ' ',
        colsures: ['|', '|']
    },
    classic: {
        full: '*',
        empty: ' ',
        colsures: ['[', ']']
    }
}

module.exports = class Bar {
    /**
     * 
     * @param {Object} props 
     * @param {number} props.total
     * @param {string} props.message
     * @param {string} props.full
     * @param {string} props.empty
     * @param {number} props.width
     * @param {string} props.unit
     */
    constructor(props) {
        this._total = props.total;
        this.position = 0;
        this.message = props.message || '[:bar]';
        this.full = props.full;
        this.empty = props.empty;
        this.unit = props.unit ? ` ${props.unit}` : '';
        this.width = props.width || 40;

        this.type = types[props.type] || types['classic']
        this.type = {
            ...this.type,
            full: this.full || this.type.full,
            empty: this.empty || this.type.empty,
        }

        this.rotateValues = ['/', '—', '\\', '|']
        this.rotatePos = 0
        this.rotateSpeed = 150

        for (let event of ['beforeExit', 'SIGINT', 'SIGTERM']) {
            process.on(event, () => {
                !this.doneTicks && this.done(false)
                process.exit()
            })
        }
        this.start()
    }

    rotateAnimation() {
        this.rotatePos = (this.rotatePos + 1) % this.rotateValues.length
    }

    update() {
        this.showProgress()
    }

    start() {
        this.rotateTimeout = setInterval(() => {
            this.rotateAnimation()
            this.update()
        }, this.rotateSpeed)
    }
    /**
     * 
     * @param {number} by 
     * @returns 
     */
    tick(by) {
        this.position += (by || 1);
        if (this.doneTicks || this.position > this._total) {
            return
        }
        if (this.position !== this._total) {
            this.showProgress()
        }
        else this.done()
    }

    setTicks(_with) {
        this.position = _with;
        this.tick(0)
    }

    set total(totalNumber) {
        if (totalNumber > this._total) {
            this.doneTicks = false
        }
        this._total = totalNumber;
    }

    get total() {
        return this._total;
    }

    moveTotal(by) {
        this._total += by;
    }

    clear() {
        process.stdout.clearLine()
        process.stdout.write('\r')
    }

    done(end = true) {
        if (this.doneTicks) return false;
        this.doneTicks = true;
        if (end) {
            this._total = this.position;
        }
        if (this.showProgress()) {
            if (this._total !== this.position) {
                process.stdout.write(` --- ${" not finished ".bgYellow.black}`)
            }
            process.stdout.write(`\n`)
        }
        clearInterval(this.rotateTimeout)
    }

    showProgress() {
        if (!this._total) return false;
        let full = Math.ceil((this.position / this._total) * this.width)
        let empty = this.width - full
        const end = empty === 0
        let rotate
        if (!end) {
            rotate = ` ${this.rotateValues[this.rotatePos]}`
        } else {
            rotate = ''
        }
        const bar = f`${this.type.colsures[0]}
            ${this.type.full.repeat(full)}
            ${this.type.empty.repeat(empty)}
            ${this.type.colsures[1]}${rotate}`;

        const detailedBar = f`${bar} 
        ${this.position} / ${this._total}${this.unit}  •  
        ${Math.ceil(new Number((this.position / this._total) * 100)).toFixed("0")}%`;

        const str = this.message.replace(/\[:bar\]/, detailedBar)
        this.clear()
        process.stdout.write(`${str}`)
        return true;
    }
}