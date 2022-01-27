import { useNavigate, useParams, useLocation } from 'react-router-dom';

const withParams = Component => props => {
  const navigate = useNavigate();
  const params = useParams();
  const { state } = useLocation();
  return <Component navigate={navigate} params={{...state, ...params}} {...props} />
}

export default withParams;