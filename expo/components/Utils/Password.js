const bcrypt = require('react-native-bcrypt');
const isaac = require('isaac');

const Password = Component => props => {
  bcrypt.setRandomFallback((number) => {
    const buf = new Uint8Array(number);
    return buf.map(() => Math.floor(isaac.random() * 256));
  });

  const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  return <Component {...props} hashPassword={hashPassword} comparePassword={bcrypt.compare} />
}

export default Password;