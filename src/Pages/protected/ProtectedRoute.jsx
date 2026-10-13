






import { Navigate } from "react-router-dom";

const ProtectedRoute = ({children}) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn === 'true') {
        return children;
    }else{
        return  <Navigate to='/login' replace/>
    }
    
}
export default ProtectedRoute