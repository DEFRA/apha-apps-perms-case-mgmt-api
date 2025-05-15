import crypto from 'crypto'

const options = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'M',
  'N',
  'P',
  'R',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9'
]

const pick = () => {
  return options[Math.floor(crypto.randomInt(0, options.length))]
}

const generateSegment = () => {
  return new Array(4).fill(null).map(pick).join('')
}

export const getApplicationReference = () => {
  const partOne = generateSegment()
  const partTwo = generateSegment()
  return `TB-${partOne}-${partTwo}`
}
