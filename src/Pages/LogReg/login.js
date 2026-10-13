import { useState } from "react"
import './login.css'
import {  useNavigate } from "react-router-dom"
function Sulojana(){
  const [name,setname] = useState("")
  const [pass,setpass] = useState()
  const [wrong,setwrong] = useState('')
  const navigate = useNavigate();
  const login = async () => {
    
    try{
      const response = await fetch ('http://127.0.0.1:8000/login',{
      method:'POST',
      headers: {
        "Content-Type":"application/json",
      },
      body:JSON.stringify({username:name,password:pass})
    })
    const data = await response.json();

    if (response.status === 200) {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("isLoggedIn", "true");
        navigate('/newnavbar')
    }
    else{
      setwrong(data.error)
    }
    console.log(data)

  }catch (error) {
    console.log(error)
    setwrong("Server error")
  }
}
return(
  <div className="login">
    {wrong && <p className="errorstyle" style={{color:"red"}}>{wrong}</p>} 
    <h2 className="heading">Login</h2>
    <p className="usernamelogin"><input type="text" placeholder="Username" onChange={(e)=> setname (e.target.value)}/></p>
    <p className="passwordlogin"><input type="password"placeholder="Password" onChange={(e)=> setpass (e.target.value)}/></p>
    <p className="remember"><label><input type="checkbox"/> Remember Me</label> <a href="forgot_password">Forgot Password?</a></p>
    <p className="submitlogin"><button type="submit" onClick={login}>submit</button></p>
    <p className="create"> You don't have an Account ? <a href="register">Create Account</a></p>
    
  </div>

)
}
export default Sulojana;

