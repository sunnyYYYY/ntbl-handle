import {terser} from "rollup-plugin-terser"
import {version} from '../package.json'

const name = 'handle'
const banner =
  '/*!\n' +
  ' * '+ name +' v' + version + '\n' +
  ' * (c) 2017-' + new Date().getFullYear() + ' Sunny\n' +
  ' * Released under the MIT License.\n' +
  ' */'

const getConfig = format => {
  const min = format[0] === '@'
  if (min) format = format.substring(1)

  return {
    input: 'src/index.js',
    output: {
      file: `dist/${name}.${format}.${min ? 'min.' : ''}js`,
      format,
      banner,
      name,
    },
    plugins: [].concat(min && terser()),
    external: ['merge'],
  }
}


export default getConfig(process.env.TARGET)

