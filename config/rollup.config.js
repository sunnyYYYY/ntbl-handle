import {version} from '../package.json'

const name = 'handle'
const banner =
  '/*!\n' +
  ' * '+ name +' v' + version + '\n' +
  ' * (c) 2017-' + new Date().getFullYear() + ' Sunny\n' +
  ' * Released under the MIT License.\n' +
  ' */'

const getConfig = format => ({
  input: 'dist/index.js',
  output: {
    file: `src/${name}.${format}.js`,
    format,
    banner,
    name,
  },
})


export default getConfig(process.env.TARGET)

