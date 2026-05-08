import { useState } from "react"
import { useLocation } from "react-router-dom"
import './resetpass.css'
function Resetpassword() {

  const location = useLocation()
  const email = new URLSearchParams(location.search).get("email")
  const [password,setpassword] = useState('')
  const handleReset = async () => {
    try{
      const response = await fetch('http://127.0.0.1:8000/reset_password',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
        },
        body:JSON.stringify({email:email,password:password})
      })
      const data=await response.json()
      if (response.ok){
        alert("password Update")
      }else{
        alert(data.message)
      }
      if (!email){
        alert("invalid access.Email missing")
        return;
      }
      console.log(data)
    }catch(error){
      console.log(error)
    }
  }
  return (
    <div className="resetall">
      <h3> Reset Password </h3>
      <input type="password" placeholder="New Password" onChange={(e) => setpassword (e.target.value)}/>
      <button onClick={handleReset}>Update Password</button>
    </div>
  )
}export default Resetpassword