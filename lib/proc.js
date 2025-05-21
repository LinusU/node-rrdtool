import spawn from 'nano-spawn'

const bin = 'rrdtool'
const env = { LANG: 'C' }

export async function create (file, opts, args) {
  const a = []

  if (opts.start) {
    // rrdtool dosen't allow inserting a value onto
    // the start date. Decrese it by one so we can do that.
    a.push('--start', String(opts.start - 1))
  }

  if (opts.step) {
    a.push('--step', String(opts.step))
  }

  if (opts.force !== true) {
    a.push('--no-overwrite')
  }

  await spawn(bin, ['create', file, ...a, ...args], { env })
}

const reDs = /ds\[([a-zA-Z0-9_]+)\].type = "([A-Z]+)"/g
const reRra = /rra\[([0-9]+)\].cf = "([A-Z]+)"/g

export async function info (file) {
  const { stdout } = await spawn(bin, ['info', file], { env })

  const info = { ds: [], rra: [] }

  stdout.replaceAll(reDs, (_, m1, m2) => {
    info.ds.push({ name: m1, type: m2 })
  })

  stdout.replaceAll(reRra, (_, __, m2) => {
    info.rra.push({ cf: m2 })
  })

  return info
}

export async function update (file, ts, values) {
  const keys = Object.keys(values)

  const template = keys.join(':')
  const cmd = [ts, ...keys.map((key) => values[key])].join(':')

  await spawn(bin, ['update', file, '--template', template, cmd])
}

export async function fetch (file, cf, start, stop, res) {
  const args = ['fetch', file, cf]

  // rrdtool counts timestamp very strange, hence the -1
  args.push('--start', String(start - 1))
  args.push('--end', String(stop - 1))

  if (res != null) {
    args.push('--resolution', String(res))
  }

  const { stdout } = await spawn(bin, args, { env })

  const lines = stdout.split('\n')
  const header = lines[0].trim().split(/ +/)

  return lines.slice(2).map((str) => {
    const m = str.split(':')

    return {
      time: Number(m[0]),
      values: m[1].trim().split(/ +/).reduce((p, c, i) => {
        p[header[i]] = (c.trim() === 'nan' ? null : Number(c))
        return p
      }, {})
    }
  })
}

export async function dump (file) {
  return (await spawn(bin, ['dump', file])).stdout
}
